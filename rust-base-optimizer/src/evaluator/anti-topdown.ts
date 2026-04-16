/**
 * Anti-topdown analysis.
 *
 * Computes how many layers of roofs/floors sit above the TC compartment and
 * the minimum sulfur required to destroy them all to reach TC from above.
 */

import type { BaseSpec, CompartmentNode } from "../base-spec/types.js";
import { RAID_COSTS } from "../game-data/game-data-table.js";

export interface TopDownAnalysis {
  layers: number;
  minSulfurToReach: number;
  objectIds: string[];
}

/**
 * Analyses the vertical raid path through roofs and floors above the TC compartment.
 *
 * @param spec         - The normalised base spec.
 * @param tcCompartment - The compartment node that contains the TC.
 */
export function analyzeTopDown(
  spec: BaseSpec,
  tcCompartment: CompartmentNode
): TopDownAnalysis {
  if (tcCompartment.foundationIds.length === 0) {
    return { layers: 0, minSulfurToReach: 0, objectIds: [] };
  }

  // Find the (x, z) bounding box of the TC compartment foundations.
  const tcFoundations = spec.objects.filter((o) =>
    tcCompartment.foundationIds.includes(o.id)
  );
  const xCoords = tcFoundations.map((f) => f.position.x);
  const zCoords = tcFoundations.map((f) => f.position.z);
  const xMin = Math.min(...xCoords) - 1;
  const xMax = Math.max(...xCoords) + 1;
  const zMin = Math.min(...zCoords) - 1;
  const zMax = Math.max(...zCoords) + 1;
  const foundationY = tcFoundations[0]?.position.y ?? 0;

  // Find all roofs and floors above the TC compartment footprint.
  const overhead = spec.objects.filter((o) => {
    if (o.modelType !== "roof" && o.modelType !== "floor" && o.modelType !== "floorFrame") {
      return false;
    }
    if (o.position.y <= foundationY) return false;
    return (
      o.position.x >= xMin &&
      o.position.x <= xMax &&
      o.position.z >= zMin &&
      o.position.z <= zMax
    );
  });

  // Group by y-level (each distinct y level = one layer).
  const yLevels = [...new Set(overhead.map((o) => o.position.y))].sort((a, b) => a - b);

  let totalSulfur = 0;
  const objectIds: string[] = [];

  for (const yLevel of yLevels) {
    const layerObjects = overhead.filter((o) => Math.abs(o.position.y - yLevel) < 0.5);
    // Cheapest way to break through this layer = minimum raid cost object in the layer.
    const minCost = Math.min(
      ...layerObjects.map((o) => RAID_COSTS[o.builderModelName]?.minSulfur ?? Infinity)
    );
    totalSulfur += minCost === Infinity ? 0 : minCost;
    objectIds.push(...layerObjects.map((o) => o.id));
  }

  return {
    layers: yLevels.length,
    minSulfurToReach: totalSulfur,
    objectIds,
  };
}
