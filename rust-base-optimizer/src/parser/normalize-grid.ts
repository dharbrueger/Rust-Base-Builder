/**
 * Grid normaliser — snaps structural object positions to the canonical Rust
 * coordinate system used by the builder.
 *
 * Grid rules derived empirically from PrebuiltBasesData.tsx:
 *   - Square foundations: x and z are odd integers, y = floorLevel * 3
 *   - Wall slots: midpoint between two adjacent foundation centres
 *     (one coordinate is an integer, the other is an odd integer)
 *   - Cardinal rotations: snapped to 0 / 90 / 180 / 270 degrees
 */

import type { BaseSpec, Vec3 } from "../base-spec/types.js";

/** Snaps a value to the nearest integer. */
function snapToInteger(v: number): number {
  return Math.round(v);
}

/** Snaps a value to the nearest odd integer. */
function snapToOdd(v: number): number {
  const r = Math.round(v);
  return r % 2 === 0 ? r + 1 : r;
}

/** Snaps a rotation in degrees to the nearest cardinal direction. */
function snapRotation(deg: number): number {
  const cardinals = [0, 90, 180, 270, 360];
  let closest = cardinals[0];
  let minDiff = Infinity;
  for (const c of cardinals) {
    const diff = Math.abs(((deg - c + 540) % 360) - 180);
    if (diff < minDiff) {
      minDiff = diff;
      closest = c;
    }
  }
  return closest % 360;
}

/**
 * Snaps a single position for a foundation to its canonical grid point.
 * Foundations sit at odd-integer (x, z) pairs; y is a multiple of 3.
 */
function snapFoundationPosition(pos: Vec3): Vec3 {
  return {
    x: snapToOdd(pos.x),
    y: Math.round(pos.y / 3) * 3,
    z: snapToOdd(pos.z),
  };
}

/**
 * Snaps a wall / doorway / frame position.
 * One of x or z will be an integer (the midpoint between two foundations)
 * and the other will be an odd integer (the foundation row/column coordinate).
 * We determine which axis is the wall-normal by checking which is closer to
 * an even integer.
 */
function snapWallPosition(pos: Vec3): Vec3 {
  const fracX = Math.abs(pos.x - Math.round(pos.x));
  const fracZ = Math.abs(pos.z - Math.round(pos.z));

  let x: number, z: number;
  if (fracX < fracZ) {
    // Wall normal is along X — x is the midpoint (integer), z is odd
    x = snapToInteger(pos.x);
    z = snapToOdd(pos.z);
  } else {
    // Wall normal is along Z — z is the midpoint, x is odd
    x = snapToOdd(pos.x);
    z = snapToInteger(pos.z);
  }

  return { x, y: Math.round(pos.y), z };
}

/**
 * Normalises all structural object positions to the canonical Rust grid and
 * snaps rotations to cardinal directions.  Misc / furniture objects are left
 * at their original positions because their exact placement doesn't affect
 * topology.
 */
export function normalizeGrid(spec: BaseSpec): BaseSpec {
  const normalised = spec.objects.map((obj) => {
    if (obj.modelType === "misc") return obj;

    let position = obj.position;
    let rotationDeg = obj.rotationDeg;

    if (obj.modelType === "foundation") {
      position = snapFoundationPosition(position);
    } else if (
      obj.modelType === "wall" ||
      obj.modelType === "doorway" ||
      obj.modelType === "window" ||
      obj.modelType === "wallFrame" ||
      obj.modelType === "roofWall" ||
      obj.modelType === "door" ||
      obj.modelType === "windowInsert"
    ) {
      position = snapWallPosition(position);
    }
    // Floors, roofs, stairs: leave y-snapping only
    else {
      position = { ...position, y: Math.round(position.y) };
    }

    rotationDeg = snapRotation(rotationDeg);

    return { ...obj, position, rotationDeg };
  });

  return { ...spec, objects: normalised };
}
