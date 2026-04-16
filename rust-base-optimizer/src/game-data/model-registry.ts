/**
 * Complete registry of every model name string used by the Rust Base Builder.
 * Derived by auditing RaidCalculator.tsx, BuildCalculator.tsx, and every
 * model component in src/components/models/.
 */

import type { ModelCategory, ModelGrade, ModelShape, ModelTier } from "../base-spec/types.js";

export interface ModelMeta {
  tier: ModelTier | null;
  category: ModelCategory;
  shape: ModelShape;
  grade: ModelGrade | null;
  isStructural: boolean;
  isInsert: boolean;
  isMisc: boolean;
}

/**
 * Maps every builder model name to its metadata.
 * Tier null = no material tier (doors, misc items).
 */
export const MODEL_REGISTRY: Record<string, ModelMeta> = {
  // ── Stone foundations ────────────────────────────────────────────────────
  StoneFoundationSquareHigh:     { tier: "stone",   category: "foundation", shape: "square",   grade: "high", isStructural: true,  isInsert: false, isMisc: false },
  StoneFoundationSquareMid:      { tier: "stone",   category: "foundation", shape: "square",   grade: "mid",  isStructural: true,  isInsert: false, isMisc: false },
  StoneFoundationSquareLow:      { tier: "stone",   category: "foundation", shape: "square",   grade: "low",  isStructural: true,  isInsert: false, isMisc: false },
  StoneFoundationTriangleHigh:   { tier: "stone",   category: "foundation", shape: "triangle", grade: "high", isStructural: true,  isInsert: false, isMisc: false },
  StoneFoundationTriangleMid:    { tier: "stone",   category: "foundation", shape: "triangle", grade: "mid",  isStructural: true,  isInsert: false, isMisc: false },
  StoneFoundationTriangleLow:    { tier: "stone",   category: "foundation", shape: "triangle", grade: "low",  isStructural: true,  isInsert: false, isMisc: false },
  // ── Stone walls ──────────────────────────────────────────────────────────
  StoneWallHigh:                 { tier: "stone",   category: "wall",       shape: "square",   grade: "high", isStructural: true,  isInsert: false, isMisc: false },
  StoneWallMid:                  { tier: "stone",   category: "wall",       shape: "square",   grade: "mid",  isStructural: true,  isInsert: false, isMisc: false },
  StoneWallLow:                  { tier: "stone",   category: "wall",       shape: "square",   grade: "low",  isStructural: true,  isInsert: false, isMisc: false },
  StoneDoorway:                  { tier: "stone",   category: "doorway",    shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  StoneWindow:                   { tier: "stone",   category: "window",     shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  StoneWallFrame:                { tier: "stone",   category: "wallFrame",  shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  // ── Stone stairs ─────────────────────────────────────────────────────────
  StoneStairsLShape:             { tier: "stone",   category: "stairs",     shape: "lShape",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  StoneStairsUShape:             { tier: "stone",   category: "stairs",     shape: "uShape",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  // ── Stone floors ─────────────────────────────────────────────────────────
  StoneFloorSquare:              { tier: "stone",   category: "floor",      shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  StoneFloorTriangle:            { tier: "stone",   category: "floor",      shape: "triangle", grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  StoneFloorFrameSquare:         { tier: "stone",   category: "floorFrame", shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  StoneFloorFrameTriangle:       { tier: "stone",   category: "floorFrame", shape: "triangle", grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  // ── Stone roofs ──────────────────────────────────────────────────────────
  StoneRoofSquare:               { tier: "stone",   category: "roof",       shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  StoneRoofTriangle:             { tier: "stone",   category: "roof",       shape: "triangle", grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  StoneRoofWallLeft:             { tier: "stone",   category: "roofWall",   shape: "left",     grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  StoneRoofWallRight:            { tier: "stone",   category: "roofWall",   shape: "right",    grade: null,   isStructural: true,  isInsert: false, isMisc: false },

  // ── Metal foundations ────────────────────────────────────────────────────
  MetalFoundationSquareHigh:     { tier: "metal",   category: "foundation", shape: "square",   grade: "high", isStructural: true,  isInsert: false, isMisc: false },
  MetalFoundationSquareMid:      { tier: "metal",   category: "foundation", shape: "square",   grade: "mid",  isStructural: true,  isInsert: false, isMisc: false },
  MetalFoundationSquareLow:      { tier: "metal",   category: "foundation", shape: "square",   grade: "low",  isStructural: true,  isInsert: false, isMisc: false },
  MetalFoundationTriangleHigh:   { tier: "metal",   category: "foundation", shape: "triangle", grade: "high", isStructural: true,  isInsert: false, isMisc: false },
  MetalFoundationTriangleMid:    { tier: "metal",   category: "foundation", shape: "triangle", grade: "mid",  isStructural: true,  isInsert: false, isMisc: false },
  MetalFoundationTriangleLow:    { tier: "metal",   category: "foundation", shape: "triangle", grade: "low",  isStructural: true,  isInsert: false, isMisc: false },
  // ── Metal walls ──────────────────────────────────────────────────────────
  MetalWallHigh:                 { tier: "metal",   category: "wall",       shape: "square",   grade: "high", isStructural: true,  isInsert: false, isMisc: false },
  MetalWallMid:                  { tier: "metal",   category: "wall",       shape: "square",   grade: "mid",  isStructural: true,  isInsert: false, isMisc: false },
  MetalWallLow:                  { tier: "metal",   category: "wall",       shape: "square",   grade: "low",  isStructural: true,  isInsert: false, isMisc: false },
  MetalDoorway:                  { tier: "metal",   category: "doorway",    shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  MetalWindow:                   { tier: "metal",   category: "window",     shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  MetalWallFrame:                { tier: "metal",   category: "wallFrame",  shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  // ── Metal stairs ─────────────────────────────────────────────────────────
  MetalStairsLShape:             { tier: "metal",   category: "stairs",     shape: "lShape",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  MetalStairsUShape:             { tier: "metal",   category: "stairs",     shape: "uShape",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  // ── Metal floors ─────────────────────────────────────────────────────────
  MetalFloorSquare:              { tier: "metal",   category: "floor",      shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  MetalFloorTriangle:            { tier: "metal",   category: "floor",      shape: "triangle", grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  MetalFloorFrameSquare:         { tier: "metal",   category: "floorFrame", shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  MetalFloorFrameTriangle:       { tier: "metal",   category: "floorFrame", shape: "triangle", grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  // ── Metal roofs ──────────────────────────────────────────────────────────
  MetalRoofSquare:               { tier: "metal",   category: "roof",       shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  MetalRoofTriangle:             { tier: "metal",   category: "roof",       shape: "triangle", grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  MetalRoofWallLeft:             { tier: "metal",   category: "roofWall",   shape: "left",     grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  MetalRoofWallRight:            { tier: "metal",   category: "roofWall",   shape: "right",    grade: null,   isStructural: true,  isInsert: false, isMisc: false },

  // ── Armored foundations ──────────────────────────────────────────────────
  ArmoredFoundationSquareHigh:   { tier: "armored", category: "foundation", shape: "square",   grade: "high", isStructural: true,  isInsert: false, isMisc: false },
  ArmoredFoundationSquareMid:    { tier: "armored", category: "foundation", shape: "square",   grade: "mid",  isStructural: true,  isInsert: false, isMisc: false },
  ArmoredFoundationSquareLow:    { tier: "armored", category: "foundation", shape: "square",   grade: "low",  isStructural: true,  isInsert: false, isMisc: false },
  ArmoredFoundationTriangleHigh: { tier: "armored", category: "foundation", shape: "triangle", grade: "high", isStructural: true,  isInsert: false, isMisc: false },
  ArmoredFoundationTriangleMid:  { tier: "armored", category: "foundation", shape: "triangle", grade: "mid",  isStructural: true,  isInsert: false, isMisc: false },
  ArmoredFoundationTriangleLow:  { tier: "armored", category: "foundation", shape: "triangle", grade: "low",  isStructural: true,  isInsert: false, isMisc: false },
  // ── Armored walls ────────────────────────────────────────────────────────
  ArmoredWallHigh:               { tier: "armored", category: "wall",       shape: "square",   grade: "high", isStructural: true,  isInsert: false, isMisc: false },
  ArmoredWallMid:                { tier: "armored", category: "wall",       shape: "square",   grade: "mid",  isStructural: true,  isInsert: false, isMisc: false },
  ArmoredWallLow:                { tier: "armored", category: "wall",       shape: "square",   grade: "low",  isStructural: true,  isInsert: false, isMisc: false },
  ArmoredDoorway:                { tier: "armored", category: "doorway",    shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  ArmoredWindow:                 { tier: "armored", category: "window",     shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  ArmoredWallFrame:              { tier: "armored", category: "wallFrame",  shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  // ── Armored stairs ───────────────────────────────────────────────────────
  ArmoredStairsLShape:           { tier: "armored", category: "stairs",     shape: "lShape",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  ArmoredStairsUShape:           { tier: "armored", category: "stairs",     shape: "uShape",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  // ── Armored floors ───────────────────────────────────────────────────────
  ArmoredFloorSquare:            { tier: "armored", category: "floor",      shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  ArmoredFloorTriangle:          { tier: "armored", category: "floor",      shape: "triangle", grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  ArmoredFloorFrameSquare:       { tier: "armored", category: "floorFrame", shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  ArmoredFloorFrameTriangle:     { tier: "armored", category: "floorFrame", shape: "triangle", grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  // ── Armored roofs ────────────────────────────────────────────────────────
  ArmoredRoofSquare:             { tier: "armored", category: "roof",       shape: "square",   grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  ArmoredRoofTriangle:           { tier: "armored", category: "roof",       shape: "triangle", grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  ArmoredRoofWallLeft:           { tier: "armored", category: "roofWall",   shape: "left",     grade: null,   isStructural: true,  isInsert: false, isMisc: false },
  ArmoredRoofWallRight:          { tier: "armored", category: "roofWall",   shape: "right",    grade: null,   isStructural: true,  isInsert: false, isMisc: false },

  // ── Door inserts ─────────────────────────────────────────────────────────
  MetalDoor:                     { tier: null,      category: "door",          shape: "none", grade: null, isStructural: false, isInsert: true,  isMisc: false },
  GarageDoor:                    { tier: null,      category: "door",          shape: "none", grade: null, isStructural: false, isInsert: true,  isMisc: false },
  // ── Window inserts ───────────────────────────────────────────────────────
  MetalVerticalEmbrasure:        { tier: null,      category: "windowInsert",  shape: "none", grade: null, isStructural: false, isInsert: true,  isMisc: false },
  StrenghtenedGlassWindow:       { tier: null,      category: "windowInsert",  shape: "none", grade: null, isStructural: false, isInsert: true,  isMisc: false },

  // ── Misc / furniture ─────────────────────────────────────────────────────
  ToolCupboard:                  { tier: null,      category: "misc",          shape: "none", grade: null, isStructural: false, isInsert: false, isMisc: true },
  LargeWoodBox:                  { tier: null,      category: "misc",          shape: "none", grade: null, isStructural: false, isInsert: false, isMisc: true },
  WoodStorageBox:                { tier: null,      category: "misc",          shape: "none", grade: null, isStructural: false, isInsert: false, isMisc: true },
  Furnace:                       { tier: null,      category: "misc",          shape: "none", grade: null, isStructural: false, isInsert: false, isMisc: true },
  WorkbenchT3:                   { tier: null,      category: "misc",          shape: "none", grade: null, isStructural: false, isInsert: false, isMisc: true },
  SleepingBag:                   { tier: null,      category: "misc",          shape: "none", grade: null, isStructural: false, isInsert: false, isMisc: true },
};

/** Sorted list of every supported model name. */
export const ALL_MODEL_NAMES: string[] = Object.keys(MODEL_REGISTRY).sort();
