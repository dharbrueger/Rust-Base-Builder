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
 * Computes a scalar fitness score for an evaluation report.
 * Higher scores = harder to raid (better base design).
 *
 * Formula: w1*(sulfurToTC/1000) + w2*(sulfurToLoot/1000) + w3*(doorPath/1000)
 *          - w4*(buildCostSulfur/10000)
 */
export function computeFitness(
  report: EvaluationReport,
  spec: BaseSpec,
  weights: FitnessWeights = DEFAULT_WEIGHTS
): number {
  const buildCost = totalBuildCostSulfur(spec);

  return (
    weights.sulfurToTC * (report.sulfurToTC / 1000) +
    weights.sulfurToLoot * ((report.sulfurToLoot ?? 0) / 1000) +
    weights.doorPath * (report.cheapestDoorPathSulfur / 1000) -
    weights.buildCostPenalty * (buildCost / 10000)
  );
}
