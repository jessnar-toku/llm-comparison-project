// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Save/Load System
// ============================================================

class SaveSystem {
  constructor() {
    this.saveKey = SAVE_KEY;
    this.settingsKey = SETTINGS_KEY;
    this.autoSaveInterval = 30; // seconds
    this.autoSaveTimer = 0;
  }

  // Auto-save
  autoSave(game) {
    this.autoSaveTimer += 1 / 60; // Assuming 60 FPS
    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.autoSaveTimer = 0;
      this.save(game, true);
    }
  }

  // Save game state
  save(game, isAuto = false) {
    const saveData = {
      version: 1,
      timestamp: Date.now(),
      isAutoSave: isAuto,
      gameState: {
        currentWave: game.waveSystem.getCurrentWave(),
        coreHealth: game.coreHealth,
        coreMaxHealth: game.coreMaxHealth
      },
      resources: game.resourceSystem.serialize(),
      towers: game.towerSystem.serialize(),
      aiDirector: game.aiDirector.serialize(),
      settings: this.getSettings()
    };

    try {
      const json = JSON.stringify(saveData);
      localStorage.setItem(this.saveKey, json);
      return true;
    } catch (e) {
      console.error('Failed to save game:', e);
      return false;
    }
  }

  // Load game state
  load(game) {
    try {
      const json = localStorage.getItem(this.saveKey);
      if (!json) return false;

      const saveData = JSON.parse(json);
      
      // Validate save data
      if (!this.validateSaveData(saveData)) {
        console.error('Invalid save data');
        return false;
      }

      // Restore game state
      game.coreHealth = saveData.gameState.coreHealth;
      game.coreMaxHealth = saveData.gameState.coreMaxHealth;
      
      // Restore resources
      game.resourceSystem.deserialize(saveData.resources);
      
      // Restore towers
      game.towerSystem.deserialize(saveData.towers);
      
      // Restore AI Director
      if (saveData.aiDirector) {
        game.aiDirector.deserialize(saveData.aiDirector);
      }

      // Restore settings
      if (saveData.settings) {
        this.applySettings(saveData.settings);
      }

      return true;
    } catch (e) {
      console.error('Failed to load game:', e);
      return false;
    }
  }

  // Validate save data structure
  validateSaveData(data) {
    if (!data || data.version !== 1) return false;
    if (!data.gameState || !data.resources || !data.towers) return false;
    return true;
  }

  // Clear save data
  clearSave() {
    localStorage.removeItem(this.saveKey);
  }

  // Check if save exists
  hasSave() {
    return localStorage.getItem(this.saveKey) !== null;
  }

  // Get save info for display
  getSaveInfo() {
    try {
      const json = localStorage.getItem(this.saveKey);
      if (!json) return null;

      const saveData = JSON.parse(json);
      return {
        timestamp: saveData.timestamp,
        wave: saveData.gameState.currentWave,
        coreHealth: saveData.gameState.coreHealth,
        isAutoSave: saveData.isAutoSave
      };
    } catch (e) {
      return null;
    }
  }

  // Settings management
  getSettings() {
    try {
      const json = localStorage.getItem(this.settingsKey);
      if (!json) return this.getDefaultSettings();

      return { ...this.getDefaultSettings(), ...JSON.parse(json) };
    } catch (e) {
      return this.getDefaultSettings();
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  }

  applySettings(settings) {
    // Apply volume
    if (settings.volume !== undefined) {
      // This would connect to audio system
    }

    // Apply graphic quality
    if (settings.graphics !== undefined) {
      // This would affect renderer
    }

    // Apply controls
    if (settings.controls !== undefined) {
      // This would affect input handler
    }
  }

  getDefaultSettings() {
    return {
      volume: 0.7,
      musicVolume: 0.5,
      sfxVolume: 0.8,
      graphics: 'high', // low, medium, high
      showFPS: false,
      controls: {
        invertY: false,
        sensitivity: 1.0
      }
    };
  }

  // Export save data (for sharing/backup)
  exportSave() {
    const json = localStorage.getItem(this.saveKey);
    if (!json) return null;

    // Encode for sharing
    return btoa(json);
  }

  // Import save data
  importSave(encodedData) {
    try {
      const json = atob(encodedData);
      const saveData = JSON.parse(json);

      if (!this.validateSaveData(saveData)) {
        return false;
      }

      localStorage.setItem(this.saveKey, json);
      return true;
    } catch (e) {
      console.error('Failed to import save:', e);
      return false;
    }
  }
}
