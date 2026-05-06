// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — A* Pathfinding Engine
// ============================================================

class Pathfinding {
  constructor(mapSystem) {
    this.mapSystem = mapSystem;
    this.pathCache = new Map();
    this.cacheEnabled = true;
  }

  /**
   * Find path from start to goal using A* algorithm
   * @param {number} startX - Starting x coordinate
   * @param {number} startY - Starting y coordinate
   * @param {number} goalX - Goal x coordinate
   * @param {number} goalY - Goal y coordinate
   * @param {boolean} flying - Whether the entity can fly (ignores terrain)
   * @returns {Array<{x, y}>|null} Array of grid positions or null if no path
   */
  findPath(startX, startY, goalX, goalY, flying = false) {
    // Use cache if available
    if (this.cacheEnabled) {
      const cacheKey = `${startX},${startY},${goalX},${goalY}`;
      if (this.pathCache.has(cacheKey)) {
        return this.pathCache.get(cacheKey);
      }
    }

    const result = this.astar(startX, startY, goalX, goalY, flying);

    // Cache the result
    if (this.cacheEnabled && result) {
      const cacheKey = `${startX},${startY},${goalX},${goalY}`;
      this.pathCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * A* algorithm implementation
   */
  astar(startX, startY, goalX, goalY, flying) {
    const start = { x: startX, y: startY };
    const goal = { x: goalX, y: goalY };

    // Check if goal is valid
    if (!this.mapSystem.inBounds(goalX, goalY)) {
      return null;
    }

    // Open and closed sets
    const openSet = new Set();
    const closedSet = new Set();

    // G, F scores
    const gScore = new Map();
    const fScore = new Map();

    // Parent tracking
    const cameFrom = new Map();

    // Initialize
    const startKey = this.posKey(start);
    openSet.add(startKey);
    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(start, goal));

    while (openSet.size > 0) {
      // Find node with lowest F score
      let current = null;
      let currentF = Infinity;
      for (const key of openSet) {
        const f = fScore.get(key) || Infinity;
        if (f < currentF) {
          currentF = f;
          current = this.posFromKey(key);
        }
      }

      if (!current) break;

      const currentKey = this.posKey(current);

      // Check if we reached the goal
      if (current.x === goal.x && current.y === goal.y) {
        return this.reconstructPath(cameFrom, current);
      }

      // Move current from open to closed
      openSet.delete(currentKey);
      closedSet.add(currentKey);

      // Check neighbors
      const neighbors = this.getNeighbors(current, flying);
      for (const neighbor of neighbors) {
        const neighborKey = this.posKey(neighbor);

        if (closedSet.has(neighborKey)) continue;

        const tentativeG = (gScore.get(currentKey) || 0) + this.stepCost(current, neighbor);

        if (!openSet.has(neighborKey)) {
          openSet.add(neighborKey);
        } else if (tentativeG >= (gScore.get(neighborKey) || Infinity)) {
          continue;
        }

        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, goal));
      }
    }

    return null; // No path found
  }

  /**
   * Get valid neighbors for a position
   */
  getNeighbors(pos, flying) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 },  // Right
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }  // Left
    ];

    for (const dir of directions) {
      const nx = pos.x + dir.x;
      const ny = pos.y + dir.y;

      if (!this.mapSystem.inBounds(nx, ny)) continue;

      if (flying) {
        // Flying units can move anywhere except through towers and core
        const tile = this.mapSystem.getTile(nx, ny);
        if (tile !== TILE_TOWER && tile !== TILE_CORE) {
          neighbors.push({ x: nx, y: ny });
        }
      } else {
        // Ground units can only move on paths
        const tile = this.mapSystem.getTile(nx, ny);
        if (tile === TILE_PATH || tile === TILE_CORE) {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }

    return neighbors;
  }

  /**
   * Step cost between two positions
   */
  stepCost(from, to) {
    return 1; // Uniform cost for grid movement
  }

  /**
   * Manhattan distance heuristic
   */
  heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Reconstruct path from parent map
   */
  reconstructPath(cameFrom, current) {
    const path = [current];
    let currentKey = this.posKey(current);

    while (cameFrom.has(currentKey)) {
      current = cameFrom.get(currentKey);
      path.unshift(current);
      currentKey = this.posKey(current);
    }

    return path;
  }

  /**
   * Convert position to unique key for Map storage
   */
  posKey(pos) {
    return `${pos.x},${pos.y}`;
  }

  /**
   * Convert key back to position
   */
  posFromKey(key) {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  /**
   * Clear the path cache (call when map changes)
   */
  clearCache() {
    this.pathCache.clear();
  }

  /**
   * Invalidate cache entries for a specific region
   */
  invalidateCacheNear(x, y, radius) {
    for (const [key] of this.pathCache) {
      const [px, py] = key.split(',').map(Number);
      if (Math.abs(px - x) <= radius && Math.abs(py - y) <= radius) {
        this.pathCache.delete(key);
      }
    }
  }

  /**
   * Toggle cache on/off
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
  }

  /**
   * Get path to core from entry point (pre-computed for enemies)
   */
  getPathToCore(startX, startY, flying = false) {
    const core = this.mapSystem.getCorePosition();
    return this.findPath(startX, startY, core.x, core.y, flying);
  }
}
