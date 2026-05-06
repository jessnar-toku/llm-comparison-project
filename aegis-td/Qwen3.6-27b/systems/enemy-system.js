// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Enemy System
// ============================================================

class Enemy {
  constructor(type, path, progress = 0) {
    this.type = type;
    this.def = ENEMY_DEFS[type];
    
    // Position (in grid coords, with sub-pixel precision)
    this.path = path;
    this.pathIndex = 0;
    this.progress = progress; // 0-1 between current and next path node
    
    // Pixel position
    this.x = path[0].x;
    this.y = path[0].y;
    
    // Stats
    this.maxHealth = this.def.health;
    this.health = this.maxHealth;
    this.speed = this.def.speed;
    this.armor = this.def.armor;
    this.shield = this.def.shield || 0;
    this.maxShield = this.def.shield || 0;
    
    // State
    this.alive = true;
    this.reachedExit = false;
    this.effects = [];
    
    // Visual
    this.color = this.def.color;
    this.hitFlash = 0;
    this.scale = 1;
    this.spawnAnim = 1.0; // Scale animation on spawn
    
    // For adaptive enemies
    this.resistanceMod = 1;
    this.lastDamageSource = null;
  }

  update(deltaTime) {
    if (!this.alive) return;
    
    // Spawn animation
    if (this.spawnAnim < 1) {
      this.spawnAnim = Math.min(1, this.spawnAnim + deltaTime * 3);
    }
    
    // Hit flash decay
    if (this.hitFlash > 0) {
      this.hitFlash -= deltaTime;
    }
    
    // Update status effects
    this.updateEffects(deltaTime);
    
    // Calculate movement speed (apply slow effects)
    let effectiveSpeed = this.speed;
    const slowEffects = this.effects.filter(e => e.type === EFFECT_SLOW);
    slowEffects.forEach(e => {
      effectiveSpeed *= e.data.slowFactor || 0.5;
    });
    
    // Move along path
    if (this.path && this.pathIndex < this.path.length - 1) {
      const moveAmount = (effectiveSpeed * deltaTime) / TILE_SIZE;
      this.progress += moveAmount;
      
      while (this.progress >= 1 && this.pathIndex < this.path.length - 1) {
        this.progress -= 1;
        this.pathIndex++;
        
        if (this.pathIndex >= this.path.length - 1) {
          // Reached the exit
          this.reachedExit = true;
          this.alive = false;
          return;
        }
      }
      
      // Interpolate position
      const current = this.path[this.pathIndex];
      const next = this.path[this.pathIndex + 1];
      this.x = current.x + (next.x - current.x) * this.progress;
      this.y = current.y + (next.y - current.y) * this.progress;
    }
  }

  updateEffects(deltaTime) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.duration -= deltaTime;
      
      // Apply tick damage for DoT effects
      if (effect.data.damagePerTick) {
        effect.tickTimer = (effect.tickTimer || 0) + deltaTime;
        if (effect.tickTimer >= 1) {
          this.takeDamage(effect.data.damagePerTick, true);
          effect.tickTimer = 0;
        }
      }
      
      // Remove expired effects
      if (effect.duration <= 0) {
        this.effects.splice(i, 1);
      }
    }
  }

  takeDamage(amount, ignoreArmor = false) {
    if (!this.alive) return;
    
    this.hitFlash = 0.1;
    
    let actualDamage = amount;
    
    // Apply resistance modifier (for adaptive enemies)
    actualDamage *= this.resistanceMod;
    
    // Subtract armor (unless ignored)
    if (!ignoreArmor && this.armor > 0) {
      actualDamage = Math.max(1, actualDamage - this.armor);
    }
    
    // Hit shield first if present
    if (this.shield > 0) {
      const shieldDamage = Math.min(this.shield, actualDamage);
      this.shield -= shieldDamage;
      actualDamage -= shieldDamage;
    }
    
    // Apply remaining damage to health
    this.health -= actualDamage;
    
    if (this.health <= 0) {
      this.die();
    }
  }

  applyEffect(type, duration, data = {}) {
    // Check for stacking rules
    const existing = this.effects.find(e => e.type === type);
    
    if (existing) {
      // Some effects stack, some refresh
      if (type === EFFECT_BURN) {
        // Burn stacks
        this.effects.push({ type, duration, data, tickTimer: 0 });
      } else {
        // Refresh duration
        existing.duration = duration;
        Object.assign(existing.data, data);
      }
    } else {
      this.effects.push({ type, duration, data, tickTimer: 0 });
    }
  }

  hasEffect(type) {
    return this.effects.some(e => e.type === type);
  }

  die() {
    this.alive = false;
  }

  distanceTo(entity) {
    const dx = (entity.x - this.x) * TILE_SIZE;
    const dy = (entity.y - this.y) * TILE_SIZE;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // For adaptive enemies - learn from damage sources
  recordDamageSource(sourceType) {
    if (!this.def.adaptive) return;
    this.lastDamageSource = sourceType;
    
    // Increase resistance to the damage type
    this.resistanceMod *= 0.9;
  }

  serialize() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      health: this.health,
      maxHealth: this.maxHealth,
      pathIndex: this.pathIndex,
      progress: this.progress,
      effects: this.effects.map(e => ({
        type: e.type,
        duration: e.duration,
        data: { ...e.data }
      }))
    };
  }
}

class EnemySystem {
  constructor(mapSystem, pathfinding) {
    this.mapSystem = mapSystem;
    this.pathfinding = pathfinding;
    this.enemies = [];
    this.objectPool = [];
  }

  spawnEnemy(type, entryIndex = 0) {
    const entry = this.mapSystem.getEntries()[entryIndex % this.mapSystem.getEntries().length];
    
    // Calculate path to core
    const isFlying = ENEMY_DEFS[type].flying || false;
    const path = this.pathfinding.getPathToCore(entry.x, entry.y, isFlying);
    
    if (!path) return null;
    
    // Use object pool if available
    let enemy;
    if (this.objectPool.length > 0) {
      enemy = this.objectPool.pop();
      // Reset enemy state
      Object.assign(enemy, new Enemy(type, path));
    } else {
      enemy = new Enemy(type, path);
    }
    
    // Reference back to enemy system for splash damage
    enemy.enemies = this.enemies;
    
    this.enemies.push(enemy);
    return enemy;
  }

  spawnSwarm(type, count, entryIndex = 0) {
    const spawned = [];
    for (let i = 0; i < count; i++) {
      // Stagger spawns
      setTimeout(() => {
        const enemy = this.spawnEnemy(type, entryIndex);
        if (enemy) spawned.push(enemy);
      }, i * 100);
    }
    return spawned;
  }

  update(deltaTime) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(deltaTime);
      
      // Recycle dead enemies
      if (!enemy.alive) {
        if (enemy.reachedExit) {
          // Enemy reached the core
          this.onEnemyLeak();
        }
        this.objectPool.push(enemy);
        this.enemies.splice(i, 1);
      }
    }
  }

  onEnemyLeak() {
    // This will be overridden by the game
  }

  getAliveEnemies() {
    return this.enemies.filter(e => e.alive);
  }

  getAllEnemies() {
    return this.enemies;
  }

  serialize() {
    return this.enemies.map(e => e.serialize());
  }

  deserialize(data) {
    this.enemies = data.map(d => {
      const enemy = new Enemy(d.type, []);
      Object.assign(enemy, d);
      enemy.enemies = this.enemies;
      return enemy;
    });
  }
}
