// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Ability System
// ============================================================

class Ability {
  constructor(type) {
    this.type = type;
    this.def = ABILITY_DEFS[type];
    this.cooldownTimer = 0;
    this.onCooldown = false;
    this.active = false;
  }

  canUse(resourceSystem) {
    return !this.onCooldown && resourceSystem.canAffordEnergy(this.def.energyCost);
  }

  use(resourceSystem, game) {
    if (!this.canUse(resourceSystem)) return false;
    
    resourceSystem.spendEnergy(this.def.energyCost);
    this.onCooldown = true;
    this.cooldownTimer = this.def.cooldown;
    this.active = true;
    
    // Execute ability effect
    this.executeEffect(game);
    
    return true;
  }

  executeEffect(game) {
    const enemies = game.enemySystem.getAliveEnemies();
    
    switch (this.type) {
      case ABILITY_AIRSTRIKE:
        this.doAirstrike(game);
        break;
      case ABILITY_FREEZE:
        this.doFreeze(enemies);
        break;
      case ABILITY_OVERCLOCK:
        this.doOverclock(game);
        break;
    }
  }

  doAirstrike(game) {
    // Airstrike at mouse position
    const mousePos = game.input.getGridPos();
    const radius = this.def.radius * TILE_SIZE;
    
    const enemies = game.enemySystem.getAliveEnemies();
    enemies.forEach(enemy => {
      const dx = (enemy.x - mousePos.x) * TILE_SIZE;
      const dy = (enemy.y - mousePos.y) * TILE_SIZE;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= radius) {
        enemy.takeDamage(this.def.damage, true); // Ignore armor
      }
    });
    
    // Visual effect
    game.renderer.addAirstrikeEffect(mousePos.x, mousePos.y, this.def.radius);
  }

  doFreeze(enemies) {
    enemies.forEach(enemy => {
      enemy.applyEffect(EFFECT_SLOW, this.def.duration, {
        slowFactor: this.def.slowFactor
      });
    });
  }

  doOverclock(game) {
    const towers = game.towerSystem.getAllTowers();
    towers.forEach(tower => {
      tower.attackSpeed *= this.def.speedBoost;
      
      // Revert after duration
      setTimeout(() => {
        tower.attackSpeed /= this.def.speedBoost;
      }, this.def.duration * 1000);
    });
  }

  update(deltaTime) {
    if (this.onCooldown) {
      this.cooldownTimer -= deltaTime;
      if (this.cooldownTimer <= 0) {
        this.onCooldown = false;
        this.active = false;
      }
    }
  }

  getCooldownProgress() {
    if (!this.onCooldown) return 0;
    return 1 - (this.cooldownTimer / this.def.cooldown);
  }

  getRemainingCooldown() {
    return Math.max(0, this.cooldownTimer);
  }
}

class AbilitySystem {
  constructor() {
    this.abilities = [];
    this.selectedAbility = null;
    this.initializeAbilities();
  }

  initializeAbilities() {
    this.abilities = [
      new Ability(ABILITY_AIRSTRIKE),
      new Ability(ABILITY_FREEZE),
      new Ability(ABILITY_OVERCLOCK)
    ];
  }

  selectAbility(type) {
    const ability = this.abilities.find(a => a.type === type);
    if (ability) {
      this.selectedAbility = ability;
      return true;
    }
    return false;
  }

  useSelectedAbility(resourceSystem, game) {
    if (!this.selectedAbility) return false;
    return this.selectedAbility.use(resourceSystem, game);
  }

  useAbility(type, resourceSystem, game) {
    const ability = this.abilities.find(a => a.type === type);
    if (ability) {
      return ability.use(resourceSystem, game);
    }
    return false;
  }

  update(deltaTime) {
    this.abilities.forEach(ability => {
      ability.update(deltaTime);
    });
  }

  getAbilities() {
    return this.abilities;
  }

  getSelectedAbility() {
    return this.selectedAbility;
  }

  canUseAbility(type) {
    const ability = this.abilities.find(a => a.type === type);
    return ability ? !ability.onCooldown : false;
  }
}
