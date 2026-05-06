// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Resource System
// ============================================================

class ResourceSystem {
  constructor() {
    this.gold = STARTING_GOLD;
    this.energy = STARTING_ENERGY;
    this.maxEnergy = MAX_ENERGY;
    
    this.passiveIncomeTimer = 0;
    this.incomeInterval = PASSIVE_INCOME_INTERVAL;
    
    // Economy tracking
    this.totalGoldEarned = 0;
    this.totalGoldSpent = 0;
    
    // Listeners for UI updates
    this.listeners = [];
  }

  update(deltaTime) {
    // Passive income
    this.passiveIncomeTimer += deltaTime;
    if (this.passiveIncomeTimer >= this.incomeInterval) {
      this.passiveIncomeTimer = 0;
      this.addGold(PASSIVE_INCOME_AMOUNT, 'passive');
    }
    
    // Passive energy regen
    this.addEnergy(2 * deltaTime, 'passive');
  }

  addGold(amount, source = 'unknown') {
    this.gold += amount;
    this.totalGoldEarned += amount;
    this.notify('gold_change', { amount, source });
  }

  spendGold(amount) {
    if (this.gold >= amount) {
      this.gold -= amount;
      this.totalGoldSpent += amount;
      this.notify('gold_change', { amount: -amount });
      return true;
    }
    return false;
  }

  addEnergy(amount, source = 'unknown') {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
    this.notify('energy_change', { amount, source });
  }

  spendEnergy(amount) {
    if (this.energy >= amount) {
      this.energy -= amount;
      this.notify('energy_change', { amount: -amount });
      return true;
    }
    return false;
  }

  canAffordGold(amount) {
    return this.gold >= amount;
  }

  canAffordEnergy(amount) {
    return this.energy >= amount;
  }

  getGold() {
    return this.gold;
  }

  getEnergy() {
    return this.energy;
  }

  getMaxEnergy() {
    return this.maxEnergy;
  }

  onResourceChange(listener) {
    this.listeners.push(listener);
  }

  notify(event, data) {
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(event, data);
      } else if (listener[event]) {
        listener[event](data);
      }
    });
  }

  // Economy balancing - increasing tower costs
  getTowerCostMultiplier() {
    // Slight cost increase based on waves completed
    return 1 + (this.getTotalWaves() * 0.02);
  }

  getTotalWaves() {
    // This will be set by the game
    return 0;
  }

  serialize() {
    return {
      gold: this.gold,
      energy: this.energy,
      totalGoldEarned: this.totalGoldEarned,
      totalGoldSpent: this.totalGoldSpent
    };
  }

  deserialize(data) {
    this.gold = data.gold;
    this.energy = data.energy;
    this.totalGoldEarned = data.totalGoldEarned;
    this.totalGoldSpent = data.totalGoldSpent;
  }
}
