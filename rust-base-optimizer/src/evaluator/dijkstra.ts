/**
 * Generic Dijkstra shortest-path algorithm.
 *
 * Operates on an abstract graph where nodes are identified by string ids
 * and edges carry numeric weights.
 */

export interface DijkstraNeighbour {
  nodeId: string;
  weight: number;
  edgeId: string;
}

export interface DijkstraGraph {
  /** Returns the neighbours reachable from nodeId with their edge weights. */
  getNeighbours(nodeId: string): DijkstraNeighbour[];
  /** All node ids in the graph. */
  nodeIds: string[];
}

export interface DijkstraResult {
  /** Ordered list of node ids from source to target. */
  path: string[];
  /** Ordered list of edge ids traversed. */
  edgePath: string[];
  totalCost: number;
}

/**
 * Runs Dijkstra from `sourceId` to `targetId` on the provided graph.
 * Returns null if no path exists.
 */
export function dijkstra(
  graph: DijkstraGraph,
  sourceId: string,
  targetId: string
): DijkstraResult | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, { nodeId: string; edgeId: string } | null>();

  for (const id of graph.nodeIds) {
    dist.set(id, Infinity);
    prev.set(id, null);
  }
  dist.set(sourceId, 0);

  // Simple priority queue using a sorted array (adequate for small graphs).
  const queue: { id: string; cost: number }[] = [{ id: sourceId, cost: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const { id: u, cost: uCost } = queue.shift()!;

    if (u === targetId) break;
    if (uCost > (dist.get(u) ?? Infinity)) continue;

    for (const { nodeId: v, weight, edgeId } of graph.getNeighbours(u)) {
      const alt = uCost + weight;
      if (alt < (dist.get(v) ?? Infinity)) {
        dist.set(v, alt);
        prev.set(v, { nodeId: u, edgeId });
        queue.push({ id: v, cost: alt });
      }
    }
  }

  if ((dist.get(targetId) ?? Infinity) === Infinity) return null;

  // Reconstruct path.
  const path: string[] = [];
  const edgePath: string[] = [];
  let current: string | null = targetId;
  while (current !== null) {
    path.unshift(current);
    const prevEntry: { nodeId: string; edgeId: string } | null | undefined = prev.get(current);
    if (prevEntry) {
      edgePath.unshift(prevEntry.edgeId);
      current = prevEntry.nodeId;
    } else {
      current = null;
    }
  }

  return { path, edgePath, totalCost: dist.get(targetId)! };
}
