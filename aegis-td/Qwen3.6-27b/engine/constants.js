// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Constants & Configuration
// ============================================================

const GRID_SIZE = 20;
const TILE_SIZE = 32;
const CANVAS_WIDTH = GRID_SIZE * TILE_SIZE;
const CANVAS_HEIGHT = GRID_SIZE * TILE_SIZE;

// Tile types
const TILE_PATH = 0;
const TILE_BUILDABLE = 1;
const TILE_BLOCKED = 2;
const TILE_DYNAMIC = 3;
const TILE_TOWER = 4;
const TILE_CORE = 5;

// Tower types
const TOWER_BASIC = 'basic';
const TOWER_SPLASH = 'splash';
const TOWER_SLOW = 'slow';
const TOWER_SNIPER = 'sniper';
const TOWER_SUPPORT = 'support';

// Targeting modes
const TARGET_FIRST = 'first';
const TARGET_LAST = 'last';
const TARGET_STRONGEST = 'strongest';
const TARGET_WEAKEST = 'weakest';

// Enemy types
const ENEMY_BASIC = 'basic';
const ENEMY_TANK = 'tank';
const ENEMY_SWARM = 'swarm';
const ENEMY_FLYING = 'flying';
const ENEMY_SHIELDED = 'shielded';
const ENEMY_ADAPTIVE = 'adaptive';

// Status effects
const EFFECT_POISON = 'poison';
const EFFECT_SLOW = 'slow';
const EFFECT_BURN = 'burn';
const EFFECT_SHOCK = 'shock';
const EFFECT_SHIELD_BREAK = 'shield_break';

// Game states
const STATE_MENU = 'menu';
const STATE_PLAYING = 'playing';
const STATE_PAUSED = 'paused';
const STATE_GAME_OVER = 'game_over';

// Abilities
const ABILITY_AIRSTRIKE = 'airstrike';
const ABILITY_FREEZE = 'freeze';
const ABILITY_OVERCLOCK = 'overclock';

// Tower definitions
const TOWER_DEFS = {
  [TOWER_BASIC]: {
    name: 'Blaster',
    cost: 50,
    damage: 10,
    attackSpeed: 1.0,
    range: 4,
    description: 'Reliable single-target damage.',
    upgrades: {
      path1: { name: 'Rapid Fire', damage: 8, attackSpeed: 2.0, cost: 75 },
      path2: { name: 'Heavy Round', damage: 20, attackSpeed: 0.7, cost: 75 }
    }
  },
  [TOWER_SPLASH]: {
    name: 'Cannon',
    cost: 100,
    damage: 15,
    attackSpeed: 0.6,
    range: 3.5,
    splashRadius: 2,
    description: 'Deals area damage in a small radius.',
    upgrades: {
      path1: { name: 'Poison Barrage', damage: 12, attackSpeed: 0.6, splashRadius: 2.5, effect: EFFECT_POISON, cost: 125 },
      path2: { name: 'Chain Explosion', damage: 20, attackSpeed: 0.5, splashRadius: 3, cost: 125 }
    }
  },
  [TOWER_SLOW]: {
    name: 'Cryostat',
    cost: 75,
    damage: 5,
    attackSpeed: 1.2,
    range: 3.5,
    slowFactor: 0.5,
    slowDuration: 2,
    description: 'Slows enemies in range.',
    upgrades: {
      path1: { name: 'Deep Freeze', damage: 8, slowFactor: 0.3, slowDuration: 3, cost: 100 },
      path2: { name: 'Shatter', damage: 15, slowFactor: 0.6, slowDuration: 2, cost: 100 }
    }
  },
  [TOWER_SNIPER]: {
    name: 'Sniper',
    cost: 150,
    damage: 50,
    attackSpeed: 0.3,
    range: 8,
    description: 'Long-range, high-damage, slow fire rate.',
    upgrades: {
      path1: { name: 'Armor Piercer', damage: 80, attackSpeed: 0.3, armorPierce: true, cost: 200 },
      path2: { name: 'Homing Round', damage: 60, attackSpeed: 0.5, homing: true, cost: 200 }
    }
  },
  [TOWER_SUPPORT]: {
    name: 'Aura Node',
    cost: 120,
    damage: 0,
    attackSpeed: 0,
    range: 3,
    buffRadius: 3,
    buffDamage: 0.25,
    buffSpeed: 0.25,
    description: 'Boosts damage and speed of nearby towers.',
    upgrades: {
      path1: { name: 'Mighty Aura', buffDamage: 0.5, buffSpeed: 0.15, cost: 150 },
      path2: { name: 'Swift Aura', buffDamage: 0.15, buffSpeed: 0.5, cost: 150 }
    }
  }
};

// Enemy definitions
const ENEMY_DEFS = {
  [ENEMY_BASIC]: {
    name: 'Drone',
    health: 30,
    speed: 1.5,
    armor: 0,
    reward: 10,
    color: '#ff4444'
  },
  [ENEMY_TANK]: {
    name: 'Fortress',
    health: 150,
    speed: 0.6,
    armor: 5,
    reward: 30,
    color: '#8844ff'
  },
  [ENEMY_SWARM]: {
    name: 'Mite',
    health: 10,
    speed: 2.5,
    armor: 0,
    reward: 3,
    color: '#44ff44',
    spawnCount: 10
  },
  [ENEMY_FLYING]: {
    name: 'Sky Ray',
    health: 50,
    speed: 2.0,
    armor: 2,
    reward: 20,
    color: '#44ffff',
    flying: true
  },
  [ENEMY_SHIELDED]: {
    name: 'Ward Walker',
    health: 80,
    speed: 1.0,
    armor: 3,
    shield: 40,
    reward: 25,
    color: '#ffff44',
    shielded: true
  },
  [ENEMY_ADAPTIVE]: {
    name: 'Morph',
    health: 60,
    speed: 1.2,
    armor: 2,
    reward: 35,
    color: '#ff44ff',
    adaptive: true
  }
};

// Ability definitions
const ABILITY_DEFS = {
  [ABILITY_AIRSTRIKE]: {
    name: 'Airstrike',
    energyCost: 50,
    cooldown: 30,
    damage: 100,
    radius: 3,
    description: 'Deal heavy AoE damage in a target area.'
  },
  [ABILITY_FREEZE]: {
    name: 'Absolute Zero',
    energyCost: 40,
    cooldown: 45,
    slowFactor: 0.2,
    duration: 5,
    description: 'Freeze all enemies on screen.'
  },
  [ABILITY_OVERCLOCK]: {
    name: 'Overclock',
    energyCost: 30,
    cooldown: 60,
    speedBoost: 2.0,
    duration: 8,
    description: 'Double tower attack speed temporarily.'
  }
};

// Wave generation
const WAVE_PREVIEW_COUNT = 3;
const BOSS_WAVE_INTERVAL = 10;
const MUTATION_WAVE_INTERVAL = 5;

// AI Director thresholds
const AI_DIRECTOR_CHECK_INTERVAL = 10; // seconds
const AI_DIFFICULTY_EASY = 0.7;
const AI_DIFFICULTY_HARD = 1.3;

// Resource defaults
const STARTING_GOLD = 200;
const STARTING_ENERGY = 0;
const MAX_ENERGY = 100;
const PASSIVE_INCOME_INTERVAL = 5;
const PASSIVE_INCOME_AMOUNT = 5;

// Core health
const CORE_MAX_HEALTH = 100;

// Save system
const SAVE_KEY = 'aegis_td_save';
const SETTINGS_KEY = 'aegis_td_settings';
