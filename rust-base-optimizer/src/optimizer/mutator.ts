/**
 * Mutator — produces variants of a BaseSpec by applying structural mutations.
 *
 * All mutations return a new BaseSpec (original is never modified).
 */

import type { BaseObject, BaseSpec, ModelTier } from "../base-spec/types.js";
import { MODEL_REGISTRY } from "../game-data/model-registry.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _idSeq = 0;
function newId(): string {
  return `mut_${++_idSeq}_${Math.random().toString(36).slice(2, 7)}`;
}

function cloneSpec(spec: BaseSpec): BaseSpec {
  return {
    ...spec,
    objects: spec.objects.map((o) => ({ ...o, position: { ...o.position } })),
  };
}

/** Returns the metal-tier equivalent of a stone wall model name. */
function upgradeModelName(modelName: string): string {
  if (modelName.startsWith("Stone")) return modelName.replace(/^Stone/, "Metal");
  if (modelName.startsWith("Metal")) return modelName.replace(/^Metal/, "Armored");
  return modelName;
}

/** True if a structural object (wall / doorway / window / frame) sits at (x, y, z) within tolerance. */
function hasStructuralAt(objects: BaseObject[], x: number, y: number, z: number): boolean {
  const TOL = 0.3;
  return objects.some(
    (o) =>
      o.isStructural &&
      o.modelType !== "foundation" &&
      Math.abs(o.position.x - x) < TOL &&
      Math.abs(o.position.y - y) < TOL &&
      Math.abs(o.position.z - z) < TOL
  );
}

/** Returns model name for a wall of the given tier. */
function wallModel(tier: ModelTier): string {
  return `${tier.charAt(0).toUpperCase() + tier.slice(1)}WallHigh`;
}

/** Returns model name for a floor of the given tier. */
function floorModel(tier: ModelTier): string {
  return `${tier.charAt(0).toUpperCase() + tier.slice(1)}FloorSquare`;
}

