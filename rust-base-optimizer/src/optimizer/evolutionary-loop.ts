/**
 * Evolutionary optimizer loop.
 *
 * Runs a simple (µ + λ) evolutionary strategy:
 *   1. Generate an initial population of mutants from the seed spec(s).
 *   2. Evaluate each candidate.
 *   3. Select the top-K fittest candidates.
 *   4. Mutate each survivor to produce the next generation.
 *   5. Repeat for the configured number of generations.
 *
 * When `diverseSeeds` is true the loop initialises the population from a wide
 * spread of footprint sizes and material tiers (see `generateDiverseSeeds`)
 * rather than from a single seed.  This allows the algorithm to discover the
 * optimal shape rather than being anchored to one starting point.
 *
 * Results can optionally be persisted to a JSONL file.
 */

import { appendFileSync, writeFileSync } from "fs";
import type {
  BaseSpec,
  EvaluationReport,
  FitnessWeights,
  OptimizationResult,
} from "../base-spec/types.js";
import { evaluate } from "../evaluator/raid-evaluator.js";
import { generateDiverseSeeds } from "./generator.js";
import { computeFitness, DEFAULT_WEIGHTS } from "./fitness.js";
import { generateMutants } from "./mutator.js";

export interface EvolutionConfig {
  seedSpec: BaseSpec;
  generations: number;
  populationSize: number;
  topK: number;
  weights?: FitnessWeights;
  /**
   * When true the algorithm also seeds the population with diverse rectangular
   * layouts (1×1 through 4×4, all three tiers) in addition to mutants of the
   * provided `seedSpec`.  This gives the ML process real structural variety to
   * learn from.
   */
  diverseSeeds?: boolean;
  /** Optional path to a JSONL file for logging all results. */
  logPath?: string;
}

export interface GenerationResult {
  generation: number;
  best: OptimizationResult;
  population: OptimizationResult[];
}

function evaluateSpec(spec: BaseSpec, gen: number, weights: FitnessWeights): OptimizationResult {
  const report: EvaluationReport = evaluate(spec);
  const fitnessScore = computeFitness(report, spec, weights);
  return { generation: gen, spec, report, fitnessScore };
}

function logResult(logPath: string, result: OptimizationResult): void {
  const line = JSON.stringify({
    generation: result.generation,
    fitness: result.fitnessScore,
    sulfurToTC: result.report.sulfurToTC,
    sulfurToLoot: result.report.sulfurToLoot,
    doorPath: result.report.cheapestDoorPathSulfur,
    objectCount: result.spec.objects.length,
  });
  appendFileSync(logPath, line + "\n", "utf8");
}

/**
 * Runs the full evolutionary loop synchronously and returns the best result.
 *
 * When `config.diverseSeeds` is true the initial population is seeded with the
 * full diverse-seed catalogue (all sizes × all tiers) plus mutants of the
 * caller-supplied `seedSpec`.
 */
export function runEvolutionSync(config: EvolutionConfig): OptimizationResult {
  const weights = config.weights ?? DEFAULT_WEIGHTS;

  if (config.logPath) {
    writeFileSync(config.logPath, "", "utf8"); // truncate/create
  }

  // Build the initial population.
  let seedSpecs: BaseSpec[] = [config.seedSpec];
  if (config.diverseSeeds) {
    seedSpecs = [...seedSpecs, ...generateDiverseSeeds()];
  }

  // Fill the rest of the population with mutants derived from the seeds.
  let population: BaseSpec[] = [...seedSpecs];
  const mutantsNeeded = Math.max(0, config.populationSize - population.length);
  for (let i = 0; i < mutantsNeeded; i++) {
    const parent = seedSpecs[i % seedSpecs.length];
    population.push(...generateMutants(parent, 1));
  }
  population = population.slice(0, config.populationSize);

  let overallBest: OptimizationResult | null = null;

  for (let gen = 1; gen <= config.generations; gen++) {
    const evaluated: OptimizationResult[] = population.map((spec) =>
      evaluateSpec(spec, gen, weights)
    );

    // Sort descending by fitness.
    evaluated.sort((a, b) => b.fitnessScore - a.fitnessScore);

    const genBest = evaluated[0];
    if (!overallBest || genBest.fitnessScore > overallBest.fitnessScore) {
      overallBest = genBest;
    }

    if (config.logPath) {
      for (const r of evaluated) logResult(config.logPath, r);
    }

    // Select top-K survivors.
    const survivors = evaluated.slice(0, config.topK).map((r) => r.spec);

    // Generate next generation from survivors.
    const mutantsPerSurvivor = Math.ceil(
      (config.populationSize - survivors.length) / survivors.length
    );
    const nextGen: BaseSpec[] = [...survivors];
    for (const survivor of survivors) {
      nextGen.push(...generateMutants(survivor, mutantsPerSurvivor));
      if (nextGen.length >= config.populationSize) break;
    }
    population = nextGen.slice(0, config.populationSize);
  }

  return overallBest ?? evaluateSpec(config.seedSpec, 0, weights);
}
