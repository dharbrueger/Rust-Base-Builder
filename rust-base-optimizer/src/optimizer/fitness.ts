/**
 * Fitness scoring for the evolutionary optimizer.
 */

import type { BaseSpec, EvaluationReport, FitnessWeights } from "../base-spec/types.js";
import { BUILD_COSTS } from "../game-data/game-data-table.js";

/** Default fitness weights. */
export const DEFAULT_WEIGHTS: FitnessWeights = {
  sulfurToTC: 1.0,
  sulfurToLoot: 0.5,
  doorPath: 0.5,
  buildCostPenalty: 0.1,
};

/**
 * Computes the total sulfur-equivalent build cost of a base spec.
 * Stone → sulfur at 1:0.5, metal frag → sulfur at 1:1, HQ metal → sulfur at 1:8.
 */
export function totalBuildCostSulfur(spec: BaseSpec): number {
  let total = 0;
  for (const obj of spec.objects) {
    const costs = BUILD_COSTS[obj.builderModelName];
    if (!costs) continue;
    total += costs.stone * 0.5 + costs.metal * 1 + costs.hqMetal * 8;
  }
  return total;
}

/**
 * Counts the number of exterior foundation faces that have no structural
 * object (wall / doorway / window / frame) placed in their wall slot.
 *
 * Open exterior faces are a critical vulnerability — they let raiders walk in
 * for free — so the fitness function applies a heavy per-face penalty.
 */
export function countOpenExteriorFaces(spec: BaseSpec): number {
  const TOLERANCE = 0.3;

  // Index square foundations by rounded (x, z) position.
  const foundations = spec.objects.filter(
    (o) => o.modelType === "foundation" && o.shape === "square"
  );
  const foundSet = new Set(
    foundations.map((f) => `${Math.round(f.position.x)},${Math.round(f.position.z)}`)
  );

  // Index structural wall-like objects by their (x, z) slot (rounded to 1 dp).
  const wallSlots = new Set(
    spec.objects
      .filter(
        (o) =>
          o.isStructural &&
          o.modelType !== "foundation" &&
          o.modelType !== "stairs" &&
          o.modelType !== "floor" &&
          o.modelType !== "floorFrame" &&
          o.modelType !== "roof" &&
          o.modelType !== "roofWall"
      )
      .map((o) => `${Math.round(o.position.x * 10) / 10},${Math.round(o.position.z * 10) / 10}`)
  );

  const hasWallAt = (wx: number, wz: number): boolean =>
    wallSlots.has(
      `${Math.round(wx * 10) / 10},${Math.round(wz * 10) / 10}`
    );

  const DIRS = [
    { dx: 0, dz: -1 }, // north
    { dx: 0, dz: 1 },  // south
    { dx: -1, dz: 0 }, // west
    { dx: 1, dz: 0 },  // east
  ] as const;

  let openFaces = 0;

  for (const f of foundations) {
    const fx = Math.round(f.position.x);
    const fz = Math.round(f.position.z);

    for (const dir of DIRS) {
      // Check whether a neighbour foundation exists two units away.
      const nx = fx + dir.dx * 2;
      const nz = fz + dir.dz * 2;

      if (foundSet.has(`${nx},${nz}`)) {
        // Interior face — skip (interior openness is handled by compartment topology).
        continue;
      }

      // Exterior face: the wall slot is 1 unit from the foundation centre.
      const wx = fx + dir.dx;
      const wz = fz + dir.dz;

      if (!hasWallAt(wx, wz)) {
        openFaces++;
      }
    }
  }

  // Suppress unused variable warning from the TOLERANCE const.
  void TOLERANCE;

  return openFaces;
}

/**
 * Computes a scalar fitness score for an evaluation report.
 * Higher scores = harder to raid (better base design).
 *
 * Formula:
 *   w1*(sulfurToTC/1000) + w2*(sulfurToLoot/1000) + w3*(doorPath/1000)
 *   - w4*(buildCostSulfur/10000)
 *   - 0.5 * openExteriorFaces   ← heavy penalty for unprotected perimeter
 */
export function computeFitness(
  report: EvaluationReport,
  spec: BaseSpec,
  weights: FitnessWeights = DEFAULT_WEIGHTS
): number {
  const buildCost = totalBuildCostSulfur(spec);
  const openFaces = countOpenExteriorFaces(spec);

  return (
    weights.sulfurToTC * (report.sulfurToTC / 1000) +
    weights.sulfurToLoot * ((report.sulfurToLoot ?? 0) / 1000) +
    weights.doorPath * (report.cheapestDoorPathSulfur / 1000) -
    weights.buildCostPenalty * (buildCost / 10000) -
    0.5 * openFaces // 0.5 fitness units ≈ 500 sulfur equivalent per open face
  );
}
