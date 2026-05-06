// ============================================
// SAVE/LOAD SYSTEM - LocalStorage Persistence
// ============================================

const SaveSystem = {
    STORAGE_KEY: 'aegis-grid-save-data',
    
    saveGame(game) {
        const saveData = {
            version: '1.0',
            timestamp: Date.now(),
            gameState: game.gameState,
            mapSeed: game.seed,
            gold: game.gold,
            energy: game.energy,
            coreHealth: game.coreHealth,
            waveNumber: game.waveSystem.waveNumber,
            towers: game.towers.map(t => ({
                type: t.type,
                x: t.x,
                y: t.y,
                level: t.level,
                upgradePath: t.upgradePath,
                damage: t.damage,
                attackSpeed: t.attackSpeed,
                range: t.range
            })),
            abilities: game.abilities,
            overclockActive: game.overclockActive,
            freezeActive: game.freezeActive
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
        return saveData;
    },
    
    loadGame() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (!saved) return null;
        
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load save data:', e);
            return null;
        }
    },
    
    deleteSave() {
        localStorage.removeItem(this.STORAGE_KEY);
    },
    
    hasSave() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    },
    
    getSaveTimestamp(saveData) {
        if (!saveData) return null;
        const date = new Date(saveData.timestamp);
        return date.toLocaleString();
    },
    
    getSaveDifficulty(saveData) {
        if (!saveData) return null;
        return `Wave ${saveData.waveNumber}`;
    }
};
