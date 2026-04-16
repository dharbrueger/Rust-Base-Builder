/**
 * Structural graph — physical adjacency between building objects.
 *
 * Nodes are BaseObjects; edges represent "A supports B" or "A is adjacent to B".
 * Each node is tagged with an estimated structural stability (0–100 %).
 *
 * Stability model (simplified):
 *   Foundations = 100 %
 *   Each object supported by another loses 10 % per hop.
 *   Objects with < 50 % are flagged as potential stability-bunker pieces.
 */

import type { BaseObject, BaseSpec, StructuralEdge, StructuralGraph, StructuralNode } from "../base-spec/types.js";

const ADJACENCY_TOLERANCE = 0.3;

/** Euclidean distance in XZ plane only. */
function distXZ(a: BaseObject, b: BaseObject): number {
  const dx = a.position.x - b.position.x;
  const dz = a.position.z - b.position.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Builds a structural graph for a BaseSpec.
 * Edges connect foundations ↔ walls, walls ↔ floors, etc.
 */
export function buildStructuralGraph(spec: BaseSpec): StructuralGraph {
  const nodes = new Map<string, StructuralNode>();
  const edges: StructuralEdge[] = [];
  const adjacency = new Map<string, string[]>();

  // Initialise every object as a node.
  for (const obj of spec.objects) {
    nodes.set(obj.id, { objectId: obj.id, stabilityPct: 0 });
    adjacency.set(obj.id, []);
  }

  const foundations = spec.objects.filter((o) => o.modelType === "foundation");
  const walls = spec.objects.filter((o) =>
    ["wall", "doorway", "window", "wallFrame", "roofWall", "door", "windowInsert"].includes(o.modelType)
  );
  const floors = spec.objects.filter((o) =>
    ["floor", "floorFrame", "roof", "stairs"].includes(o.modelType)
  );

  // Foundations always have 100 % stability.
  for (const f of foundations) {
    const n = nodes.get(f.id);
    if (n) n.stabilityPct = 100;
  }

  // Walls are supported by foundations on the same floor level.
  // A wall sits at the midpoint between two adjacent foundations:
  //   wallX ≈ (f1.x + f2.x) / 2,  wallZ ≈ (f1.z + f2.z) / 2
  //   wallY ≈ foundationY + 1
  for (const wall of walls) {
    for (const f of foundations) {
      const sameLevel = Math.abs(wall.position.y - (f.position.y + 1)) < ADJACENCY_TOLERANCE;
      if (!sameLevel) continue;
      const d = distXZ(wall, f);
      if (d < 1.5) {
        edges.push({ fromId: f.id, toId: wall.id, relation: "supports" });
        edges.push({ fromId: wall.id, toId: f.id, relation: "supportedBy" });
        adjacency.get(f.id)!.push(wall.id);
        adjacency.get(wall.id)!.push(f.id);
      }
    }
  }

  // Floors / roofs sit on top of walls or foundations (y ≈ wallY + 2 or foundationY + 3).
  for (const floor of floors) {
    for (const wall of walls) {
      const sameLevel = Math.abs(floor.position.y - (wall.position.y + 2)) < ADJACENCY_TOLERANCE;
      if (!sameLevel) continue;
      if (distXZ(floor, wall) < 1.5) {
        edges.push({ fromId: wall.id, toId: floor.id, relation: "supports" });
        edges.push({ fromId: floor.id, toId: wall.id, relation: "supportedBy" });
        adjacency.get(wall.id)!.push(floor.id);
        adjacency.get(floor.id)!.push(wall.id);
      }
    }
    // Floors can also be supported by foundations directly.
    for (const f of foundations) {
      const sameLevel = Math.abs(floor.position.y - (f.position.y + 3)) < ADJACENCY_TOLERANCE;
      if (!sameLevel) continue;
      if (distXZ(floor, f) < 1.5) {
        edges.push({ fromId: f.id, toId: floor.id, relation: "supports" });
        adjacency.get(f.id)!.push(floor.id);
        adjacency.get(floor.id)!.push(f.id);
      }
    }
  }

  // Propagate stability: BFS from foundations outward.
  const queue: string[] = [...foundations.map((f) => f.id)];
  const visited = new Set<string>(queue);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentStability = nodes.get(currentId)!.stabilityPct;
    const childStability = Math.max(0, currentStability - 10);

    for (const neighbourId of adjacency.get(currentId) ?? []) {
      if (visited.has(neighbourId)) continue;
      // Only propagate downward (foundation → wall → floor, not the reverse).
      const edge = edges.find(
        (e) => e.fromId === currentId && e.toId === neighbourId && e.relation === "supports"
      );
      if (!edge) continue;
      visited.add(neighbourId);
      const n = nodes.get(neighbourId)!;
      n.stabilityPct = childStability;
      queue.push(neighbourId);
    }
  }

  return { nodes, edges, adjacency };
}
