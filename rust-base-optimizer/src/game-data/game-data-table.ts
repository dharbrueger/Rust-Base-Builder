/**
 * Game data table — raid costs, build costs, HP, and upkeep for every model.
 *
 * Raid costs sourced from RaidCalculator.tsx in the Rust Base Builder.
 * Build costs sourced from BuildCalculator.tsx.
 * HP values are approximate vanilla Rust values (as of game version 6.0.0).
 *
 * Sulfur cost multipliers per unit:
 *   rocket     = 1400
 *   explosive  = 2200  (C4)
 *   expAmmo    = 25    (explosive ammo)
 *   satchel    = 480
 */

import type { BuildCostEntry, RaidCostEntry } from "../base-spec/types.js";

/** Version of the game data — bump when game balance patches change costs. */
export const GAME_DATA_VERSION = "6.0.0";

// ---------------------------------------------------------------------------
// Helper to derive minSulfur from the cheapest raid option
// ---------------------------------------------------------------------------

const SULFUR = {
  rocket: 1400,
  explosive: 2200,
  expAmmo: 25,
  satchel: 480,
} as const;

function mkRaid(
  rockets: number,
  explosives: number,
  expAmmo: number,
  satchels: number
): RaidCostEntry {
  const options = [
    rockets > 0 ? rockets * SULFUR.rocket : Infinity,
    explosives > 0 ? explosives * SULFUR.explosive : Infinity,
    expAmmo > 0 ? expAmmo * SULFUR.expAmmo : Infinity,
    satchels > 0 ? satchels * SULFUR.satchel : Infinity,
  ];
  const minSulfur = Math.min(...options) === Infinity ? 0 : Math.min(...options);
  return { rockets, explosives, expAmmo, satchels, minSulfur };
}

const ZERO_RAID: RaidCostEntry = { rockets: 0, explosives: 0, expAmmo: 0, satchels: 0, minSulfur: 0 };

// ---------------------------------------------------------------------------
// Raid cost table
// Sourced directly from RaidCalculator.tsx switch-cases.
// ---------------------------------------------------------------------------

