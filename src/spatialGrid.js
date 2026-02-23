/**
 * Spatial hash grid for fast neighbor queries on the XZ plane.
 *
 * Usage:
 *   const grid = new SpatialGrid(cellSize);
 *   grid.clear();
 *   grid.insert(entity);          // entity must have .mesh.position or .position
 *   const nearby = grid.query(x, z, radius);
 */
export class SpatialGrid {
  constructor(cellSize = 8) {
    this.cellSize = cellSize;
    this.invCellSize = 1 / cellSize;
    this.cells = new Map();
  }

  _key(cx, cz) {
    return cx * 73856093 + cz * 19349663;
  }

  _cellCoord(v) {
    return Math.floor(v * this.invCellSize);
  }

  clear() {
    this.cells.clear();
  }

  insert(entity) {
    const pos = entity.mesh ? entity.mesh.position : entity.position;
    if (!pos) return;
    const cx = this._cellCoord(pos.x);
    const cz = this._cellCoord(pos.z);
    const key = this._key(cx, cz);
    let bucket = this.cells.get(key);
    if (!bucket) {
      bucket = [];
      this.cells.set(key, bucket);
    }
    bucket.push(entity);
  }

  /**
   * Return all entities whose cell is within radius of (x, z).
   * This is a broad-phase query; callers should do a fine distance check.
   */
  query(x, z, radius) {
    const results = [];
    const minCx = this._cellCoord(x - radius);
    const maxCx = this._cellCoord(x + radius);
    const minCz = this._cellCoord(z - radius);
    const maxCz = this._cellCoord(z + radius);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const bucket = this.cells.get(this._key(cx, cz));
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) {
            results.push(bucket[i]);
          }
        }
      }
    }
    return results;
  }

  /**
   * Rebuild the grid from a full entity list.
   */
  rebuild(entities) {
    this.clear();
    for (let i = 0; i < entities.length; i++) {
      this.insert(entities[i]);
    }
  }
}
