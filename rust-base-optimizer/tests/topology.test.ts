import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { BuilderExport } from "../src/base-spec/types.js";
import { parseBuilderExport } from "../src/parser/parse-builder-export.js";
import { buildCompartmentGraph } from "../src/topology/compartment-graph.js";
import { buildStructuralGraph } from "../src/topology/structural-graph.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture: BuilderExport = JSON.parse(
  readFileSync(join(__dirname, "fixtures/simple-2x1-export.json"), "utf8")
);

describe("buildCompartmentGraph", () => {
  it("produces at least one non-exterior compartment per foundation group", () => {
    const spec = parseBuilderExport(fixture);
    const graph = buildCompartmentGraph(spec);
    const interior = graph.compartments.filter((c) => !c.isExterior);
    // 2 foundations may or may not be merged depending on the central wall
    expect(interior.length).toBeGreaterThanOrEqual(1);
  });

  it("always includes the exterior compartment", () => {
    const spec = parseBuilderExport(fixture);
    const graph = buildCompartmentGraph(spec);
    const exterior = graph.compartments.find((c) => c.isExterior);
    expect(exterior).toBeDefined();
    expect(exterior!.id).toBe("exterior");
  });

  it("has at least one edge connected to exterior", () => {
    const spec = parseBuilderExport(fixture);
    const graph = buildCompartmentGraph(spec);
    const extEdges = graph.edges.filter(
      (e) => e.fromCompartmentId === "exterior" || e.toCompartmentId === "exterior"
    );
    expect(extEdges.length).toBeGreaterThan(0);
  });

  it("detects the TC-containing compartment", () => {
    const spec = parseBuilderExport(fixture);
    buildCompartmentGraph(spec);
    // TC compartment id is written back into spec.metadata after graph build
    expect(spec.metadata.tcCompartmentId).toBeDefined();
  });
});

describe("buildStructuralGraph", () => {
  it("assigns 100% stability to foundations", () => {
    const spec = parseBuilderExport(fixture);
    const graph = buildStructuralGraph(spec);
    const foundations = spec.objects.filter((o) => o.modelType === "foundation");
    for (const f of foundations) {
      expect(graph.nodes.get(f.id)?.stabilityPct).toBe(100);
    }
  });
});