export const RAID_COSTS: Record<string, RaidCostEntry> = {
  // ── Stone structural ──────────────────────────────────────────────────────
  StoneFoundationSquareHigh:     mkRaid(4, 2, 185, 10),
  StoneFoundationSquareMid:      mkRaid(4, 2, 185, 10),
  StoneFoundationSquareLow:      mkRaid(4, 2, 185, 10),
  StoneFoundationTriangleHigh:   mkRaid(4, 2, 185, 10),
  StoneFoundationTriangleMid:    mkRaid(4, 2, 185, 10),
  StoneFoundationTriangleLow:    mkRaid(4, 2, 185, 10),
  StoneWallHigh:                 mkRaid(4, 2, 185, 10),
  StoneWallMid:                  mkRaid(4, 2, 185, 10),
  StoneWallLow:                  mkRaid(4, 2, 185, 10),
  StoneRoofWallLeft:             mkRaid(4, 2, 185, 10),
  StoneRoofWallRight:            mkRaid(4, 2, 185, 10),
  StoneDoorway:                  mkRaid(4, 2, 185, 10),
  StoneWindow:                   mkRaid(4, 2, 185, 10),
  StoneWallFrame:                mkRaid(4, 2, 185, 10),
  StoneFloorSquare:              mkRaid(4, 2, 185, 10),
  StoneFloorTriangle:            mkRaid(4, 2, 185, 10),
  StoneFloorFrameSquare:         mkRaid(4, 2, 185, 10),
  StoneFloorFrameTriangle:       mkRaid(4, 2, 185, 10),
  StoneRoofSquare:               mkRaid(4, 2, 185, 10),
  StoneRoofTriangle:             mkRaid(4, 2, 185, 10),
  // Stone stairs use ammo only path from efficiency mode
  StoneStairsLShape:             mkRaid(4, 0, 173, 10),
  StoneStairsUShape:             mkRaid(4, 0, 173, 10),

  // ── Metal structural ──────────────────────────────────────────────────────
  MetalFoundationSquareHigh:     mkRaid(8, 4, 461, 23),
  MetalFoundationSquareMid:      mkRaid(8, 4, 461, 23),
  MetalFoundationSquareLow:      mkRaid(8, 4, 461, 23),
  MetalFoundationTriangleHigh:   mkRaid(8, 4, 461, 23),
  MetalFoundationTriangleMid:    mkRaid(8, 4, 461, 23),
  MetalFoundationTriangleLow:    mkRaid(8, 4, 461, 23),
  MetalWallHigh:                 mkRaid(8, 4, 400, 23),
  MetalWallMid:                  mkRaid(8, 4, 400, 23),
  MetalWallLow:                  mkRaid(8, 4, 400, 23),
  MetalRoofWallLeft:             mkRaid(8, 4, 400, 23),
  MetalRoofWallRight:            mkRaid(8, 4, 400, 23),
  MetalDoorway:                  mkRaid(8, 4, 400, 23),
  MetalWindow:                   mkRaid(8, 4, 400, 23),
  MetalWallFrame:                mkRaid(8, 4, 400, 23),
  MetalFloorSquare:              mkRaid(8, 4, 400, 23),
  MetalFloorTriangle:            mkRaid(8, 4, 413, 23),
  MetalFloorFrameSquare:         mkRaid(8, 4, 400, 23),
  MetalFloorFrameTriangle:       mkRaid(8, 4, 400, 23),
  MetalRoofSquare:               mkRaid(8, 4, 400, 23),
  MetalRoofTriangle:             mkRaid(8, 4, 400, 23),
  MetalStairsLShape:             mkRaid(8, 0, 399, 23),
  MetalStairsUShape:             mkRaid(8, 0, 399, 23),

  // ── Armored structural ────────────────────────────────────────────────────
  ArmoredFoundationSquareHigh:   mkRaid(15, 8, 799, 46),
  ArmoredFoundationSquareMid:    mkRaid(15, 8, 799, 46),
  ArmoredFoundationSquareLow:    mkRaid(15, 8, 799, 46),
  ArmoredFoundationTriangleHigh: mkRaid(15, 8, 799, 46),
  ArmoredFoundationTriangleMid:  mkRaid(15, 8, 799, 46),
  ArmoredFoundationTriangleLow:  mkRaid(15, 8, 799, 46),
  ArmoredWallHigh:               mkRaid(15, 8, 799, 46),
  ArmoredWallMid:                mkRaid(15, 8, 799, 46),
  ArmoredWallLow:                mkRaid(15, 8, 799, 46),
  ArmoredRoofWallLeft:           mkRaid(15, 8, 799, 46),
  ArmoredRoofWallRight:          mkRaid(15, 8, 799, 46),
  ArmoredDoorway:                mkRaid(15, 8, 799, 46),
  ArmoredWindow:                 mkRaid(15, 8, 799, 46),
  ArmoredWallFrame:              mkRaid(15, 8, 799, 46),
  ArmoredFloorSquare:            mkRaid(15, 8, 799, 46),
  ArmoredFloorTriangle:          mkRaid(15, 8, 799, 46),
  ArmoredFloorFrameSquare:       mkRaid(15, 8, 799, 46),
  ArmoredFloorFrameTriangle:     mkRaid(15, 8, 799, 46),
  ArmoredRoofSquare:             mkRaid(15, 8, 799, 46),
  ArmoredRoofTriangle:           mkRaid(15, 8, 799, 46),
  ArmoredStairsLShape:           mkRaid(15, 8, 799, 46),
  ArmoredStairsUShape:           mkRaid(15, 8, 799, 46),

  // ── Door inserts ─────────────────────────────────────────────────────────
  MetalDoor:               mkRaid(2, 1, 63, 4),
  GarageDoor:              mkRaid(3, 2, 150, 9),
  // ── Window inserts ───────────────────────────────────────────────────────
  MetalVerticalEmbrasure:  mkRaid(4, 0, 173, 13),
  StrenghtenedGlassWindow: mkRaid(3, 0, 140, 9),

  // ── Misc — not raidable via explosives ───────────────────────────────────
  ToolCupboard:  ZERO_RAID,
  LargeWoodBox:  ZERO_RAID,
  WoodStorageBox: ZERO_RAID,
  Furnace:       ZERO_RAID,
  WorkbenchT3:   ZERO_RAID,
  SleepingBag:   ZERO_RAID,
};

// ---------------------------------------------------------------------------
// Build cost table
// Sourced from BuildCalculator.tsx (stone / metal frag / HQ metal columns).
// Wood column = twig→wood upgrade cost (also from BuildCalculator.tsx).
// ---------------------------------------------------------------------------

