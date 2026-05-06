// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Wave System
// ============================================================

class WaveSystem {
  constructor(enemySystem, resourceSystem, aiDirector) {
    this.enemySystem = enemySystem;
    this.resourceSystem = resourceSystem;
    this.aiDirector = aiDirector;
    
    this.currentWave = 0;
    this.waveActive = false;
    this.enemiesRemaining = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    
    this.wavePreview = [];
    this.waveDelay = 5; // seconds between waves
    this.waveDelayTimer = 0;
    
    this.mutationActive = false;
    this.mutationEffects = [];
  }

  startWave() {
    if (this.waveActive) return;
    
    this.currentWave++;
    this.waveActive = true;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    
    // Generate wave composition
    this.generateWave();
    
    // Check for special waves
    this.checkSpecialWave();
    
    // Generate preview for next waves
    this.generatePreview();
  }

  generateWave() {
    const difficulty = this.getDifficulty();
    const enemyTypes = this.getAvailableEnemyTypes();
    
    // Base enemy count scales with wave number
    let enemyCount = Math.floor(5 + this.currentWave * 1.5);
    
    // AI Director can modify composition
    if (this.aiDirector) {
      const adjustment = this.aiDirector.getWaveAdjustment();
      enemyCount = Math.floor(enemyCount * adjustment.count);
    }
    
    // Generate spawn queue
    for (let i = 0; i < enemyCount; i++) {
      const type = this.selectEnemyType(enemyTypes, difficulty);
      const delay = this.getSpawnDelay(type);
      
      this.spawnQueue.push({
        type: type,
        delay: delay,
        count: ENEMY_DEFS[type].spawnCount || 1
      });
    }
    
    this.enemiesRemaining = this.spawnQueue.reduce((sum, s) => sum + s.count, 0);
  }

  getDifficulty() {
    // Hybrid linear + exponential scaling
    return 1 + (this.currentWave * 0.1) + Math.pow(this.currentWave / 10, 1.5) * 0.2;
  }

  getAvailableEnemyTypes() {
    const types = [ENEMY_BASIC];
    
    // Unlock enemy types based on wave number
    if (this.currentWave >= 3) types.push(ENEMY_SWARM);
    if (this.currentWave >= 5) types.push(ENEMY_TANK);
    if (this.currentWave >= 8) types.push(ENEMY_FLYING);
    if (this.currentWave >= 12) types.push(ENEMY_SHIELDED);
    if (this.currentWave >= 15) types.push(ENEMY_ADAPTIVE);
    
    return types;
  }

