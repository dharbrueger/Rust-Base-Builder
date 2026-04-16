/**
 * Stability bunker detector.
 *
 * A stability bunker is a structural object that:
 *   1. Has stability < 50 % (the Rust game threshold for "damage-resistant" objects).
 *   2. Lies on a barrier edge in the compartment graph.
 *
 * Objects below the 50 % threshold take more pickaxe hits to destroy, making
 * them effectively more expensive to raid than their material tier alone suggests.
 */

import type {
  BaseSpec,
  CompartmentGraph,
  StabilityBunkerInfo,
  StructuralGraph,
} from "../base-spec/types.js";
import { HP } from "../game-data/game-data-table.js";

/** Approximate damage per pickaxe hit on a structural wall. */
const PICKAXE_DAMAGE_PER_HIT = 20;
/** Stability threshold below which an object qualifies as a bunker piece. */
const BUNKER_STABILITY_THRESHOLD = 50;

/**
 * Detects stability bunker objects in the base.
 *
 * @param spec         - The normalised base spec.
 * @param structGraph  - The structural graph (contains stability scores).
 * @param compartGraph - The compartment graph (contains barrier edges).
 */
export function detectStabilityBunkers(
  spec: BaseSpec,
  structGraph: StructuralGraph,
  compartGraph: CompartmentGraph
): StabilityBunkerInfo[] {
  // Collect all object ids that appear as structural barriers in the compartment graph.
  const barrierObjectIds = new Set<string>(
    compartGraph.edges
      .filter((e) => e.structuralObjectId !== null)
      .map((e) => e.structuralObjectId!)
  );

  const results: StabilityBunkerInfo[] = [];

  for (const [objectId, node] of structGraph.nodes) {
    if (node.stabilityPct === 0 || node.stabilityPct >= BUNKER_STABILITY_THRESHOLD) {
      continue;
    }

    const obj = spec.objects.find((o) => o.id === objectId);
    if (!obj) continue;

    const nominalHp = HP[obj.builderModelName] ?? 0;
    const effectiveHp = Math.round((node.stabilityPct / 100) * nominalHp);
    const pickaxeHits = Math.ceil(effectiveHp / PICKAXE_DAMAGE_PER_HIT);
    const blocksCheaperPath = barrierObjectIds.has(objectId);

    results.push({
      objectId,
      stabilityPct: node.stabilityPct,
      effectiveHp,
      pickaxeHits,
      blocksCheaperPath,
    });
  }

  return results;
}
