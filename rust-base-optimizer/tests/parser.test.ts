import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { BuilderExport } from "../src/base-spec/types.js";
import { parseBuilderExport } from "../src/parser/parse-builder-export.js";
import { serializeToBuilderFormat } from "../src/parser/serialize.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture: BuilderExport = JSON.parse(
  readFileSync(join(__dirname, "fixtures/simple-2x1-export.json"), "utf8")
);

describe("parseBuilderExport", () => {
  it("returns a BaseSpec with the correct number of objects", () => {
    const spec = parseBuilderExport(fixture);
    // 11 objects in the fixture
    expect(spec.objects).toHaveLength(11);
  });

  it("assigns version 1.0", () => {
    const spec = parseBuilderExport(fixture);
    expect(spec.version).toBe("1.0");
  });

  it("parses StoneFoundationSquareMid correctly", () => {
    const spec = parseBuilderExport(fixture);
    const f1 = spec.objects.find((o) => o.id === "f1");
    expect(f1).toBeDefined();
    expect(f1!.tier).toBe("stone");
    expect(f1!.modelType).toBe("foundation");
    expect(f1!.shape).toBe("square");
    expect(f1!.grade).toBe("mid");
  });

  it("converts radians to degrees correctly", () => {
    const spec = parseBuilderExport(fixture);
    const w3 = spec.objects.find((o) => o.id === "w3");
    // rotation.y = π ≈ 180°
    expect(w3!.rotationDeg).toBeCloseTo(180, 0);
  });

  it("round-trips to builder format preserving model names", () => {
    const spec = parseBuilderExport(fixture);
    const raw = serializeToBuilderFormat(spec);
    for (const [id, entry] of Object.entries(fixture)) {
      expect(raw[id]).toBeDefined();
      expect(raw[id].model).toBe(entry.model);
      expect(raw[id].position.x).toBeCloseTo(entry.position.x, 2);
      expect(raw[id].position.z).toBeCloseTo(entry.position.z, 2);
    }
  });
});
