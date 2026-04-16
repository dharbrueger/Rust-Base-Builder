/**
 * Express HTTP API wrapping the parser + evaluator + optimizer.
 *
 * Endpoints:
 *   GET  /health            → { status: 'ok', version: string }
 *   POST /parse             → BaseSpec           (body: { code: string })
 *   POST /render            → { code: string }   (body: { spec: BaseSpec })
 *   POST /evaluate          → EvaluationReport   (body: { code: string, lootRoomId?: string })
 *   POST /optimize          → OptimizationResult & { code: string }
 *                                                (body: { code: string, generations?: number,
 *                                                         populationSize?: number,
 *                                                         diverseSeeds?: boolean,
 *                                                         weights?: FitnessWeights })
 *   GET  /leaderboard       → LeaderboardEntry[] (top-10 best results across all /optimize calls)
 */

import { Router } from "express";
import type { Request, Response } from "express";
import type { FitnessWeights, OptimizationResult } from "../base-spec/types.js";
import { evaluate } from "../evaluator/raid-evaluator.js";
import { GAME_DATA_VERSION } from "../game-data/game-data-table.js";
import { generateBaseSpec } from "../optimizer/generator.js";
import { runEvolutionSync } from "../optimizer/evolutionary-loop.js";
import {
  decodeBuilderCode,
  encodeBuilderCode,
  parseBuilderExport,
} from "../parser/parse-builder-export.js";
import { serializeToBuilderFormat } from "../parser/serialize.js";

const router = Router();

// ---------------------------------------------------------------------------
// In-memory leaderboard (Phase 5)
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  rank: number;
  fitnessScore: number;
  sulfurToTC: number;
  sulfurToLoot: number | null;
  cheapestDoorPathSulfur: number;
  objectCount: number;
  /** Builder import code for this result (importable into the 3D editor). */
  code: string;
  recordedAt: string; // ISO timestamp
}

const LEADERBOARD_MAX = 10;
const leaderboard: LeaderboardEntry[] = [];

function updateLeaderboard(result: OptimizationResult, code: string): void {
  const entry: Omit<LeaderboardEntry, "rank"> = {
    fitnessScore: result.fitnessScore,
    sulfurToTC: result.report.sulfurToTC,
    sulfurToLoot: result.report.sulfurToLoot,
    cheapestDoorPathSulfur: result.report.cheapestDoorPathSulfur,
    objectCount: result.spec.objects.length,
    code,
    recordedAt: new Date().toISOString(),
  };

  leaderboard.push({ rank: 0, ...entry });

  // Sort descending by fitness and keep top-N.
  leaderboard.sort((a, b) => b.fitnessScore - a.fitnessScore);
  leaderboard.splice(LEADERBOARD_MAX);

  // Re-assign ranks.
  for (let i = 0; i < leaderboard.length; i++) {
    leaderboard[i].rank = i + 1;
  }
}

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", version: GAME_DATA_VERSION });
});

// ---------------------------------------------------------------------------
// POST /parse
// ---------------------------------------------------------------------------

router.post("/parse", (req: Request, res: Response) => {
  try {
    const { code, name, author } = req.body as {
      code: string;
      name?: string;
      author?: string;
    };
    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Missing or invalid 'code' field" });
      return;
    }
    const raw = decodeBuilderCode(code);
    const spec = parseBuilderExport(raw, { name, author });
    res.json(spec);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// POST /render
// ---------------------------------------------------------------------------

router.post("/render", (req: Request, res: Response) => {
  try {
    const { spec } = req.body as { spec: Parameters<typeof serializeToBuilderFormat>[0] };
    if (!spec || !spec.objects) {
      res.status(400).json({ error: "Missing or invalid 'spec' field" });
      return;
    }
    const raw = serializeToBuilderFormat(spec);
    const code = encodeBuilderCode(raw);
    res.json({ code });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// POST /evaluate
// ---------------------------------------------------------------------------

router.post("/evaluate", (req: Request, res: Response) => {
  try {
    const { code, lootRoomId } = req.body as { code: string; lootRoomId?: string };
    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Missing or invalid 'code' field" });
      return;
    }
    const raw = decodeBuilderCode(code);
    const spec = parseBuilderExport(raw, { lootRoomCompartmentId: lootRoomId });
    const report = evaluate(spec);
    res.json(report);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// POST /optimize
// ---------------------------------------------------------------------------

router.post("/optimize", (req: Request, res: Response) => {
  try {
    const {
      code,
      generations = 20,
      populationSize = 30,
      topK = 5,
      diverseSeeds = false,
      weights,
    } = req.body as {
      code: string;
      generations?: number;
      populationSize?: number;
      topK?: number;
      diverseSeeds?: boolean;
      weights?: FitnessWeights;
    };

    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Missing or invalid 'code' field" });
      return;
    }

    const raw = decodeBuilderCode(code);
    const seedSpec = parseBuilderExport(raw);

    const result = runEvolutionSync({
      seedSpec,
      generations,
      populationSize,
      topK,
      diverseSeeds,
      weights,
    });

    // Serialize the best spec back to a builder import code.
    const bestRaw = serializeToBuilderFormat(result.spec);
    const bestCode = encodeBuilderCode(bestRaw);

    // Update the persistent leaderboard.
    updateLeaderboard(result, bestCode);

    res.json({ ...result, code: bestCode });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// GET /leaderboard  (Phase 5)
// ---------------------------------------------------------------------------

router.get("/leaderboard", (_req: Request, res: Response) => {
  res.json(leaderboard);
});

// ---------------------------------------------------------------------------
// POST /generate — convenience endpoint
// ---------------------------------------------------------------------------

router.post("/generate", (req: Request, res: Response) => {
  try {
    const { width = 2, depth = 1, tier = "stone" } = req.body as {
      width?: number;
      depth?: number;
      tier?: "stone" | "metal" | "armored";
    };
    const spec = generateBaseSpec(width, depth, tier);
    const raw = serializeToBuilderFormat(spec);
    const code = encodeBuilderCode(raw);
    res.json({ spec, code });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

export { router };
