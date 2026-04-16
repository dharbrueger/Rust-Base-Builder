/**
 * Base spec generator — produces valid rectangular base skeletons for the
 * evolutionary optimizer to seed from.
 */

import type { BaseObject, BaseSpec, ModelTier } from "../base-spec/types.js";
import { GAME_DATA_VERSION } from "../game-data/game-data-table.js";
import { MODEL_REGISTRY } from "../game-data/model-registry.js";

let _seq = 0;
function nextId(prefix: string): string {
  return `${prefix}_${++_seq}`;
}

function tierFoundation(tier: ModelTier): string {
  return `${tier.charAt(0).toUpperCase() + tier.slice(1)}FoundationSquareMid`;
}

function tierWall(tier: ModelTier): string {
  return `${tier.charAt(0).toUpperCase() + tier.slice(1)}WallHigh`;
}

function tierDoorway(tier: ModelTier): string {
  return `${tier.charAt(0).toUpperCase() + tier.slice(1)}Doorway`;
}

function makeObject(
  id: string,
  modelName: string,
  x: number,
  y: number,
  z: number,
  rotDeg: number
): BaseObject {
  const meta = MODEL_REGISTRY[modelName];
  if (!meta) throw new Error(`Unknown model: ${modelName}`);
  return {
    id,
    builderModelName: modelName,
    modelType: meta.category,
    tier: meta.tier,
    shape: meta.shape,
    grade: meta.grade,
    isStructural: meta.isStructural,
    isInsert: meta.isInsert,
    position: { x, y, z },
    rotationDeg: rotDeg,
  };
}

/**
 * Generates a rectangular grid base spec.
 *
 * @param width  - Number of foundations along X axis.
 * @param depth  - Number of foundations along Z axis.
 * @param tier   - Material tier for foundations and walls.
 *
 * The generated base has:
 *   - width × depth foundations at y=0 (at odd-integer grid positions)
 *   - Walls on every exterior face of the perimeter
 *   - Walls on every interior boundary between adjacent foundations
 *     (creating fully enclosed compartments, not an open-plan layout)
 *   - One doorway (with MetalDoor) on the south face of the base
 *   - A ToolCupboard placed in the centre-most cell
 */
export function generateBaseSpec(
  width: number,
  depth: number,
  tier: ModelTier = "stone"
): BaseSpec {
  _seq = 0;
  const objects: BaseObject[] = [];

  const wallY = 1; // walls sit 1 unit above foundation y=0

  // Place foundations at odd-integer grid positions.
  for (let col = 0; col < width; col++) {
    for (let row = 0; row < depth; row++) {
      const fx = col * 2 + 1;
      const fz = row * 2 + 1;
      objects.push(makeObject(nextId("f"), tierFoundation(tier), fx, 0, fz, 0));
    }
  }

  // Choose the doorway cell on the south face.
  const doorwayCol = Math.floor(width / 2);
  const doorwayZ = depth * 2; // south exterior wall slot z

  // --- Exterior perimeter walls ---

  // North face (z=0 side): one wall per column.
  for (let col = 0; col < width; col++) {
    const fx = col * 2 + 1;
    objects.push(makeObject(nextId("wn"), tierWall(tier), fx, wallY, 0, 0));
  }

  // South face: one wall (or doorway) per column.
  for (let col = 0; col < width; col++) {
    const fx = col * 2 + 1;
    if (col === doorwayCol) {
      objects.push(makeObject(nextId("wd"), tierDoorway(tier), fx, wallY, doorwayZ, 180));
      objects.push(makeObject(nextId("door"), "MetalDoor", fx, wallY, doorwayZ, 180));
    } else {
      objects.push(makeObject(nextId("ws"), tierWall(tier), fx, wallY, doorwayZ, 180));
    }
  }

  // West face (x=0 side): one wall per row.
  for (let row = 0; row < depth; row++) {
    const fz = row * 2 + 1;
    objects.push(makeObject(nextId("ww"), tierWall(tier), 0, wallY, fz, 270));
  }

  // East face: one wall per row.
  for (let row = 0; row < depth; row++) {
    const fz = row * 2 + 1;
    objects.push(makeObject(nextId("we"), tierWall(tier), width * 2, wallY, fz, 90));
  }

  // --- Interior walls between adjacent foundations ---
  // Every internal shared boundary gets a wall so that compartments are fully
  // enclosed. Without these, the base looks like an open hall with disconnected
  // outer walls and the topology treats all cells as one giant compartment.

  // Walls between column col and col+1 (perpendicular to X-axis, facing E/W):
  // wall at x = (col+1)*2 (even integer), z = row*2+1 (odd), rotation 90°.
  for (let col = 0; col < width - 1; col++) {
    for (let row = 0; row < depth; row++) {
      const wx = (col + 1) * 2;
      const wz = row * 2 + 1;
      objects.push(makeObject(nextId("wi"), tierWall(tier), wx, wallY, wz, 90));
    }
  }

  // Walls between row and row+1 (perpendicular to Z-axis, facing N/S):
  // wall at x = col*2+1 (odd), z = (row+1)*2 (even), rotation 0°.
  for (let col = 0; col < width; col++) {
    for (let row = 0; row < depth - 1; row++) {
      const wx = col * 2 + 1;
      const wz = (row + 1) * 2;
      objects.push(makeObject(nextId("wi"), tierWall(tier), wx, wallY, wz, 0));
    }
  }

  // ToolCupboard in the centre-most foundation.
  const tcCol = Math.floor(width / 2);
  const tcRow = Math.floor(depth / 2);
  const tcX = tcCol * 2 + 1;
  const tcZ = tcRow * 2 + 1;
  const tcMeta = MODEL_REGISTRY["ToolCupboard"]!;
  objects.push({
    id: nextId("tc"),
    builderModelName: "ToolCupboard",
    modelType: tcMeta.category,
    tier: tcMeta.tier,
    shape: tcMeta.shape,
    grade: tcMeta.grade,
    isStructural: tcMeta.isStructural,
    isInsert: tcMeta.isInsert,
    position: { x: tcX, y: 1.05, z: tcZ },
    rotationDeg: 0,
  });

  return {
    version: "1.0",
    metadata: { gameDataVersion: GAME_DATA_VERSION },
    objects,
  };
}

// ---------------------------------------------------------------------------
// Diverse seed population (Phase 2)
// ---------------------------------------------------------------------------

/** All rectangular footprint sizes used to seed the diverse population. */
const SEED_SIZES: Array<[number, number]> = [
  [1, 1],
  [2, 1],
  [1, 2],
  [2, 2],
  [3, 2],
  [2, 3],
  [3, 3],
  [4, 2],
  [2, 4],
  [4, 4],
];

const SEED_TIERS: ModelTier[] = ["stone", "metal", "armored"];

/**
 * Generates a diverse population of seed specs across many footprint sizes and
 * material tiers.  The evolutionary algorithm uses these as initial candidates
 * so that it can discover which combination of size, layout, and material
 * produces the strongest base rather than being locked into one shape.
 */
export function generateDiverseSeeds(): BaseSpec[] {
  const seeds: BaseSpec[] = [];
  for (const [w, d] of SEED_SIZES) {
    for (const tier of SEED_TIERS) {
      seeds.push(generateBaseSpec(w, d, tier));
    }
  }
  return seeds;
}
