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
  return modelName.replace(/^Stone/, "Metal");
}

// ---------------------------------------------------------------------------
// Individual mutations
// ---------------------------------------------------------------------------

/**
 * Upgrades a random stone wall to metal tier.
 * Returns the original spec unchanged if no stone walls exist.
 */
export function upgradeRandomWall(spec: BaseSpec): BaseSpec {
  const stoneWalls = spec.objects.filter(
    (o) => o.tier === "stone" && o.modelType === "wall"
  );
  if (stoneWalls.length === 0) return spec;

  const target = stoneWalls[Math.floor(Math.random() * stoneWalls.length)];
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
 * Replaces a random wall with a StoneDoorway (creates a new passage).
 * Only operates on stone walls to keep validity simple.
 */
export function replaceWallWithDoorway(spec: BaseSpec): BaseSpec {
  const walls = spec.objects.filter((o) => o.tier === "stone" && o.modelType === "wall");
  if (walls.length === 0) return spec;

  const target = walls[Math.floor(Math.random() * walls.length)];
  const meta = MODEL_REGISTRY["StoneDoorway"]!;

  const cloned = cloneSpec(spec);
  const idx = cloned.objects.findIndex((o) => o.id === target.id);
  if (idx === -1) return spec;

  cloned.objects[idx] = {
    ...cloned.objects[idx],
    builderModelName: "StoneDoorway",
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
// Batch mutant generator
// ---------------------------------------------------------------------------

const MUTATIONS = [upgradeRandomWall, addDoor, replaceWallWithDoorway, removeObject];

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
