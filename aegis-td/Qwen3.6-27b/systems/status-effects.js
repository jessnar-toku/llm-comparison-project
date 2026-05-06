// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Status Effects System
// ============================================================

class StatusEffect {
  constructor(type, duration, data = {}) {
    this.type = type;
    this.duration = duration;
    this.maxDuration = duration;
    this.data = data;
    this.tickTimer = 0;
    this.stackCount = 1;
    
    // Visual effects
    this.visualIntensity = 1;
    this.pulseTimer = 0;
  }

  update(deltaTime, target) {
    // Update duration (-1 means permanent until manually removed)
    if (this.duration > 0) {
      this.duration -= deltaTime;
    }
    
    // Update tick timer for DoT effects
    this.tickTimer += deltaTime;
    
    // Apply periodic effects
    if (this.tickTimer >= 1) {
      this.tickTimer = 0;
      this.applyTickEffect(target);
    }
    
    // Update visual intensity
    this.visualIntensity = Math.min(1, this.duration / (this.maxDuration * 0.5));
    this.pulseTimer += deltaTime * 5;
  }

  applyTickEffect(target) {
    switch (this.type) {
      case EFFECT_POISON:
        if (this.data.damagePerTick) {
          target.takeDamage(this.data.damagePerTick, true);
        }
        break;
        
      case EFFECT_BURN:
        if (this.data.damagePerTick) {
          // Burn does stacking damage
          const burnDamage = this.data.damagePerTick * this.stackCount;
          target.takeDamage(burnDamage, true);
        }
        break;
        
      case EFFECT_SHOCK:
        if (this.data.damagePerTick && this.data.chainCount) {
          target.takeDamage(this.data.damagePerTick, true);
          // Chain to nearby enemies
          this.chainShock(target, this.data.chainCount);
        }
        break;
    }
  }

  chainShock(source, chainCount) {
    // This would chain shock to nearby enemies
    // Implementation depends on having access to enemy list
  }

  isExpired() {
    return this.duration <= 0;
  }

  canStack(otherEffect) {
    // Poison and Burn can stack
    return this.type === otherEffect.type && 
           (this.type === EFFECT_POISON || this.type === EFFECT_BURN);
  }

  getVisualInfo() {
    const colors = {
      [EFFECT_POISON]: '#00ff00',
      [EFFECT_SLOW]: '#00ffff',
      [EFFECT_BURN]: '#ff4400',
      [EFFECT_SHOCK]: '#ffff00',
      [EFFECT_SHIELD_BREAK]: '#ff00ff'
    };
    
    return {
      color: colors[this.type] || '#ffffff',
      intensity: this.visualIntensity,
      pulse: Math.sin(this.pulseTimer) * 0.5 + 0.5
    };
  }
}

class StatusEffectSystem {
  constructor() {
    this.activeEffects = new Map(); // entity -> StatusEffect[]
    this.globalEffects = [];
  }

  applyEffect(entity, type, duration, data = {}) {
    let effects = this.activeEffects.get(entity);
    
    if (!effects) {
      effects = [];
      this.activeEffects.set(entity, effects);
    }
    
    // Check for existing effects that can stack
    const existingIndex = effects.findIndex(e => e.canStack(new StatusEffect(type, duration, data)));
    
    if (existingIndex >= 0) {
      // Stack the effect
      const existing = effects[existingIndex];
      existing.stackCount++;
      existing.duration = Math.max(existing.duration, duration);
      existing.maxDuration = Math.max(existing.maxDuration, duration);
    } else {
      // Add new effect
      const effect = new StatusEffect(type, duration, data);
      effects.push(effect);
    }
  }

  applyGlobalEffect(type, duration, data = {}) {
    const effect = new StatusEffect(type, duration, data);
    this.globalEffects.push(effect);
  }

  removeEffect(entity, type) {
    const effects = this.activeEffects.get(entity);
    if (!effects) return;
    
    for (let i = effects.length - 1; i >= 0; i--) {
      if (effects[i].type === type) {
        effects.splice(i, 1);
      }
    }
    
    if (effects.length === 0) {
      this.activeEffects.delete(entity);
    }
  }

  clearEffects(entity) {
    this.activeEffects.delete(entity);
  }

  hasEffect(entity, type) {
    const effects = this.activeEffects.get(entity);
    if (!effects) return false;
    
    return effects.some(e => e.type === type);
  }

  getEffects(entity) {
    return this.activeEffects.get(entity) || [];
  }

  update(deltaTime, enemies) {
    // Update entity effects
    for (const [entity, effects] of this.activeEffects.entries()) {
      for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        effect.update(deltaTime, entity);
        
        if (effect.isExpired()) {
          effects.splice(i, 1);
        }
      }
      
      if (effects.length === 0) {
        this.activeEffects.delete(entity);
      }
    }
    
    // Update global effects
    for (let i = this.globalEffects.length - 1; i >= 0; i--) {
      const effect = this.globalEffects[i];
      effect.update(deltaTime, null);
      
      // Apply global effects to all enemies
      if (effect.type === EFFECT_SLOW) {
        enemies.forEach(enemy => {
          if (!this.hasEffect(enemy, EFFECT_SLOW)) {
            this.applyEffect(enemy, EFFECT_SLOW, effect.duration, effect.data);
          }
        });
      }
      
      if (effect.isExpired()) {
        this.globalEffects.splice(i, 1);
      }
    }
  }

  // Check for effect interactions
  checkInteractions(entity) {
    const effects = this.getEffects(entity);
    
    // Freeze + Shock = Superconduct (extra damage)
    const hasFreeze = effects.some(e => e.type === EFFECT_SLOW && e.data.slowFactor < 0.3);
    const hasShock = effects.some(e => e.type === EFFECT_SHOCK);
    
    if (hasFreeze && hasShock) {
      // Apply bonus damage
      entity.takeDamage(10, true);
      this.removeEffect(entity, EFFECT_SHOCK);
    }
    
    // Shield Break + any damage = armor reduction
    const hasShieldBreak = effects.some(e => e.type === EFFECT_SHIELD_BREAK);
    if (hasShieldBreak && entity.armor > 0) {
      entity.armor = Math.max(0, entity.armor - 2);
    }
  }

  getEffectVisuals(entity) {
    const effects = this.getEffects(entity);
    return effects.map(e => e.getVisualInfo());
  }
}
