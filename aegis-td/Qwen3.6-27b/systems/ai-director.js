// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — AI Director System
// ============================================================

class AIDirector {
  constructor(waveSystem, enemySystem, resourceSystem) {
    this.waveSystem = waveSystem;
    this.enemySystem = enemySystem;
    this.resourceSystem = resourceSystem;
    
    // Monitoring metrics
    this.damageOutput = 0;
    this.leakRate = 0;
    this.resourceUsage = 0;
    this.enemyKillCount = 0;
    this.enemyLeakCount = 0;
    
    // Adjustment parameters
    this.difficultyMultiplier = 1.0;
    this.spawnRateMultiplier = 1.0;
    this.enemyHealthMultiplier = 1.0;
    this.enemySpeedMultiplier = 1.0;
    
    // Check interval
    this.checkTimer = 0;
    this.checkInterval = AI_DIRECTOR_CHECK_INTERVAL;
    
    // Flow state tracking
    this.playerStruggleTimer = 0;
    this.playerDominatedTimer = 0;
    
    // History for trend analysis
    this.performanceHistory = [];
    this.maxHistoryLength = 10;
  }

  update(deltaTime) {
    this.checkTimer += deltaTime;
    
    if (this.checkTimer >= this.checkInterval) {
      this.checkTimer = 0;
      this.evaluatePerformance();
      this.adjustDifficulty();
    }
    
    // Track struggle/domination timers
    if (this.leakRate > 0.3) {
      this.playerStruggleTimer += deltaTime;
      this.playerDominatedTimer = Math.max(0, this.playerDominatedTimer - deltaTime);
    } else if (this.leakRate < 0.05 && this.enemyKillCount > 10) {
      this.playerDominatedTimer += deltaTime;
      this.playerStruggleTimer = Math.max(0, this.playerStruggleTimer - deltaTime);
    }
  }

  evaluatePerformance() {
    const metrics = {
      timestamp: Date.now(),
      leakRate: this.leakRate,
      killCount: this.enemyKillCount,
      gold: this.resourceSystem.getGold(),
      energy: this.resourceSystem.getEnergy(),
      difficultyMultiplier: this.difficultyMultiplier
    };
    
    // Store in history
    this.performanceHistory.push(metrics);
    if (this.performanceHistory.length > this.maxHistoryLength) {
      this.performanceHistory.shift();
    }
    
    // Reset counters
    this.enemyKillCount = 0;
    this.enemyLeakCount = 0;
  }

  adjustDifficulty() {
    if (this.performanceHistory.length < 2) return;
    
    const recent = this.performanceHistory[this.performanceHistory.length - 1];
    const previous = this.performanceHistory[this.performanceHistory.length - 2];
    
    // Analyze trend
    const leakTrend = recent.leakRate - previous.leakRate;
    const killTrend = recent.killCount - previous.killCount;
    
    // Adjust based on player performance
    if (this.playerStruggleTimer > 15) {
      // Player is struggling - reduce difficulty
      this.difficultyMultiplier = Math.max(AI_DIFFICULTY_EASY, this.difficultyMultiplier * 0.9);
      this.enemyHealthMultiplier = Math.max(0.7, this.enemyHealthMultiplier * 0.95);
      this.enemySpeedMultiplier = Math.max(0.7, this.enemySpeedMultiplier * 0.95);
    } else if (this.playerDominatedTimer > 20) {
      // Player is dominating - increase difficulty
      this.difficultyMultiplier = Math.min(AI_DIFFICULTY_HARD, this.difficultyMultiplier * 1.05);
      this.enemyHealthMultiplier = Math.min(1.5, this.enemyHealthMultiplier * 1.02);
      this.enemySpeedMultiplier = Math.min(1.3, this.enemySpeedMultiplier * 1.02);
    }
    
    // Adjust spawn rate based on leak trend
    if (leakTrend > 0.1) {
      this.spawnRateMultiplier = Math.max(0.5, this.spawnRateMultiplier * 0.9);
    } else if (leakTrend < -0.05) {
      this.spawnRateMultiplier = Math.min(1.5, this.spawnRateMultiplier * 1.05);
    }
    
    // Smooth adjustments
    this.difficultyMultiplier = this.clamp(this.difficultyMultiplier, 0.5, 2.0);
    this.spawnRateMultiplier = this.clamp(this.spawnRateMultiplier, 0.3, 2.0);
    this.enemyHealthMultiplier = this.clamp(this.enemyHealthMultiplier, 0.5, 3.0);
    this.enemySpeedMultiplier = this.clamp(this.enemySpeedMultiplier, 0.5, 2.0);
  }

  getWaveAdjustment() {
    return {
      count: this.spawnRateMultiplier,
      health: this.enemyHealthMultiplier,
      speed: this.enemySpeedMultiplier,
      difficulty: this.difficultyMultiplier
    };
  }

  getEnemySpawnDelayMultiplier() {
    return 1 / this.spawnRateMultiplier;
  }

  getEnemyStatsMultiplier() {
    return {
      health: this.enemyHealthMultiplier,
      speed: this.enemySpeedMultiplier,
      armor: this.difficultyMultiplier
    };
  }

  onEnemyKilled() {
    this.enemyKillCount++;
  }

  onEnemyLeaked() {
    this.enemyLeakCount++;
    const totalEnemies = this.enemyKillCount + this.enemyLeakCount;
    this.leakRate = totalEnemies > 0 ? this.enemyLeakCount / totalEnemies : 0;
  }

  onDamageDealt(amount) {
    this.damageOutput += amount;
  }

  onResourceSpent(amount) {
    this.resourceUsage += amount;
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  serialize() {
    return {
      difficultyMultiplier: this.difficultyMultiplier,
      spawnRateMultiplier: this.spawnRateMultiplier,
      enemyHealthMultiplier: this.enemyHealthMultiplier,
      enemySpeedMultiplier: this.enemySpeedMultiplier,
      performanceHistory: this.performanceHistory
    };
  }

  deserialize(data) {
    this.difficultyMultiplier = data.difficultyMultiplier;
    this.spawnRateMultiplier = data.spawnRateMultiplier;
    this.enemyHealthMultiplier = data.enemyHealthMultiplier;
    this.enemySpeedMultiplier = data.enemySpeedMultiplier;
    this.performanceHistory = data.performanceHistory || [];
  }
}
