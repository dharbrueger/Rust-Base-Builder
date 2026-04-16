/**
 * CLI — one-off evaluation, optimization, and base generation.
 *
 * Usage:
 *   node dist/cli/index.js evaluate <base64code>
 *   node dist/cli/index.js optimize <base64code> [--generations N] [--population N]
 *   node dist/cli/index.js generate <width> <depth> [--tier stone|metal|armored]
 *   node dist/cli/index.js help
 */

import { evaluate } from "../evaluator/raid-evaluator.js";
import { generateBaseSpec } from "../optimizer/generator.js";
import { runEvolutionSync } from "../optimizer/evolutionary-loop.js";
import { decodeBuilderCode, encodeBuilderCode, parseBuilderExport } from "../parser/parse-builder-export.js";
import { serializeToBuilderFormat } from "../parser/serialize.js";
import type { ModelTier } from "../base-spec/types.js";

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      result[args[i].slice(2)] = args[i + 1];
      i++;
    } else if (!args[i].startsWith("--")) {
      result[`_${Object.keys(result).filter((k) => k.startsWith("_")).length}`] = args[i];
    }
  }
  return result;
}

const [, , command, ...rest] = process.argv;
const flags = parseArgs(rest);

switch (command) {
  case "evaluate": {
    const code = flags["_0"];
    if (!code) {
      console.error("Usage: cli evaluate <base64code>");
      process.exit(1);
    }
    const raw = decodeBuilderCode(code);
    const spec = parseBuilderExport(raw);
    const report = evaluate(spec);
    console.log(JSON.stringify(report, null, 2));
    break;
  }

  case "optimize": {
    const code = flags["_0"];
    if (!code) {
      console.error("Usage: cli optimize <base64code> [--generations N] [--population N]");
      process.exit(1);
    }
    const raw = decodeBuilderCode(code);
    const seedSpec = parseBuilderExport(raw);
    const generations = parseInt(flags["generations"] ?? "20", 10);
    const populationSize = parseInt(flags["population"] ?? "20", 10);
    const topK = parseInt(flags["topk"] ?? "5", 10);

    const result = runEvolutionSync({ seedSpec, generations, populationSize, topK });
    console.log(JSON.stringify({ fitness: result.fitnessScore, report: result.report }, null, 2));
    break;
  }

  case "generate": {
    const width = parseInt(flags["_0"] ?? "2", 10);
    const depth = parseInt(flags["_1"] ?? "1", 10);
    const tier = (flags["tier"] ?? "stone") as ModelTier;
    const spec = generateBaseSpec(width, depth, tier);
    const raw = serializeToBuilderFormat(spec);
    const code = encodeBuilderCode(raw);
    console.log(code);
    break;
  }

  case "help":
  default: {
    console.log(`
rust-base-optimizer CLI

Commands:
  evaluate <base64code>
      Decode a builder export code and print the EvaluationReport as JSON.

  optimize <base64code> [--generations N] [--population N] [--topk N]
      Run the evolutionary optimizer and print the best result.

  generate <width> <depth> [--tier stone|metal|armored]
      Generate a rectangular base and print its builder import code.

  help
      Print this help message.
`.trim());
    break;
  }
}
