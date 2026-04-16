export { computeFitness, totalBuildCostSulfur, countOpenExteriorFaces, DEFAULT_WEIGHTS } from "./fitness.js";
export { generateMutants, upgradeRandomWall, upgradeAllWalls, addDoor, replaceWallWithDoorway, removeObject, addFoundation, removeFoundation, addFloor } from "./mutator.js";
export { generateBaseSpec, generateDiverseSeeds } from "./generator.js";
export { runEvolutionSync } from "./evolutionary-loop.js";
