/**
 * Core TypeScript interfaces for the rust-base-optimizer system.
 * All layers (parser, topology, evaluator, optimizer) share these types.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type ModelTier = "stone" | "metal" | "armored";

export type ModelCategory =
  | "foundation"
  | "wall"
  | "doorway"
  | "window"
  | "wallFrame"
  | "stairs"
  | "floor"
  | "floorFrame"
  | "roof"
  | "roofWall"
  | "door"
  | "windowInsert"
  | "misc";

export type ModelShape =
  | "square"
  | "triangle"
  | "lShape"
  | "uShape"
  | "left"
  | "right"
  | "none";

export type ModelGrade = "high" | "mid" | "low";

// ---------------------------------------------------------------------------
// Spatial primitives
// ---------------------------------------------------------------------------

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ---------------------------------------------------------------------------
// BaseSpec — canonical representation of a placed base
// ---------------------------------------------------------------------------

export interface BaseObject {
  /** Unique id carried over from the builder dict key */
  id: string;
  /** Exact model name string used by the builder (e.g. "StoneWallHigh") */
  builderModelName: string;
  modelType: ModelCategory;
  tier: ModelTier | null;
  shape: ModelShape;
  grade: ModelGrade | null;
  /** Whether this object is a load-bearing structural piece */
  isStructural: boolean;
  /** Whether this object is an insert placed inside a structural frame (door, window) */
  isInsert: boolean;
  /** Normalised grid position */
  position: Vec3;
  /** Canonical rotation in degrees [0, 360) around the Y axis */
  rotationDeg: number;
  /** Optional build-phase tag for staged-build analysis (default 1) */
  buildPhase?: number;
}

export interface BaseSpecMetadata {
  name?: string;
  author?: string;
  /** Version of the game-data table that was used when this spec was created */
  gameDataVersion: string;
  /** Compartment id tagged by the user as the main loot room */
  lootRoomCompartmentId?: string;
  /** Auto-detected compartment containing the Tool Cupboard */
  tcCompartmentId?: string;
}

export interface BaseSpec {
  version: "1.0";
  metadata: BaseSpecMetadata;
  objects: BaseObject[];
}

// ---------------------------------------------------------------------------
// Builder export format (raw, before base64+pako)
// ---------------------------------------------------------------------------

export interface BuilderModelData {
  model: string;
  position: Vec3;
  rotation: Vec3;
}

export type BuilderExport = Record<string, BuilderModelData>;

// ---------------------------------------------------------------------------
// Raid / build cost entries (mirrors game-data-table)
// ---------------------------------------------------------------------------

export interface RaidCostEntry {
  rockets: number;
  explosives: number;
  expAmmo: number;
  satchels: number;
  /** Cheapest option expressed as raw sulfur */
  minSulfur: number;
}

export interface BuildCostEntry {
  stone: number;
  metal: number;
  hqMetal: number;
  wood: number;
  scrap: number;
  gear: number;
  lqFuel: number;
}

// ---------------------------------------------------------------------------
// Topology — compartment graph
// ---------------------------------------------------------------------------

export interface CompartmentNode {
  id: string;
  isExterior: boolean;
  floorLevel: number;
  /** Builder ids of foundations that make up this compartment */
  foundationIds: string[];
  containsTC: boolean;
  containsLoot: boolean;
}

export type BarrierType =
  | "open"
  | "wall"
  | "doorway"
  | "door"
  | "garageDoor"
  | "windowInsert"
  | "frame";

export interface BarrierEdge {
  id: string;
  fromCompartmentId: string;
  toCompartmentId: string;
  barrierType: BarrierType;
  /** The structural object (wall / doorway / frame) occupying this slot */
  structuralObjectId: string | null;
  /** A door / window insert placed in the structural frame */
  insertObjectId: string | null;
  /** Cheapest sulfur cost to pass through this barrier (0 if open) */
  raidCostSulfur: number;
}

export interface CompartmentGraph {
  compartments: CompartmentNode[];
  edges: BarrierEdge[];
}

// ---------------------------------------------------------------------------
// Structural graph
// ---------------------------------------------------------------------------

export interface StructuralNode {
  objectId: string;
  /** Estimated structural stability 0–100 */
  stabilityPct: number;
}

export interface StructuralEdge {
  fromId: string;
  toId: string;
  relation: "supports" | "supportedBy" | "adjacent";
}

export interface StructuralGraph {
  nodes: Map<string, StructuralNode>;
  edges: StructuralEdge[];
  /** Adjacency list: objectId → list of neighbour objectIds */
  adjacency: Map<string, string[]>;
}

// ---------------------------------------------------------------------------
// Evaluation report
// ---------------------------------------------------------------------------

export interface RaidStep {
  barrierEdgeId: string;
  fromCompartmentId: string;
  toCompartmentId: string;
  objectDestroyed: string | null;
  sulfurCost: number;
}

export interface RaidPath {
  steps: RaidStep[];
  totalSulfur: number;
  explosiveType: "cheapest" | "rockets" | "explosives" | "expAmmo" | "satchels";
}

export interface StabilityBunkerInfo {
  objectId: string;
  stabilityPct: number;
  /** Effective HP accounting for stability modifier */
  effectiveHp: number;
  /** Approximate number of pickaxe hits to destroy */
  pickaxeHits: number;
  /** Whether this object lies on a cheaper raid path than the wall tier suggests */
  blocksCheaperPath: boolean;
}

export interface ExposedWallInfo {
  objectId: string;
  isSoftSideExposed: boolean;
  sulfurCostIfAttacked: number;
}

export interface EvaluationReport {
  baseSpecVersion: string;
  gameDataVersion: string;
  /** Cheapest sulfur to reach the TC compartment from exterior */
  sulfurToTC: number;
  /** Cheapest sulfur to reach the loot compartment (null if not tagged) */
  sulfurToLoot: number | null;
  /** Sulfur cost using doors only — no wall-breaking */
  cheapestDoorPathSulfur: number;
  /** Sum of minimum raid costs for all roofs/floors above the TC */
  topDownCost: number;
  pathToTC: RaidPath | null;
  pathToLoot: RaidPath | null;
  doorPath: RaidPath | null;
  stabilityBunkers: StabilityBunkerInfo[];
  externallyExposedWalls: ExposedWallInfo[];
  antiTopdownLayers: number;
}

// ---------------------------------------------------------------------------
// Optimizer
// ---------------------------------------------------------------------------

export interface FitnessWeights {
  /** How much to reward high sulfurToTC (maximize) */
  sulfurToTC: number;
  /** How much to reward high sulfurToLoot (maximize) */
  sulfurToLoot: number;
  /** How much to reward expensive door path (maximize) */
  doorPath: number;
  /** Penalty per unit of build cost (minimize) */
  buildCostPenalty: number;
}

export interface OptimizationResult {
  generation: number;
  spec: BaseSpec;
  report: EvaluationReport;
  fitnessScore: number;
}
