// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Map System
// ============================================================

class MapSystem {
  constructor() {
    this.grid = [];
    this.entries = [];
    this.exits = [];
    this.corePosition = null;
    this.initializeGrid();
    this.generateDefaultMap();
  }

  initializeGrid() {
    this.grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push(TILE_BUILDABLE);
      }
      this.grid.push(row);
    }
  }

  generateDefaultMap() {
    // Create a path from left to right with some curves
    this.createPath([
      { x: 0, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 4 },
      { x: 16, y: 4 },
      { x: 16, y: 12 },
      { x: 19, y: 12 }
    ]);

    // Place the energy core at the end of the path
    this.corePosition = { x: 19, y: 12 };
    this.grid[12][19] = TILE_CORE;

    // Set entry points
    this.entries = [{ x: 0, y: 5 }];

    // Set exit points (the core)
    this.exits = [{ x: 19, y: 12 }];
  }

  createPath(points) {
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];

      // Draw a line between consecutive points
      const dx = Math.sign(end.x - start.x);
      const dy = Math.sign(end.y - start.y);
      let x = start.x;
      let y = start.y;

      while (x !== end.x || y !== end.y) {
        this.setTile(x, y, TILE_PATH);

        // Add width to the path
        if (this.inBounds(x + 1, y)) this.setTile(x + 1, y, TILE_PATH);

        if (x === end.x) y += dy;
        else if (y === end.y) x += dx;
        else {
          // Diagonal - choose the longer axis
          const dxRemain = Math.abs(end.x - x);
          const dyRemain = Math.abs(end.y - y);
          if (dxRemain > dyRemain) x += dx;
          else y += dy;
        }
      }
      this.setTile(x, y, TILE_PATH);
      if (this.inBounds(x + 1, y)) this.setTile(x + 1, y, TILE_PATH);
    }
  }

  setTile(x, y, type) {
    if (this.inBounds(x, y)) {
      this.grid[y][x] = type;
    }
  }

  getTile(x, y) {
    if (this.inBounds(x, y)) {
      return this.grid[y][x];
    }
    return TILE_BLOCKED;
  }

  inBounds(x, y) {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
  }

  canBuild(x, y) {
    if (!this.inBounds(x, y)) return false;
    const tile = this.getTile(x, y);
    return tile === TILE_BUILDABLE;
  }

  isPath(x, y) {
    if (!this.inBounds(x, y)) return false;
    return this.getTile(x, y) === TILE_PATH;
  }

  placeTower(x, y) {
    if (this.canBuild(x, y)) {
      this.setTile(x, y, TILE_TOWER);
      return true;
    }
    return false;
  }

  removeTower(x, y) {
    if (this.inBounds(x, y) && this.getTile(x, y) === TILE_TOWER) {
      this.setTile(x, y, TILE_BUILDABLE);
      return true;
    }
    return false;
  }

  getCorePosition() {
    return this.corePosition;
  }

  getEntries() {
    return this.entries;
  }

  getExits() {
    return this.exits;
  }

  getGrid() {
    return this.grid;
  }

  // Serialization for save/load
  serialize() {
    return {
      grid: this.grid.map(row => [...row]),
      entries: [...this.entries],
      exits: [...this.exits],
      corePosition: { ...this.corePosition }
    };
  }

  deserialize(data) {
    this.grid = data.grid.map(row => [...row]);
    this.entries = [...data.entries];
    this.exits = [...data.exits];
    this.corePosition = { ...data.corePosition };
  }
}
