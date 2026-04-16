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
 *   - Walls around all exterior faces
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
  // Row 0 → x=1, row 1 → x=3, etc.  Column 0 → z=1, etc.
  for (let col = 0; col < width; col++) {
    for (let row = 0; row < depth; row++) {
      const fx = col * 2 + 1;
      const fz = row * 2 + 1;
      objects.push(makeObject(nextId("f"), tierFoundation(tier), fx, 0, fz, 0));
    }
  }

  // Choose the doorway cell: south face of the first (col=0) foundation column.
  const doorwayCol = Math.floor(width / 2);
  const doorwayZ = depth * 2; // south wall slot z = last foundation z + 1

  // Place walls around the exterior perimeter.
  for (let col = 0; col < width; col++) {
    const fx = col * 2 + 1;
    // North face (z=0 side).
    objects.push(makeObject(nextId("wn"), tierWall(tier), fx, wallY, 0, 0));
    // South face.
    const isSouthDoorway = col === doorwayCol;
    if (isSouthDoorway) {
      objects.push(makeObject(nextId("wd"), tierDoorway(tier), fx, wallY, doorwayZ, 180));
      objects.push(makeObject(nextId("door"), "MetalDoor", fx, wallY, doorwayZ, 180));
    } else {
      objects.push(makeObject(nextId("ws"), tierWall(tier), fx, wallY, doorwayZ, 180));
    }
  }

  for (let row = 0; row < depth; row++) {
    const fz = row * 2 + 1;
    // West face (x=0 side).
    objects.push(makeObject(nextId("ww"), tierWall(tier), 0, wallY, fz, 270));
    // East face.
    objects.push(makeObject(nextId("we"), tierWall(tier), width * 2, wallY, fz, 90));
  }

  // Inter-foundation internal walls (none for open-plan base — add doors only on exterior).

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
