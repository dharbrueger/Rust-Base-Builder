/**
 * Compartment graph — detects enclosed spaces (compartments) and the barriers
 * (walls / doors / doorways) between them.
 *
 * Algorithm overview:
 *   1. Collect square foundations, group by floor level.
 *   2. For each adjacent foundation pair, inspect the wall slot at the midpoint.
 *   3. Classify each slot as open / wall / door / etc.
 *   4. Union-Find to merge foundations connected by open slots → compartments.
 *   5. Build edges between compartments for non-open barriers.
 *   6. Create an "exterior" compartment and connect external faces.
 *   7. Tag compartments that contain a ToolCupboard or loot objects.
 *   8. Handle vertical connections via stairs.
 */

import type {
  BarrierEdge,
  BarrierType,
  BaseObject,
  BaseSpec,
  CompartmentGraph,
  CompartmentNode,
} from "../base-spec/types.js";
import { RAID_COSTS } from "../game-data/game-data-table.js";

const TOLERANCE = 0.3;
const EXTERIOR_ID = "exterior";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function approxEq(a: number, b: number): boolean {
  return Math.abs(a - b) < TOLERANCE;
}

/** Rounds to 1 decimal for use as position dict key. */
function posKey(x: number, y: number, z: number): string {
  return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10},${Math.round(z * 10) / 10}`;
}

// ---------------------------------------------------------------------------
// Union-Find
// ---------------------------------------------------------------------------

class UnionFind {
  private parent: Map<string, string> = new Map();

  find(id: string): string {
    if (!this.parent.has(id)) this.parent.set(id, id);
    const p = this.parent.get(id)!;
    if (p !== id) {
      this.parent.set(id, this.find(p));
    }
    return this.parent.get(id)!;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

// ---------------------------------------------------------------------------
// Barrier classification
// ---------------------------------------------------------------------------

function barrierRaidCost(
  structural: BaseObject | undefined,
  insert: BaseObject | undefined
): { type: BarrierType; sulfur: number; structId: string | null; insertId: string | null } {
  if (!structural) {
    return { type: "open", sulfur: 0, structId: null, insertId: null };
  }

  const sModel = structural.builderModelName;

  if (
    sModel.includes("WallHigh") ||
    sModel.includes("WallMid") ||
    sModel.includes("WallLow") ||
    sModel.includes("RoofWall")
  ) {
    const sulfur = RAID_COSTS[sModel]?.minSulfur ?? 0;
    return { type: "wall", sulfur, structId: structural.id, insertId: null };
  }

  if (sModel.includes("Window")) {
    // Windows with inserts are still barriers (too narrow to walk through).
    const sulfur = RAID_COSTS[sModel]?.minSulfur ?? 0;
    return { type: "wall", sulfur, structId: structural.id, insertId: insert?.id ?? null };
  }

  if (sModel.includes("Doorway")) {
    if (!insert) {
      // Open doorway — passable.
      return { type: "open", sulfur: 0, structId: structural.id, insertId: null };
    }
    // Door in doorway.
    const insertSulfur = RAID_COSTS[insert.builderModelName]?.minSulfur ?? 0;
    return {
      type: insert.builderModelName === "GarageDoor" ? "garageDoor" : "door",
      sulfur: insertSulfur,
      structId: structural.id,
      insertId: insert.id,
    };
  }

  if (sModel.includes("WallFrame")) {
    if (!insert) {
      // Empty frame — treat as wall (structurally opaque).
      const sulfur = RAID_COSTS[sModel]?.minSulfur ?? 0;
      return { type: "frame", sulfur, structId: structural.id, insertId: null };
    }
    if (insert.builderModelName === "GarageDoor") {
      const sulfur = RAID_COSTS["GarageDoor"]?.minSulfur ?? 0;
      return { type: "garageDoor", sulfur, structId: structural.id, insertId: insert.id };
    }
    // Other insert in frame (embrasure / glass) — wall.
    const sulfur = Math.max(
      RAID_COSTS[sModel]?.minSulfur ?? 0,
      RAID_COSTS[insert.builderModelName]?.minSulfur ?? 0
    );
    return { type: "windowInsert", sulfur, structId: structural.id, insertId: insert.id };
  }

  // Fallback: unknown structural — treat as open.
  return { type: "open", sulfur: 0, structId: structural.id, insertId: null };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

let _edgeSeq = 0;
function nextEdgeId(): string {
  return `e${++_edgeSeq}`;
}

/**
 * Builds the compartment graph for a BaseSpec.
 *
 * Returns a CompartmentGraph with:
 *   - One node per enclosed space (plus the synthetic "exterior" node).
 *   - One undirected edge per unique wall-slot between compartments.
 */
export function buildCompartmentGraph(spec: BaseSpec): CompartmentGraph {
  _edgeSeq = 0;

  // Index all objects by their position for fast lookup.
  const byPos = new Map<string, BaseObject[]>();
  for (const obj of spec.objects) {
    const k = posKey(obj.position.x, obj.position.y, obj.position.z);
    const arr = byPos.get(k) ?? [];
    arr.push(obj);
    byPos.set(k, arr);
  }

  const getAtPos = (x: number, y: number, z: number): BaseObject[] =>
    byPos.get(posKey(x, y, z)) ?? [];

  // Only square foundations form the grid.
  const squareFoundations = spec.objects.filter(
    (o) => o.modelType === "foundation" && o.shape === "square"
  );

  const uf = new UnionFind();
  const edgesRaw: BarrierEdge[] = [];
  const processedSlots = new Set<string>();

  // For each foundation, check its four cardinal neighbours.
  const DIRS = [
    { dx: 2, dz: 0 },
    { dx: -2, dz: 0 },
    { dx: 0, dz: 2 },
    { dx: 0, dz: -2 },
  ];

  for (const f1 of squareFoundations) {
    const floorLevel = Math.round(f1.position.y / 3);

    for (const dir of DIRS) {
      const nx = f1.position.x + dir.dx;
      const nz = f1.position.z + dir.dz;

      // Look for a neighbouring foundation in that direction.
      const neighbours = squareFoundations.filter(
        (f) =>
          approxEq(f.position.x, nx) &&
          approxEq(f.position.z, nz) &&
          approxEq(Math.round(f.position.y / 3), floorLevel)
      );
      const f2 = neighbours[0];

      // Wall slot y = foundationY + 1
      const wallY = f1.position.y + 1;
      const wallX = (f1.position.x + (f2 ? f2.position.x : nx)) / 2;
      const wallZ = (f1.position.z + (f2 ? f2.position.z : nz)) / 2;

      const slotKey = posKey(wallX, wallY, wallZ);

      if (f2) {
        // Internal wall slot between two foundations.
        if (processedSlots.has(slotKey)) continue;
        processedSlots.add(slotKey);

        const objs = getAtPos(wallX, wallY, wallZ);
        const structural = objs.find((o) => o.isStructural);
        const insert = objs.find((o) => o.isInsert);

        const barrier = barrierRaidCost(structural, insert);

        if (barrier.type === "open") {
          uf.union(f1.id, f2.id);
        } else {
          const edge: BarrierEdge = {
            id: nextEdgeId(),
            fromCompartmentId: f1.id, // resolved to compartment later
            toCompartmentId: f2.id,
            barrierType: barrier.type,
            structuralObjectId: barrier.structId,
            insertObjectId: barrier.insertId,
            raidCostSulfur: barrier.sulfur,
          };
          edgesRaw.push(edge);
        }
      } else {
        // External face — no neighbour foundation in this direction.
        if (processedSlots.has(slotKey)) continue;
        processedSlots.add(slotKey);

        const objs = getAtPos(wallX, wallY, wallZ);
        const structural = objs.find((o) => o.isStructural);
        const insert = objs.find((o) => o.isInsert);

        const barrier = barrierRaidCost(structural, insert);

        // Always add an edge from exterior.
        const edge: BarrierEdge = {
          id: nextEdgeId(),
          fromCompartmentId: EXTERIOR_ID,
          toCompartmentId: f1.id,
          barrierType: barrier.type === "open" ? "open" : barrier.type,
          structuralObjectId: barrier.structId,
          insertObjectId: barrier.insertId,
          raidCostSulfur: barrier.sulfur,
        };
        edgesRaw.push(edge);
      }
    }
  }

  // Vertical connections via stairs.
  const stairs = spec.objects.filter((o) => o.modelType === "stairs");
  for (const stair of stairs) {
    const floorBelow = Math.round((stair.position.y - 1) / 3) * 3;
    const floorAbove = floorBelow + 3;
    const foundBelow = squareFoundations.filter(
      (f) =>
        approxEq(f.position.y, floorBelow) &&
        Math.abs(f.position.x - stair.position.x) < 1.5 &&
        Math.abs(f.position.z - stair.position.z) < 1.5
    );
    const foundAbove = squareFoundations.filter(
      (f) =>
        approxEq(f.position.y, floorAbove) &&
        Math.abs(f.position.x - stair.position.x) < 1.5 &&
        Math.abs(f.position.z - stair.position.z) < 1.5
    );
    for (const fb of foundBelow) {
      for (const fa of foundAbove) {
        // Stairs are open connections vertically.
        uf.union(fb.id, fa.id);
      }
    }
  }

  // Build compartment nodes from Union-Find roots.
  const rootToFoundIds = new Map<string, string[]>();
  for (const f of squareFoundations) {
    const root = uf.find(f.id);
    const arr = rootToFoundIds.get(root) ?? [];
    arr.push(f.id);
    rootToFoundIds.set(root, arr);
  }

  // Map foundation id → compartment id (= UF root).
  const foundToComp = new Map<string, string>();
  for (const f of squareFoundations) {
    foundToComp.set(f.id, uf.find(f.id));
  }

  // Determine TC and loot flags per compartment.
  // TC: find ToolCupboard object, locate nearest foundation, use its compartment.
  const tcObject = spec.objects.find((o) => o.builderModelName === "ToolCupboard");
  let tcCompId: string | null = null;
  if (tcObject) {
    let minDist = Infinity;
    for (const f of squareFoundations) {
      const d = Math.abs(f.position.x - tcObject.position.x) + Math.abs(f.position.z - tcObject.position.z);
      if (d < minDist) {
        minDist = d;
        tcCompId = foundToComp.get(f.id) ?? null;
      }
    }
  }

  const lootCompId = spec.metadata.lootRoomCompartmentId ?? null;

  // Build final compartment nodes.
  const compartments: CompartmentNode[] = [];
  for (const [root, fids] of rootToFoundIds) {
    const sampleF = squareFoundations.find((f) => f.id === fids[0])!;
    const floorLevel = Math.round(sampleF.position.y / 3);
    compartments.push({
      id: root,
      isExterior: false,
      floorLevel,
      foundationIds: fids,
      containsTC: root === tcCompId,
      containsLoot: root === lootCompId,
    });
  }

  // Add exterior node.
  compartments.push({
    id: EXTERIOR_ID,
    isExterior: true,
    floorLevel: 0,
    foundationIds: [],
    containsTC: false,
    containsLoot: false,
  });

  // Resolve edges: replace foundation ids with compartment ids.
  const finalEdges: BarrierEdge[] = edgesRaw.map((e) => ({
    ...e,
    fromCompartmentId:
      e.fromCompartmentId === EXTERIOR_ID
        ? EXTERIOR_ID
        : (foundToComp.get(e.fromCompartmentId) ?? e.fromCompartmentId),
    toCompartmentId:
      e.toCompartmentId === EXTERIOR_ID
        ? EXTERIOR_ID
        : (foundToComp.get(e.toCompartmentId) ?? e.toCompartmentId),
  }));

  // Deduplicate edges that resolve to the same compartment pair + slot.
  const seen = new Set<string>();
  const dedupedEdges = finalEdges.filter((e) => {
    const key = [e.fromCompartmentId, e.toCompartmentId, e.structuralObjectId ?? "none"].sort().join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Update spec metadata with detected TC compartment.
  if (tcCompId && !spec.metadata.tcCompartmentId) {
    spec.metadata.tcCompartmentId = tcCompId;
  }

  return { compartments, edges: dedupedEdges };
}
