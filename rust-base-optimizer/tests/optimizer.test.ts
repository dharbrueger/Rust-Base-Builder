import { describe, it, expect } from "vitest";
import { generateBaseSpec } from "../src/optimizer/generator.js";
import { generateMutants } from "../src/optimizer/mutator.js";
import { computeFitness, DEFAULT_WEIGHTS } from "../src/optimizer/fitness.js";
import { evaluate } from "../src/evaluator/raid-evaluator.js";

describe("generateBaseSpec", () => {
  it("creates a spec with at least one foundation", () => {
    const spec = generateBaseSpec(2, 1, "stone");
    const foundations = spec.objects.filter((o) => o.modelType === "foundation");
    expect(foundations.length).toBeGreaterThanOrEqual(2);
  });

  it("creates a spec with a ToolCupboard", () => {
    const spec = generateBaseSpec(2, 1);
    const tc = spec.objects.find((o) => o.builderModelName === "ToolCupboard");
    expect(tc).toBeDefined();
  });

  it("creates a spec with at least one wall", () => {
    const spec = generateBaseSpec(2, 1);
    const walls = spec.objects.filter((o) => o.modelType === "wall" || o.modelType === "doorway");
    expect(walls.length).toBeGreaterThan(0);
  });
});

describe("generateMutants", () => {
  it("returns exactly N mutants", () => {
    const spec = generateBaseSpec(2, 1);
    const mutants = generateMutants(spec, 5);
    expect(mutants).toHaveLength(5);
  });

  it("each mutant is a valid spec", () => {
    const spec = generateBaseSpec(2, 1);
    const mutants = generateMutants(spec, 3);
    for (const m of mutants) {
      expect(m.version).toBe("1.0");
      expect(Array.isArray(m.objects)).toBe(true);
    }
  });
});

describe("computeFitness", () => {
  it("returns a finite number for a simple base", () => {
    const spec = generateBaseSpec(2, 1);
    const report = evaluate(spec);
    const score = computeFitness(report, spec, DEFAULT_WEIGHTS);
    expect(typeof score).toBe("number");
    expect(isFinite(score)).toBe(true);
  });
});
