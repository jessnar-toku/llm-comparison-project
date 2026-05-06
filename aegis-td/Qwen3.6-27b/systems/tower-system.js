// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Tower System
// ============================================================

class Tower {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.def = TOWER_DEFS[type];
    
    // Core stats (copy from definition)
    this.damage = this.def.damage;
    this.attackSpeed = this.def.attackSpeed;
    this.range = this.def.range;
    
    // State
    this.cooldown = 0;
    this.target = null;
    this.targetingMode = TARGET_FIRST;
    this.level = 1;
    this.upgrades = {};
    
    // Visual
    this.angle = 0;
    this.shooting = false;
    this.shootTimer = 0;
    this.pulseEffect = false;
  }

  update(deltaTime, enemies, towers) {
    // Apply support buffs
    this.applySupportBuffs(towers);
    
    // Update cooldown
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
    }
    
    // Find target
    if (this.cooldown <= 0) {
      this.target = this.findTarget(enemies);
      if (this.target) {
        this.shoot();
      }
    }
    
    // Update visual effects
    if (this.shootTimer > 0) {
      this.shootTimer -= deltaTime;
    }
    
    // Update angle toward target
    if (this.target && this.target.alive) {
      this.angle = Math.atan2(
        this.target.y - this.y,
        this.target.x - this.x
      );
    }
  }

  findTarget(enemies) {
    const inRange = enemies.filter(e => {
      if (!e.alive) return false;
      const dist = this.distanceTo(e);
      return dist <= this.range * TILE_SIZE;
    });

    if (inRange.length === 0) return null;

    switch (this.targetingMode) {
      case TARGET_FIRST:
        return inRange.reduce((first, e) => e.progress > first.progress ? e : first);
      case TARGET_LAST:
        return inRange.reduce((last, e) => e.progress < last.progress ? e : last);
      case TARGET_STRONGEST:
        return inRange.reduce((strongest, e) => e.health > strongest.health ? e : strongest);
      case TARGET_WEAKEST:
        return inRange.reduce((weakest, e) => e.health < weakest.health ? e : weakest);
      default:
        return inRange[0];
    }
  }

  shoot() {
    if (!this.target || !this.target.alive) return;
    
    this.cooldown = 1 / this.attackSpeed;
    this.shooting = true;
    this.shootTimer = 0.15;
    
    // Apply damage
    let damage = this.damage;
    
    // Handle splash damage
    if (this.def.splashRadius) {
      this.target.takeDamage(damage);
      // Apply splash to nearby enemies
      const enemies = this.target.enemies;
      enemies.forEach(e => {
        if (e !== this.target && e.alive) {
          const dist = this.target.distanceTo(e);
          if (dist <= this.def.splashRadius * TILE_SIZE) {
            e.takeDamage(damage * 0.5);
          }
        }
      });
    } else {
      this.target.takeDamage(damage);
    }
    
    // Apply special effects
    if (this.def.slowFactor) {
      this.target.applyEffect(EFFECT_SLOW, this.def.slowDuration, {
        slowFactor: this.def.slowFactor
      });
    }
    
    if (this.def.effect) {
      this.target.applyEffect(this.def.effect, 3, {
        damagePerTick: this.damage * 0.2
      });
    }
  }

  distanceTo(entity) {
    const dx = (entity.x - this.x) * TILE_SIZE;
    const dy = (entity.y - this.y) * TILE_SIZE;
    return Math.sqrt(dx * dx + dy * dy);
  }

  applySupportBuffs(towers) {
    // Find nearby support towers
    towers.forEach(tower => {
      if (tower.type === TOWER_SUPPORT && tower !== this) {
        const dist = this.distanceTo(tower);
        if (dist <= tower.def.buffRadius * TILE_SIZE) {
          this.damage *= (1 + tower.def.buffDamage);
          this.attackSpeed *= (1 + tower.def.buffSpeed);
        }
      }
    });
  }

  upgrade(path) {
    const upgradeDef = this.def.upgrades[path];
    if (!upgradeDef) return false;
    
    // Apply upgrade stats
    if (upgradeDef.damage !== undefined) this.damage = upgradeDef.damage;
    if (upgradeDef.attackSpeed !== undefined) this.attackSpeed = upgradeDef.attackSpeed;
    if (upgradeDef.splashRadius !== undefined) this.def.splashRadius = upgradeDef.splashRadius;
    if (upgradeDef.slowFactor !== undefined) this.def.slowFactor = upgradeDef.slowFactor;
    if (upgradeDef.slowDuration !== undefined) this.def.slowDuration = upgradeDef.slowDuration;
    if (upgradeDef.effect !== undefined) this.def.effect = upgradeDef.effect;
    if (upgradeDef.buffDamage !== undefined) this.def.buffDamage = upgradeDef.buffDamage;
    if (upgradeDef.buffSpeed !== undefined) this.def.buffSpeed = upgradeDef.buffSpeed;
    
    this.level++;
    this.upgrades[path] = true;
    this.pulseEffect = true;
    
    return true;
  }

  sellValue() {
    let totalCost = this.def.cost;
    Object.values(this.upgrades).forEach(() => {
      totalCost += 50; // Approximate upgrade cost
    });
    return Math.floor(totalCost * 0.7);
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      type: this.type,
      targetingMode: this.targetingMode,
      level: this.level,
      upgrades: { ...this.upgrades }
    };
  }

  static deserialize(data) {
    const tower = new Tower(data.x, data.y, data.type);
    tower.targetingMode = data.targetingMode;
    tower.level = data.level;
    tower.upgrades = { ...data.upgrades };
    // Re-apply upgrades
    Object.keys(data.upgrades).forEach(path => {
      tower.upgrade(path);
    });
    return tower;
  }
}

class TowerSystem {
  constructor(mapSystem) {
    this.mapSystem = mapSystem;
    this.towers = [];
  }

  placeTower(x, y, type) {
    if (!this.mapSystem.canBuild(x, y)) return null;
    
    const tower = new Tower(x, y, type);
    this.towers.push(tower);
    this.mapSystem.placeTower(x, y);
    
    return tower;
  }

  removeTower(tower) {
    const index = this.towers.indexOf(tower);
    if (index > -1) {
      this.towers.splice(index, 1);
      this.mapSystem.removeTower(tower.x, tower.y);
      return true;
    }
    return false;
  }

  getTowerAt(x, y) {
    return this.towers.find(t => t.x === x && t.y === y);
  }

  update(deltaTime, enemies) {
    this.towers.forEach(tower => {
      tower.update(deltaTime, enemies, this.towers);
    });
  }

  getAllTowers() {
    return this.towers;
  }

  serialize() {
    return this.towers.map(t => t.serialize());
  }

  deserialize(data) {
    this.towers = data.map(d => Tower.deserialize(d));
    // Restore tiles
    this.towers.forEach(t => this.mapSystem.placeTower(t.x, t.y));
  }
}
