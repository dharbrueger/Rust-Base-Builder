/**
 * Express HTTP API wrapping the parser + evaluator + optimizer.
 *
 * Endpoints:
 *   GET  /health            → { status: 'ok', version: string }
 *   POST /parse             → BaseSpec           (body: { code: string })
 *   POST /render            → { code: string }   (body: { spec: BaseSpec })
 *   POST /evaluate          → EvaluationReport   (body: { code: string, lootRoomId?: string })
 *   POST /optimize          → OptimizationResult (body: { code: string, generations?: number, populationSize?: number, weights?: FitnessWeights })
 */

import { Router } from "express";
import type { Request, Response } from "express";
import type { FitnessWeights } from "../base-spec/types.js";
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
      generations = 10,
      populationSize = 20,
      topK = 5,
      weights,
    } = req.body as {
      code: string;
      generations?: number;
      populationSize?: number;
      topK?: number;
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
      weights,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
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
