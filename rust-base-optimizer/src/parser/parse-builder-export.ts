/**
 * Parser — converts builder export format (raw dict or base64+pako) into BaseSpec.
 */

import pako from "pako";
import type { BaseObject, BaseSpec, BaseSpecMetadata, BuilderExport } from "../base-spec/types.js";
import { GAME_DATA_VERSION } from "../game-data/game-data-table.js";
import { MODEL_REGISTRY } from "../game-data/model-registry.js";

// ---------------------------------------------------------------------------
// Encode / Decode builder codes (pako deflate + base64)
// ---------------------------------------------------------------------------

/**
 * Decodes a builder export code (base64 → pako inflate → JSON) into a raw
 * BuilderExport dictionary.
 */
export function decodeBuilderCode(base64Code: string): BuilderExport {
  const binary = atob(base64Code);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const inflated = pako.inflate(bytes, { to: "string" });
  return JSON.parse(inflated) as BuilderExport;
}

/**
 * Encodes a raw BuilderExport dictionary back to a builder import code
 * (JSON → pako deflate → base64).
 */
export function encodeBuilderCode(raw: BuilderExport): string {
  const json = JSON.stringify(raw);
  const deflated = pako.deflate(json);
  let binary = "";
  for (let i = 0; i < deflated.length; i++) {
    binary += String.fromCharCode(deflated[i]);
  }
  return btoa(binary);
}

// ---------------------------------------------------------------------------
// Core parser
// ---------------------------------------------------------------------------

/** Converts radians to degrees, clamped to [0, 360). */
function radToDeg(rad: number): number {
  const deg = (rad * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

/**
 * Parses a raw BuilderExport dictionary into a normalised BaseSpec.
 *
 * @param raw       - The builder export dict (keys are object ids).
 * @param metadata  - Optional overrides for spec metadata.
 */
export function parseBuilderExport(
  raw: BuilderExport,
  metadata: Partial<BaseSpecMetadata> = {}
): BaseSpec {
  const objects: BaseObject[] = [];
  let tcObjectId: string | null = null;

  for (const [id, entry] of Object.entries(raw)) {
    const meta = MODEL_REGISTRY[entry.model];
    if (!meta) {
      // Unknown model — skip but don't crash.
      continue;
    }

    const rotationDeg = radToDeg(entry.rotation.y);

    const obj: BaseObject = {
      id,
      builderModelName: entry.model,
      modelType: meta.category,
      tier: meta.tier,
      shape: meta.shape,
      grade: meta.grade,
      isStructural: meta.isStructural,
      isInsert: meta.isInsert,
      position: { x: entry.position.x, y: entry.position.y, z: entry.position.z },
      rotationDeg,
    };

    objects.push(obj);

    if (entry.model === "ToolCupboard") {
      tcObjectId = id;
    }
  }

  // Auto-detect TC compartment id (will be refined by topology step).
  const resolvedMetadata: BaseSpecMetadata = {
    gameDataVersion: GAME_DATA_VERSION,
    ...metadata,
    ...(tcObjectId && !metadata.tcCompartmentId
      ? { tcCompartmentId: undefined } // topology will fill this in
      : {}),
  };

  return { version: "1.0", metadata: resolvedMetadata, objects };
}
