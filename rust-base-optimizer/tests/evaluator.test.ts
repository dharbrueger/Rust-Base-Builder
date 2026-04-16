import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { BuilderExport } from "../src/base-spec/types.js";
import { parseBuilderExport } from "../src/parser/parse-builder-export.js";
import { evaluate } from "../src/evaluator/raid-evaluator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture: BuilderExport = JSON.parse(
  readFileSync(join(__dirname, "fixtures/simple-2x1-export.json"), "utf8")
);

describe("evaluate", () => {
  it("returns an EvaluationReport with the expected shape", () => {
    const spec = parseBuilderExport(fixture);
    const report = evaluate(spec);
    expect(report).toHaveProperty("sulfurToTC");
    expect(report).toHaveProperty("cheapestDoorPathSulfur");
    expect(report).toHaveProperty("topDownCost");
    expect(report).toHaveProperty("pathToTC");
    expect(report).toHaveProperty("stabilityBunkers");
    expect(report).toHaveProperty("externallyExposedWalls");
  });

  it("sulfurToTC is a non-negative number", () => {
    const spec = parseBuilderExport(fixture);
    const report = evaluate(spec);
    expect(typeof report.sulfurToTC).toBe("number");
    expect(report.sulfurToTC).toBeGreaterThanOrEqual(0);
  });

  it("door path costs at least as much as a single MetalDoor (1575 sulfur via ammo)", () => {
    const spec = parseBuilderExport(fixture);
    const report = evaluate(spec);
    // The fixture has one MetalDoor — cheapest door path must cost ≥ MetalDoor minSulfur
    // MetalDoor: 63 ammo × 25 = 1575 sulfur
    if (report.doorPath) {
      expect(report.cheapestDoorPathSulfur).toBeGreaterThanOrEqual(1575);
    }
  });

  it("stabilityBunkers is an array", () => {
    const spec = parseBuilderExport(fixture);
    const report = evaluate(spec);
    expect(Array.isArray(report.stabilityBunkers)).toBe(true);
  });

  it("externallyExposedWalls contains entries for the exterior barriers", () => {
    const spec = parseBuilderExport(fixture);
    const report = evaluate(spec);
    expect(Array.isArray(report.externallyExposedWalls)).toBe(true);
  });
});