  selectEnemyType(types, difficulty) {
    // Weighted random selection based on difficulty
    const weights = types.map(type => {
      let weight = 1;
      
      // Higher difficulty = more tanky enemies
      if (type === ENEMY_TANK) weight *= difficulty;
      if (type === ENEMY_SHIELDED) weight *= difficulty * 0.5;
      if (type === ENEMY_ADAPTIVE) weight *= difficulty * 0.3;
      if (type === ENEMY_SWARM) weight *= 0.8; // Swarms are always common
      if (type === ENEMY_FLYING) weight *= difficulty * 0.6;
      
      return weight;
    });
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) return types[i];
    }
    
    return types[0];
  }

  getSpawnDelay(type) {
    const baseDelay = 1.5;
    
    switch (type) {
      case ENEMY_SWARM: return baseDelay * 0.3; // Fast spawns for swarm
      case ENEMY_TANK: return baseDelay * 2;   // Slow spawns for tanks
      case ENEMY_ADAPTIVE: return baseDelay * 1.5;
      default: return baseDelay;
    }
  }

  checkSpecialWave() {
    // Boss wave every BOSS_WAVE_INTERVAL waves
    if (this.currentWave % BOSS_WAVE_INTERVAL === 0) {
      this.addBossEnemy();
    }
    
    // Mutation wave every MUTATION_WAVE_INTERVAL waves
    if (this.currentWave % MUTATION_WAVE_INTERVAL === 0) {
      this.activateMutation();
    }
  }

  addBossEnemy() {
    // Boss is a super tank with adaptive properties
    this.spawnQueue.push({
      type: ENEMY_TANK,
      delay: 5,
      count: 1,
      isBoss: true,
      healthMultiplier: 5,
      speedMultiplier: 0.5
    });
    this.enemiesRemaining++;
  }

  activateMutation() {
    this.mutationActive = true;
    
    const mutations = [
      { name: 'Speed Boost', effect: 'speed', value: 1.5 },
      { name: 'Iron Skin', effect: 'armor', value: 5 },
      { name: 'Regeneration', effect: 'regen', value: 10 },
      { name: 'Swarm Attraction', effect: 'swarm', value: 2 }
    ];
    
    // Pick 1-2 random mutations
    const mutationCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < mutationCount; i++) {
      const mutation = mutations[Math.floor(Math.random() * mutations.length)];
      this.mutationEffects.push(mutation);
    }
  }

  generatePreview() {
    this.wavePreview = [];
    
    for (let i = 1; i <= WAVE_PREVIEW_COUNT; i++) {
      const waveNum = this.currentWave + i;
      const difficulty = 1 + (waveNum * 0.1) + Math.pow(waveNum / 10, 1.5) * 0.2;
      
      const preview = {
        wave: waveNum,
        difficulty: difficulty,
        enemyCount: Math.floor(5 + waveNum * 1.5),
        isBoss: waveNum % BOSS_WAVE_INTERVAL === 0,
        isMutation: waveNum % MUTATION_WAVE_INTERVAL === 0
      };
      
      this.wavePreview.push(preview);
    }
  }

  update(deltaTime) {
    if (!this.waveActive) {
      // Wave delay countdown
      this.waveDelayTimer -= deltaTime;
      if (this.waveDelayTimer <= 0) {
        this.startWave();
      }
      return;
    }
    
    // Process spawn queue
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= deltaTime;
      
      while (this.spawnTimer <= 0 && this.spawnQueue.length > 0) {
        const spawn = this.spawnQueue.shift();
        this.processSpawn(spawn);
        
        if (this.spawnQueue.length > 0) {
          this.spawnTimer = this.spawnQueue[0].delay;
        }
      }
    }
    
    // Check if wave is complete
    if (this.spawnQueue.length === 0 && this.enemiesRemaining <= 0) {
      this.completeWave();
    }
  }

  processSpawn(spawn) {
    for (let i = 0; i < spawn.count; i++) {
      const enemy = this.enemySystem.spawnEnemy(spawn.type);
      
      if (enemy) {
        // Apply boss modifiers
        if (spawn.isBoss) {
          enemy.maxHealth *= spawn.healthMultiplier || 3;
          enemy.health = enemy.maxHealth;
          enemy.speed *= spawn.speedMultiplier || 0.7;
          enemy.scale = 1.5;
        }
        
        // Apply mutation effects
        if (this.mutationActive) {
          this.applyMutations(enemy);
        }
      }
    }
  }

  applyMutations(enemy) {
    this.mutationEffects.forEach(mutation => {
      switch (mutation.effect) {
        case 'speed':
          enemy.speed *= mutation.value;
          break;
        case 'armor':
          enemy.armor += mutation.value;
          break;
        case 'regen':
          enemy.applyEffect(EFFECT_BURN, -1, { 
            damagePerTick: -mutation.value, // Negative = healing
            isRegen: true
          });
          break;
      }
    });
  }

  onEnemyKilled() {
    this.enemiesRemaining--;
  }

  completeWave() {
    this.waveActive = false;
    this.waveDelayTimer = this.waveDelay;
    this.mutationActive = false;
    this.mutationEffects = [];
    
    // Wave completion bonus
    const bonus = 10 + this.currentWave * 2;
    this.resourceSystem.addGold(bonus);
  }

  isWaveActive() {
    return this.waveActive;
  }

  getCurrentWave() {
    return this.currentWave;
  }

  getPreview() {
    return this.wavePreview;
  }

  getTimeUntilNextWave() {
    return Math.max(0, this.waveDelayTimer);
  }
}
