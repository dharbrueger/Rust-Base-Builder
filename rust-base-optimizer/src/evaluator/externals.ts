/**
 * External exposure analysis.
 *
 * Identifies walls and structural objects that are directly reachable from
 * the exterior without first destroying another object.  These surfaces are
 * vulnerable to griefing and soft-side exploitation.
 */

import type { BaseSpec, CompartmentGraph, ExposedWallInfo } from "../base-spec/types.js";
import { RAID_COSTS } from "../game-data/game-data-table.js";

/**
 * Returns a list of structural objects that are exposed to the exterior compartment.
 *
 * @param spec  - The normalised base spec.
 * @param graph - The compartment graph.
 */
export function analyzeExternals(
  spec: BaseSpec,
  graph: CompartmentGraph
): ExposedWallInfo[] {
  // Edges touching the exterior compartment.
  const externalEdges = graph.edges.filter(
    (e) => e.fromCompartmentId === "exterior" || e.toCompartmentId === "exterior"
  );

  const results: ExposedWallInfo[] = [];

  for (const edge of externalEdges) {
    if (!edge.structuralObjectId) continue;

    const obj = spec.objects.find((o) => o.id === edge.structuralObjectId);
    if (!obj) continue;

    const sulfurCost = RAID_COSTS[obj.builderModelName]?.minSulfur ?? 0;

    // In Rust, the soft side of a wall is the interior face.
    // We flag all external walls as potentially soft-side exposed; a
    // more accurate analysis would require knowing the wall's facing direction
    // relative to the base exterior (out of scope for the MVP).
    results.push({
      objectId: obj.id,
      isSoftSideExposed: true,
      sulfurCostIfAttacked: sulfurCost,
    });
  }

  return results;
}
