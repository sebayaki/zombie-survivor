/**
 * Generic object pool to reduce GC pressure.
 *
 * Usage:
 *   const pool = new ObjectPool(() => new Particle(), (p) => p.reset());
 *   const obj = pool.acquire();
 *   pool.release(obj);
 */
export class ObjectPool {
  /**
   * @param {Function} factory  - Creates a new instance.
   * @param {Function} [reset]  - Resets an instance before reuse.
   */
  constructor(factory, reset) {
    this._factory = factory;
    this._reset = reset || (() => {});
    this._pool = [];
  }

  acquire() {
    if (this._pool.length > 0) {
      const obj = this._pool.pop();
      this._reset(obj);
      return obj;
    }
    return this._factory();
  }

  release(obj) {
    this._pool.push(obj);
  }

  prewarm(count) {
    for (let i = 0; i < count; i++) {
      this._pool.push(this._factory());
    }
  }

  get size() {
    return this._pool.length;
  }

  drain() {
    this._pool.length = 0;
  }
}
