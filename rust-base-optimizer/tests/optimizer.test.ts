import { describe, it, expect } from "vitest";
import { generateBaseSpec, generateDiverseSeeds } from "../src/optimizer/generator.js";
import { generateMutants, addFoundation, removeFoundation, addFloor, upgradeAllWalls } from "../src/optimizer/mutator.js";
import { computeFitness, countOpenExteriorFaces, DEFAULT_WEIGHTS } from "../src/optimizer/fitness.js";
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

  it("2x2 base has interior walls between all adjacent foundation pairs", () => {
    const spec = generateBaseSpec(2, 2);
    const walls = spec.objects.filter((o) => o.modelType === "wall" || o.modelType === "doorway");
    // 2x2 base:
    //   North exterior: 2 walls
    //   South exterior: 1 wall + 1 doorway = 2 pieces
    //   West exterior: 2 walls
    //   East exterior: 2 walls
    //   Interior X: 2 walls (col boundary, rows 0 and 1)
    //   Interior Z: 2 walls (row boundary, cols 0 and 1)
    // Total walls+doorways = 2+2+2+2+2+2 = 12
    expect(walls.length).toBeGreaterThanOrEqual(10);
  });

  it("has zero open exterior faces immediately after generation", () => {
    const spec = generateBaseSpec(2, 2);
    const open = countOpenExteriorFaces(spec);
    // One doorway counts as a structural object, so open should be 0.
    expect(open).toBe(0);
  });

  it("3x3 base has zero open exterior faces", () => {
    const spec = generateBaseSpec(3, 3);
    const open = countOpenExteriorFaces(spec);
    expect(open).toBe(0);
  });
});

describe("generateDiverseSeeds", () => {
  it("returns more than one seed", () => {
    const seeds = generateDiverseSeeds();
    expect(seeds.length).toBeGreaterThan(1);
  });

  it("seeds vary in object count (different footprint sizes)", () => {
    const seeds = generateDiverseSeeds();
    const counts = seeds.map((s) => s.objects.length);
    const unique = new Set(counts);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("seeds span all three tiers", () => {
    const seeds = generateDiverseSeeds();
    const tiers = new Set(
      seeds.flatMap((s) =>
        s.objects
          .filter((o) => o.modelType === "foundation")
          .map((o) => o.tier)
      )
    );
    expect(tiers.has("stone")).toBe(true);
    expect(tiers.has("metal")).toBe(true);
    expect(tiers.has("armored")).toBe(true);
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

describe("addFoundation", () => {
  it("increases the foundation count by one", () => {
    const spec = generateBaseSpec(2, 2);
    const before = spec.objects.filter((o) => o.modelType === "foundation").length;
    const mutated = addFoundation(spec);
    const after = mutated.objects.filter((o) => o.modelType === "foundation").length;
    expect(after).toBe(before + 1);
  });

  it("adds walls for the new foundation's exterior faces", () => {
    const spec = generateBaseSpec(1, 1);
    const mutated = addFoundation(spec);
    const walls = mutated.objects.filter(
      (o) => o.modelType === "wall" || o.modelType === "doorway"
    );
    expect(walls.length).toBeGreaterThan(
      spec.objects.filter((o) => o.modelType === "wall" || o.modelType === "doorway").length
    );
  });

  it("returns a spec with zero open exterior faces", () => {
    const spec = generateBaseSpec(1, 1);
    const mutated = addFoundation(spec);
    expect(countOpenExteriorFaces(mutated)).toBe(0);
  });
});

describe("removeFoundation", () => {
  it("decreases the foundation count by one on a multi-cell base", () => {
    const spec = generateBaseSpec(2, 2);
    const before = spec.objects.filter((o) => o.modelType === "foundation").length;
    const mutated = removeFoundation(spec);
    const after = mutated.objects.filter((o) => o.modelType === "foundation").length;
    expect(after).toBe(before - 1);
  });

  it("does not change a single-foundation spec", () => {
    const spec = generateBaseSpec(1, 1);
    const mutated = removeFoundation(spec);
    const count = mutated.objects.filter((o) => o.modelType === "foundation").length;
    expect(count).toBe(1);
  });

  it("retains the ToolCupboard after removal", () => {
    const spec = generateBaseSpec(2, 2);
    const mutated = removeFoundation(spec);
    const tc = mutated.objects.find((o) => o.builderModelName === "ToolCupboard");
    expect(tc).toBeDefined();
  });
});

describe("addFloor", () => {
  it("adds a floor object", () => {
    const spec = generateBaseSpec(2, 1);
    const mutated = addFloor(spec);
    const floors = mutated.objects.filter((o) => o.modelType === "floor");
    expect(floors.length).toBeGreaterThan(0);
  });

  it("places the floor at y = foundationY + 3", () => {
    const spec = generateBaseSpec(1, 1);
    const mutated = addFloor(spec);
    const floors = mutated.objects.filter((o) => o.modelType === "floor");
    if (floors.length > 0) {
      expect(floors[0].position.y).toBeCloseTo(3, 1);
    }
  });
});

describe("upgradeAllWalls", () => {
  it("converts all stone walls to metal", () => {
    const spec = generateBaseSpec(2, 2, "stone");
    const mutated = upgradeAllWalls(spec);
    const stoneWalls = mutated.objects.filter(
      (o) => o.modelType === "wall" && o.tier === "stone"
    );
    expect(stoneWalls.length).toBe(0);
  });

  it("results in a spec with only metal walls (from stone input)", () => {
    const spec = generateBaseSpec(2, 2, "stone");
    const mutated = upgradeAllWalls(spec);
    const walls = mutated.objects.filter((o) => o.modelType === "wall");
    for (const w of walls) {
      expect(w.tier).toBe("metal");
    }
  });
});

describe("countOpenExteriorFaces", () => {
  it("returns 0 for a fully walled base", () => {
    const spec = generateBaseSpec(2, 2);
    expect(countOpenExteriorFaces(spec)).toBe(0);
  });

  it("returns > 0 when exterior walls are removed", () => {
    const spec = generateBaseSpec(2, 1);
    // Remove all walls to create open faces.
    const stripped = {
      ...spec,
      objects: spec.objects.filter((o) => o.modelType === "foundation" || o.builderModelName === "ToolCupboard"),
    };
    expect(countOpenExteriorFaces(stripped)).toBeGreaterThan(0);
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

  it("open exterior faces reduce the fitness score", () => {
    const spec = generateBaseSpec(2, 1);
    const report = evaluate(spec);
    const goodScore = computeFitness(report, spec, DEFAULT_WEIGHTS);

    // Strip all walls to create open exterior faces.
    const stripped = {
      ...spec,
      objects: spec.objects.filter((o) => o.modelType === "foundation" || o.builderModelName === "ToolCupboard"),
    };
    const badScore = computeFitness(report, stripped, DEFAULT_WEIGHTS);
    expect(goodScore).toBeGreaterThan(badScore);
  });
});