export const BUILD_COSTS: Record<string, BuildCostEntry> = {
  // ── Stone ─────────────────────────────────────────────────────────────────
  StoneFoundationSquareHigh:     { stone: 300, metal: 0, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneFoundationSquareMid:      { stone: 300, metal: 0, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneFoundationSquareLow:      { stone: 300, metal: 0, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneFoundationTriangleHigh:   { stone: 150, metal: 0, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneFoundationTriangleMid:    { stone: 150, metal: 0, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneFoundationTriangleLow:    { stone: 150, metal: 0, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneWallHigh:                 { stone: 300, metal: 0, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneWallMid:                  { stone: 300, metal: 0, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneWallLow:                  { stone: 150, metal: 0, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneDoorway:                  { stone: 210, metal: 0, hqMetal: 0, wood: 35,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneWindow:                   { stone: 210, metal: 0, hqMetal: 0, wood: 35,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneWallFrame:                { stone: 150, metal: 0, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneStairsLShape:             { stone: 300, metal: 0, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneStairsUShape:             { stone: 300, metal: 0, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneFloorSquare:              { stone: 150, metal: 0, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneFloorTriangle:            { stone: 75,  metal: 0, hqMetal: 0, wood: 13,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneFloorFrameSquare:         { stone: 150, metal: 0, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneFloorFrameTriangle:       { stone: 75,  metal: 0, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneRoofSquare:               { stone: 150, metal: 0, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneRoofTriangle:             { stone: 150, metal: 0, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneRoofWallLeft:             { stone: 300, metal: 0, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  StoneRoofWallRight:            { stone: 300, metal: 0, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },

  // ── Metal ─────────────────────────────────────────────────────────────────
  MetalFoundationSquareHigh:     { stone: 0, metal: 200, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalFoundationSquareMid:      { stone: 0, metal: 200, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalFoundationSquareLow:      { stone: 0, metal: 200, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalFoundationTriangleHigh:   { stone: 0, metal: 100, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalFoundationTriangleMid:    { stone: 0, metal: 100, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalFoundationTriangleLow:    { stone: 0, metal: 100, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalWallHigh:                 { stone: 0, metal: 200, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalWallMid:                  { stone: 0, metal: 200, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalWallLow:                  { stone: 0, metal: 100, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalDoorway:                  { stone: 0, metal: 140, hqMetal: 0, wood: 35,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalWindow:                   { stone: 0, metal: 140, hqMetal: 0, wood: 35,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalWallFrame:                { stone: 0, metal: 100, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalStairsLShape:             { stone: 0, metal: 200, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalStairsUShape:             { stone: 0, metal: 200, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalFloorSquare:              { stone: 0, metal: 100, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalFloorTriangle:            { stone: 0, metal: 50,  hqMetal: 0, wood: 13,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalFloorFrameSquare:         { stone: 0, metal: 100, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalFloorFrameTriangle:       { stone: 0, metal: 50,  hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalRoofSquare:               { stone: 0, metal: 100, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalRoofTriangle:             { stone: 0, metal: 100, hqMetal: 0, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalRoofWallLeft:             { stone: 0, metal: 200, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  MetalRoofWallRight:            { stone: 0, metal: 200, hqMetal: 0, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },

  // ── Armored ───────────────────────────────────────────────────────────────
  ArmoredFoundationSquareHigh:   { stone: 0, metal: 0, hqMetal: 25, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredFoundationSquareMid:    { stone: 0, metal: 0, hqMetal: 25, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredFoundationSquareLow:    { stone: 0, metal: 0, hqMetal: 25, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredFoundationTriangleHigh: { stone: 0, metal: 0, hqMetal: 13, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredFoundationTriangleMid:  { stone: 0, metal: 0, hqMetal: 13, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredFoundationTriangleLow:  { stone: 0, metal: 0, hqMetal: 13, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredWallHigh:               { stone: 0, metal: 0, hqMetal: 25, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredWallMid:                { stone: 0, metal: 0, hqMetal: 25, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredWallLow:                { stone: 0, metal: 0, hqMetal: 13, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredDoorway:                { stone: 0, metal: 0, hqMetal: 18, wood: 35,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredWindow:                 { stone: 0, metal: 0, hqMetal: 18, wood: 35,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredWallFrame:              { stone: 0, metal: 0, hqMetal: 13, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredStairsLShape:           { stone: 0, metal: 0, hqMetal: 25, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredStairsUShape:           { stone: 0, metal: 0, hqMetal: 25, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredFloorSquare:            { stone: 0, metal: 0, hqMetal: 13, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredFloorTriangle:          { stone: 0, metal: 0, hqMetal: 7,  wood: 13,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredFloorFrameSquare:       { stone: 0, metal: 0, hqMetal: 13, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredFloorFrameTriangle:     { stone: 0, metal: 0, hqMetal: 7,  wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredRoofSquare:             { stone: 0, metal: 0, hqMetal: 13, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredRoofTriangle:           { stone: 0, metal: 0, hqMetal: 13, wood: 25,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredRoofWallLeft:           { stone: 0, metal: 0, hqMetal: 25, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },
  ArmoredRoofWallRight:          { stone: 0, metal: 0, hqMetal: 25, wood: 50,  scrap: 0, gear: 0, lqFuel: 0 },

  // ── Inserts ───────────────────────────────────────────────────────────────
  MetalDoor:               { stone: 0, metal: 150, hqMetal: 0, wood: 0, scrap: 0, gear: 0, lqFuel: 0 },
  GarageDoor:              { stone: 0, metal: 300, hqMetal: 0, wood: 0, scrap: 0, gear: 2, lqFuel: 0 },
  MetalVerticalEmbrasure:  { stone: 0, metal: 100, hqMetal: 0, wood: 0, scrap: 0, gear: 0, lqFuel: 0 },
  StrenghtenedGlassWindow: { stone: 0, metal: 50,  hqMetal: 0, wood: 0, scrap: 0, gear: 0, lqFuel: 0 },

  // ── Misc ─────────────────────────────────────────────────────────────────
  ToolCupboard:  { stone: 0, metal: 0, hqMetal: 0, wood: 1000, scrap: 0,    gear: 0, lqFuel: 0 },
  LargeWoodBox:  { stone: 0, metal: 50, hqMetal: 0, wood: 350, scrap: 0,    gear: 0, lqFuel: 0 },
  WoodStorageBox:{ stone: 0, metal: 0,  hqMetal: 0, wood: 100, scrap: 0,    gear: 0, lqFuel: 0 },
  Furnace:       { stone: 200, metal: 0, hqMetal: 0, wood: 100, scrap: 0,   gear: 0, lqFuel: 50 },
  WorkbenchT3:   { stone: 0, metal: 1000, hqMetal: 100, wood: 0, scrap: 1250, gear: 0, lqFuel: 0 },
  SleepingBag:   { stone: 0, metal: 0, hqMetal: 0, wood: 0, scrap: 0,       gear: 0, lqFuel: 0 },
};

// ---------------------------------------------------------------------------
// HP table (approximate vanilla values)
// ---------------------------------------------------------------------------

export const HP: Record<string, number> = {
  // Stone
  StoneFoundationSquareHigh: 500, StoneFoundationSquareMid: 500, StoneFoundationSquareLow: 500,
  StoneFoundationTriangleHigh: 500, StoneFoundationTriangleMid: 500, StoneFoundationTriangleLow: 500,
  StoneWallHigh: 500, StoneWallMid: 500, StoneWallLow: 500,
  StoneDoorway: 500, StoneWindow: 500, StoneWallFrame: 500,
  StoneStairsLShape: 500, StoneStairsUShape: 500,
  StoneFloorSquare: 500, StoneFloorTriangle: 500,
  StoneFloorFrameSquare: 500, StoneFloorFrameTriangle: 500,
  StoneRoofSquare: 500, StoneRoofTriangle: 500,
  StoneRoofWallLeft: 500, StoneRoofWallRight: 500,
  // Metal
  MetalFoundationSquareHigh: 1000, MetalFoundationSquareMid: 1000, MetalFoundationSquareLow: 1000,
  MetalFoundationTriangleHigh: 1000, MetalFoundationTriangleMid: 1000, MetalFoundationTriangleLow: 1000,
  MetalWallHigh: 1000, MetalWallMid: 1000, MetalWallLow: 1000,
  MetalDoorway: 1000, MetalWindow: 1000, MetalWallFrame: 1000,
  MetalStairsLShape: 1000, MetalStairsUShape: 1000,
  MetalFloorSquare: 1000, MetalFloorTriangle: 1000,
  MetalFloorFrameSquare: 1000, MetalFloorFrameTriangle: 1000,
  MetalRoofSquare: 1000, MetalRoofTriangle: 1000,
  MetalRoofWallLeft: 1000, MetalRoofWallRight: 1000,
  // Armored
  ArmoredFoundationSquareHigh: 2000, ArmoredFoundationSquareMid: 2000, ArmoredFoundationSquareLow: 2000,
  ArmoredFoundationTriangleHigh: 2000, ArmoredFoundationTriangleMid: 2000, ArmoredFoundationTriangleLow: 2000,
  ArmoredWallHigh: 2000, ArmoredWallMid: 2000, ArmoredWallLow: 2000,
  ArmoredDoorway: 2000, ArmoredWindow: 2000, ArmoredWallFrame: 2000,
  ArmoredStairsLShape: 2000, ArmoredStairsUShape: 2000,
  ArmoredFloorSquare: 2000, ArmoredFloorTriangle: 2000,
  ArmoredFloorFrameSquare: 2000, ArmoredFloorFrameTriangle: 2000,
  ArmoredRoofSquare: 2000, ArmoredRoofTriangle: 2000,
  ArmoredRoofWallLeft: 2000, ArmoredRoofWallRight: 2000,
  // Inserts
  MetalDoor: 250, GarageDoor: 600,
  MetalVerticalEmbrasure: 500, StrenghtenedGlassWindow: 500,
  // Misc
  ToolCupboard: 500, LargeWoodBox: 350, WoodStorageBox: 100,
  Furnace: 500, WorkbenchT3: 500, SleepingBag: 100,
};
