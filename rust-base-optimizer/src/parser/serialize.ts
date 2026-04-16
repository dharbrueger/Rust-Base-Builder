/**
 * Serializer — converts a BaseSpec back to the builder's raw export dict so
 * modified specs can be re-imported into the visual editor.
 */

import type { BaseSpec, BuilderExport, BuilderModelData } from "../base-spec/types.js";
import { encodeBuilderCode } from "./parse-builder-export.js";

/** Converts degrees to radians. */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Converts a BaseSpec into the raw builder export format
 * `{ [id]: { model, position, rotation } }`.
 */
export function serializeToBuilderFormat(spec: BaseSpec): BuilderExport {
  const out: BuilderExport = {};
  for (const obj of spec.objects) {
    const entry: BuilderModelData = {
      model: obj.builderModelName,
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rotation: { x: 0, y: degToRad(obj.rotationDeg), z: 0 },
    };
    out[obj.id] = entry;
  }
  return out;
}

/**
 * Converts a BaseSpec directly to a base64+pako builder import code.
 */
export function serializeToBuilderCode(spec: BaseSpec): string {
  return encodeBuilderCode(serializeToBuilderFormat(spec));
}
