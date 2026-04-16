/**
 * Main raid evaluator.
 *
 * Runs all analyses (Dijkstra raid paths, door-only paths, top-down,
 * stability bunkers, external exposure) and returns a unified EvaluationReport.
 */

import type {
  BarrierEdge,
  BaseSpec,
  CompartmentGraph,
  EvaluationReport,
  RaidPath,
  RaidStep,
} from "../base-spec/types.js";
import { GAME_DATA_VERSION } from "../game-data/game-data-table.js";
import { buildCompartmentGraph } from "../topology/compartment-graph.js";
import { buildStructuralGraph } from "../topology/structural-graph.js";
import { analyzeTopDown } from "./anti-topdown.js";
import { dijkstra, type DijkstraGraph } from "./dijkstra.js";
import { analyzeExternals } from "./externals.js";
import { detectStabilityBunkers } from "./stability-bunker.js";

// ---------------------------------------------------------------------------
// Graph adapter for Dijkstra
// ---------------------------------------------------------------------------

function makeGraphAdapter(
  compartGraph: CompartmentGraph,
  edgeFilter?: (e: BarrierEdge) => boolean
): DijkstraGraph {
  const nodeIds = compartGraph.compartments.map((c) => c.id);

  return {
    nodeIds,
    getNeighbours(nodeId: string) {
      const neighbours: { nodeId: string; weight: number; edgeId: string }[] = [];

      for (const edge of compartGraph.edges) {
        if (edgeFilter && !edgeFilter(edge)) continue;

        if (edge.fromCompartmentId === nodeId) {
          neighbours.push({
            nodeId: edge.toCompartmentId,
            weight: edge.raidCostSulfur,
            edgeId: edge.id,
          });
        } else if (edge.toCompartmentId === nodeId) {
          // Undirected — can traverse either way.
          neighbours.push({
            nodeId: edge.fromCompartmentId,
            weight: edge.raidCostSulfur,
            edgeId: edge.id,
          });
        }
      }

      return neighbours;
    },
  };
}

// ---------------------------------------------------------------------------
// Path builders
// ---------------------------------------------------------------------------

function buildRaidPath(
  compartGraph: CompartmentGraph,
  edgePath: string[],
  nodePath: string[],
  totalSulfur: number
): RaidPath {
  const edgeById = new Map<string, BarrierEdge>(compartGraph.edges.map((e) => [e.id, e]));

  const steps: RaidStep[] = edgePath.map((edgeId, i) => {
    const edge = edgeById.get(edgeId)!;
    // The destroyed object is the insert (door) if present, else the structural.
    const objectDestroyed =
      edge.insertObjectId ??
      (edge.barrierType !== "open" ? edge.structuralObjectId : null) ??
      null;
    return {
      barrierEdgeId: edgeId,
      fromCompartmentId: nodePath[i],
      toCompartmentId: nodePath[i + 1],
      objectDestroyed,
      sulfurCost: edge.raidCostSulfur,
    };
  });

  return { steps, totalSulfur, explosiveType: "cheapest" };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Computes the cheapest raid path between two compartments.
 * Returns null if no path exists.
 */
export function cheapestRaidPath(
  compartGraph: CompartmentGraph,
  sourceId: string,
  targetId: string
): RaidPath | null {
  const graphAdapter = makeGraphAdapter(compartGraph);
  const result = dijkstra(graphAdapter, sourceId, targetId);
  if (!result) return null;
  return buildRaidPath(compartGraph, result.edgePath, result.path, result.totalCost);
}

/**
 * Computes the cheapest path through doors only (no wall-breaking).
 * Returns null if no door-only path exists.
 */
export function cheapestDoorPath(compartGraph: CompartmentGraph): RaidPath | null {
  const tcCompartment = compartGraph.compartments.find((c) => c.containsTC);
  if (!tcCompartment) return null;

  const doorOnlyFilter = (e: BarrierEdge) =>
    e.barrierType === "open" ||
    e.barrierType === "door" ||
    e.barrierType === "garageDoor";

  const graphAdapter = makeGraphAdapter(compartGraph, doorOnlyFilter);
  const result = dijkstra(graphAdapter, "exterior", tcCompartment.id);
  if (!result) return null;
  return buildRaidPath(compartGraph, result.edgePath, result.path, result.totalCost);
}

/**
 * Full base evaluation — runs every analysis and returns an EvaluationReport.
 */
export function evaluate(spec: BaseSpec): EvaluationReport {
  const compartGraph = buildCompartmentGraph(spec);
  const structGraph = buildStructuralGraph(spec);

  const tcCompartment = compartGraph.compartments.find((c) => c.containsTC) ?? null;
  const lootCompartment = compartGraph.compartments.find((c) => c.containsLoot) ?? null;

  // Raid paths.
  let pathToTC: RaidPath | null = null;
  let sulfurToTC = Infinity;
  if (tcCompartment) {
    pathToTC = cheapestRaidPath(compartGraph, "exterior", tcCompartment.id);
    sulfurToTC = pathToTC?.totalSulfur ?? Infinity;
  }

  let pathToLoot: RaidPath | null = null;
  let sulfurToLoot: number | null = null;
  if (lootCompartment) {
    pathToLoot = cheapestRaidPath(compartGraph, "exterior", lootCompartment.id);
    sulfurToLoot = pathToLoot?.totalSulfur ?? null;
  }

  // Door-only path.
  const doorPath = cheapestDoorPath(compartGraph);
  const cheapestDoorPathSulfur = doorPath?.totalSulfur ?? Infinity;

  // Top-down analysis.
  const topDownResult = tcCompartment
    ? analyzeTopDown(spec, tcCompartment)
    : { layers: 0, minSulfurToReach: 0, objectIds: [] };

  // Advanced analyses.
  const stabilityBunkers = detectStabilityBunkers(spec, structGraph, compartGraph);
  const externallyExposedWalls = analyzeExternals(spec, compartGraph);

  return {
    baseSpecVersion: spec.version,
    gameDataVersion: GAME_DATA_VERSION,
    sulfurToTC: isFinite(sulfurToTC) ? sulfurToTC : 0,
    sulfurToLoot,
    cheapestDoorPathSulfur: isFinite(cheapestDoorPathSulfur) ? cheapestDoorPathSulfur : 0,
    topDownCost: topDownResult.minSulfurToReach,
    pathToTC,
    pathToLoot,
    doorPath,
    stabilityBunkers,
    externallyExposedWalls,
    antiTopdownLayers: topDownResult.layers,
  };
}