function makeWall(
  objects: BaseObject[],
  x: number,
  y: number,
  z: number,
  rotDeg: number,
  tier: ModelTier
): BaseObject {
  const modelName = wallModel(tier);
  const meta = MODEL_REGISTRY[modelName]!;
  return {
    id: newId(),
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
  void objects; // unused param, kept for signature clarity
}

// ---------------------------------------------------------------------------
// Individual mutations
// ---------------------------------------------------------------------------

/**
 * Upgrades a random stone or metal wall to the next tier.
 * Stone → Metal, Metal → Armored.
 * Returns the original spec unchanged if no upgradeable walls exist.
 */
export function upgradeRandomWall(spec: BaseSpec): BaseSpec {
  const upgradeable = spec.objects.filter(
    (o) =>
      (o.tier === "stone" || o.tier === "metal") && o.modelType === "wall"
  );
  if (upgradeable.length === 0) return spec;

  const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
  const newModelName = upgradeModelName(target.builderModelName);
  const meta = MODEL_REGISTRY[newModelName];
  if (!meta) return spec;

  const cloned = cloneSpec(spec);
  const idx = cloned.objects.findIndex((o) => o.id === target.id);
  if (idx === -1) return spec;

  cloned.objects[idx] = {
    ...cloned.objects[idx],
    builderModelName: newModelName,
    tier: meta.tier,
  };
  return cloned;
}

/**
 * Upgrades ALL stone walls to metal (and all metal walls to armored) in one step.
 * This lets the algorithm discover that full-tier upgrades are worth the cost.
 */
export function upgradeAllWalls(spec: BaseSpec): BaseSpec {
  const cloned = cloneSpec(spec);
  let changed = false;

  for (let i = 0; i < cloned.objects.length; i++) {
    const obj = cloned.objects[i];
    if ((obj.tier === "stone" || obj.tier === "metal") && obj.modelType === "wall") {
      const newModelName = upgradeModelName(obj.builderModelName);
      const meta = MODEL_REGISTRY[newModelName];
      if (!meta) continue;
      cloned.objects[i] = { ...obj, builderModelName: newModelName, tier: meta.tier };
      changed = true;
    }
  }

  return changed ? cloned : spec;
}

/**
 * Adds a MetalDoor to a random open doorway (one without an existing door).
 */
export function addDoor(spec: BaseSpec): BaseSpec {
  const doorways = spec.objects.filter((o) => o.modelType === "doorway");
  const doorPositions = new Set(
    spec.objects
      .filter((o) => o.modelType === "door")
      .map((o) => `${o.position.x},${o.position.y},${o.position.z}`)
  );

  const openDoorways = doorways.filter(
    (d) => !doorPositions.has(`${d.position.x},${d.position.y},${d.position.z}`)
  );
  if (openDoorways.length === 0) return spec;

  const target = openDoorways[Math.floor(Math.random() * openDoorways.length)];
  const meta = MODEL_REGISTRY["MetalDoor"]!;

  const newDoor: BaseObject = {
    id: newId(),
    builderModelName: "MetalDoor",
    modelType: meta.category,
    tier: meta.tier,
    shape: meta.shape,
    grade: meta.grade,
    isStructural: meta.isStructural,
    isInsert: meta.isInsert,
    position: { ...target.position },
    rotationDeg: target.rotationDeg,
  };

  const cloned = cloneSpec(spec);
  cloned.objects.push(newDoor);
  return cloned;
}

/**
 * Replaces a random stone or metal wall with a same-tier Doorway (creates a passage).
 */
export function replaceWallWithDoorway(spec: BaseSpec): BaseSpec {
  const walls = spec.objects.filter(
    (o) => (o.tier === "stone" || o.tier === "metal") && o.modelType === "wall"
  );
  if (walls.length === 0) return spec;

  const target = walls[Math.floor(Math.random() * walls.length)];
  const tierCapitalized = target.tier
    ? target.tier.charAt(0).toUpperCase() + target.tier.slice(1)
    : "Stone";
  const doorwayModelName = `${tierCapitalized}Doorway`;
  const meta = MODEL_REGISTRY[doorwayModelName];
  if (!meta) return spec;

  const cloned = cloneSpec(spec);
  const idx = cloned.objects.findIndex((o) => o.id === target.id);
  if (idx === -1) return spec;

  cloned.objects[idx] = {
    ...cloned.objects[idx],
    builderModelName: doorwayModelName,
    modelType: meta.category,
    tier: meta.tier,
    shape: meta.shape,
    grade: meta.grade,
    isStructural: meta.isStructural,
    isInsert: meta.isInsert,
  };
  return cloned;
}

/**
 * Removes a random non-foundation, non-TC structural object.
 */
export function removeObject(spec: BaseSpec): BaseSpec {
  const candidates = spec.objects.filter(
    (o) =>
      o.modelType !== "foundation" &&
      o.builderModelName !== "ToolCupboard" &&
      o.isStructural
  );
  if (candidates.length === 0) return spec;

  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const cloned = cloneSpec(spec);
  cloned.objects = cloned.objects.filter((o) => o.id !== target.id);
  return cloned;
}

// ---------------------------------------------------------------------------
// Phase 3 additions: structural shape mutations
// ---------------------------------------------------------------------------

/**
 * Adds a new square foundation adjacent to an existing one, together with
 * walls on all newly exposed exterior faces.
 *
 * The shared boundary with the neighbour already has a wall (the neighbour's
 * former exterior wall), so it becomes an interior compartment wall, which
 * is the desirable default behaviour.
 */
export function addFoundation(spec: BaseSpec): BaseSpec {
  const foundations = spec.objects.filter(
    (o) => o.modelType === "foundation" && o.shape === "square" && Math.round(o.position.y) === 0
  );
  if (foundations.length === 0) return spec;

  // Build a set of occupied foundation (x, z) positions.
  const foundSet = new Set(
    foundations.map((f) => `${Math.round(f.position.x)},${Math.round(f.position.z)}`)
  );

  const DIRS = [
    { dx: 2, dz: 0, wallDx: 1, wallDz: 0, rot: 90 },  // east
    { dx: -2, dz: 0, wallDx: -1, wallDz: 0, rot: 90 }, // west
    { dx: 0, dz: 2, wallDx: 0, wallDz: 1, rot: 0 },    // south
    { dx: 0, dz: -2, wallDx: 0, wallDz: -1, rot: 0 },  // north
  ] as const;

  // Collect empty positions that are adjacent to at least one foundation.
  const candidates: Array<{ x: number; z: number; neighbourTier: ModelTier }> = [];
  for (const f of foundations) {
    const fx = Math.round(f.position.x);
    const fz = Math.round(f.position.z);
    for (const dir of DIRS) {
      const nx = fx + dir.dx;
      const nz = fz + dir.dz;
      if (!foundSet.has(`${nx},${nz}`)) {
        candidates.push({ x: nx, z: nz, neighbourTier: (f.tier ?? "stone") as ModelTier });
      }
    }
  }

  if (candidates.length === 0) return spec;

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const tier = chosen.neighbourTier;
  const tierCap = tier.charAt(0).toUpperCase() + tier.slice(1);
  const foundModelName = `${tierCap}FoundationSquareMid`;
  const foundMeta = MODEL_REGISTRY[foundModelName];
  if (!foundMeta) return spec;

  const cloned = cloneSpec(spec);
  const wallY = 1;
  const newFx = chosen.x;
  const newFz = chosen.z;

  // Add the new foundation.
  cloned.objects.push({
    id: newId(),
    builderModelName: foundModelName,
    modelType: foundMeta.category,
    tier: foundMeta.tier,
    shape: foundMeta.shape,
    grade: foundMeta.grade,
    isStructural: foundMeta.isStructural,
    isInsert: foundMeta.isInsert,
    position: { x: newFx, y: 0, z: newFz },
    rotationDeg: 0,
  });

  // Add walls for exterior faces of the new foundation that don't already have
  // a structural object in the slot.
  // Update the found-set so we include the new foundation for neighbour checks.
  const updatedFoundSet = new Set(foundSet);
  updatedFoundSet.add(`${newFx},${newFz}`);

  for (const dir of DIRS) {
    const farX = newFx + dir.dx;
    const farZ = newFz + dir.dz;
    const wallX = newFx + dir.wallDx;
    const wallZ = newFz + dir.wallDz;

    // If a neighbour foundation exists on the far side, this is an interior face.
    // If not, it's an exterior face that needs a wall.
    const isInterior = updatedFoundSet.has(`${farX},${farZ}`);

    // Regardless of interior/exterior, add a wall if none exists at the slot.
    if (!hasStructuralAt(cloned.objects, wallX, wallY, wallZ)) {
      const wallModelName = wallModel(tier);
      const wallMeta = MODEL_REGISTRY[wallModelName]!;
      cloned.objects.push({
        id: newId(),
        builderModelName: wallModelName,
        modelType: wallMeta.category,
        tier: wallMeta.tier,
        shape: wallMeta.shape,
        grade: wallMeta.grade,
        isStructural: wallMeta.isStructural,
        isInsert: wallMeta.isInsert,
        position: { x: wallX, y: wallY, z: wallZ },
        rotationDeg: dir.rot,
      });
    }
    void isInterior; // kept for documentation clarity
  }

  return cloned;
}

/**
 * Removes a random square foundation (floor level 0) and cleans up any walls
 * that are no longer adjacent to any remaining foundation.
 *
 * Never removes the foundation that contains the ToolCupboard.
 */
export function removeFoundation(spec: BaseSpec): BaseSpec {
  const foundations = spec.objects.filter(
    (o) => o.modelType === "foundation" && o.shape === "square" && Math.round(o.position.y) === 0
  );
  if (foundations.length <= 1) return spec; // must keep at least one foundation

  // Find the TC to protect its host foundation.
  const tc = spec.objects.find((o) => o.builderModelName === "ToolCupboard");
  const tcHostKey = (() => {
    if (!tc) return null;
    let minDist = Infinity;
    let hostKey: string | null = null;
    for (const f of foundations) {
      const d =
        Math.abs(f.position.x - tc.position.x) + Math.abs(f.position.z - tc.position.z);
      if (d < minDist) {
        minDist = d;
        hostKey = `${Math.round(f.position.x)},${Math.round(f.position.z)}`;
      }
    }
    return hostKey;
  })();

  const removable = foundations.filter(
    (f) => `${Math.round(f.position.x)},${Math.round(f.position.z)}` !== tcHostKey
  );
  if (removable.length === 0) return spec;

  const target = removable[Math.floor(Math.random() * removable.length)];
  const cloned = cloneSpec(spec);

  // Remove the foundation itself.
  cloned.objects = cloned.objects.filter((o) => o.id !== target.id);

  // Build updated foundation set (without the removed one).
  const remainingFounds = cloned.objects.filter(
    (o) => o.modelType === "foundation" && o.shape === "square"
  );
  const remainingFoundSet = new Set(
    remainingFounds.map((f) => `${Math.round(f.position.x)},${Math.round(f.position.z)}`)
  );

  const tfx = Math.round(target.position.x);
  const tfz = Math.round(target.position.z);
  const wallY = Math.round(target.position.y) + 1;

  // For each of the removed foundation's 4 faces, remove the wall if neither
  // side of the slot now has a foundation.
  const FACE_DIRS = [
    { dx: 0, dz: -1 }, // north
    { dx: 0, dz: 1 },  // south
    { dx: -1, dz: 0 }, // west
    { dx: 1, dz: 0 },  // east
  ] as const;

  for (const dir of FACE_DIRS) {
    const wallX = tfx + dir.dx;   // wall slot (1 unit from foundation)
    const wallZ = tfz + dir.dz;
    const farX = tfx + dir.dx * 2; // the foundation on the other side
    const farZ = tfz + dir.dz * 2;

    // If a remaining foundation exists on the far side, this wall is now its
    // exterior wall — keep it.
    if (remainingFoundSet.has(`${farX},${farZ}`)) continue;

    // No foundation on either side → remove all structural objects at this slot.
    const TOL = 0.3;
    cloned.objects = cloned.objects.filter(
      (o) =>
        !(
          o.isStructural &&
          o.modelType !== "foundation" &&
          Math.abs(o.position.x - wallX) < TOL &&
          Math.abs(o.position.y - wallY) < TOL &&
          Math.abs(o.position.z - wallZ) < TOL
        )
    );
  }

  return cloned;
}

/**
 * Adds a floor tile above a random foundation that doesn't already have one.
 * Floors at y = foundationY + 3 cover the cell and contribute to anti-topdown
 * protection.
 */
export function addFloor(spec: BaseSpec): BaseSpec {
  const foundations = spec.objects.filter(
    (o) => o.modelType === "foundation" && o.shape === "square"
  );
  if (foundations.length === 0) return spec;

  // Build a set of existing floor positions (x, z) at any floor level.
  const floorPositions = new Set(
    spec.objects
      .filter((o) => o.modelType === "floor" && o.shape === "square")
      .map((o) => `${Math.round(o.position.x)},${Math.round(o.position.z)}`)
  );

  const candidates = foundations.filter(
    (f) => !floorPositions.has(`${Math.round(f.position.x)},${Math.round(f.position.z)}`)
  );
  if (candidates.length === 0) return spec;

  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const tier = (target.tier ?? "stone") as ModelTier;
  const floorModelName = floorModel(tier);
  const meta = MODEL_REGISTRY[floorModelName];
  if (!meta) return spec;

  const cloned = cloneSpec(spec);
  cloned.objects.push({
    id: newId(),
    builderModelName: floorModelName,
    modelType: meta.category,
    tier: meta.tier,
    shape: meta.shape,
    grade: meta.grade,
    isStructural: meta.isStructural,
    isInsert: meta.isInsert,
    position: {
      x: target.position.x,
      y: target.position.y + 3, // one storey up
      z: target.position.z,
    },
    rotationDeg: 0,
  });

  return cloned;
}

// ---------------------------------------------------------------------------
// Batch mutant generator
// ---------------------------------------------------------------------------

// Weighted mutation table — addFoundation and addFloor are given extra weight
// so the algorithm tends to grow rather than purely mutate existing pieces.
const MUTATIONS: Array<(spec: BaseSpec) => BaseSpec> = [
  upgradeRandomWall,
  upgradeRandomWall,      // 2× weight
  upgradeAllWalls,
  addDoor,
  replaceWallWithDoorway,
  removeObject,
  addFoundation,
  addFoundation,          // 2× weight
  removeFoundation,
  addFloor,
  addFloor,               // 2× weight
];

/**
 * Generates `n` distinct mutant specs from a seed spec.
 * Each mutant has exactly one mutation applied at random.
 */
export function generateMutants(spec: BaseSpec, n: number): BaseSpec[] {
  const results: BaseSpec[] = [];
  for (let i = 0; i < n; i++) {
    const mutation = MUTATIONS[Math.floor(Math.random() * MUTATIONS.length)];
    results.push(mutation(spec));
  }
  return results;
}
