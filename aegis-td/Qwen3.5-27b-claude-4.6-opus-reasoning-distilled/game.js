// ============================================
// AEGIS GRID: ADAPTIVE DEFENSE
// Advanced HTML5 Tower Defense Game
// ============================================

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION & CONSTANTS
    // ============================================

    const CONFIG = {
        gridSize: 20,
        tileSize: 30,
        canvasWidth: 600,
        canvasHeight: 600,
        maxWaves: 50,
        baseGold: 150,
        passiveIncome: 10,
        passiveIncomeInterval: 5000,
        maxEnergy: 100,
        energyRegenRate: 1
    };

    // Tile Types
    const TILE = {
        EMPTY: 0,      // Buildable
        PATH: 1,       // Enemy path
        BLOCKED: 2,    // Walls/obstacles
        START: 3,      // Entry point
        CORE: 4        // Energy core (exit)
    };

    // Tower Types Configuration
    const TOWER_TYPES = {
        basic: {
            name: 'Basic',
            icon: '⚔️',
            cost: 50,
            damage: 15,
            attackSpeed: 60,      // Frames between attacks
            range: 3.5,           // Grid units
            targeting: 'first',
            color: '#3498db'
        },
        splash: {
            name: 'Splash',
            icon: '💥',
            cost: 120,
            damage: 12,
            attackSpeed: 70,
            range: 2.5,
            splashRadius: 1.5,
            targeting: 'first',
            color: '#e74c3c'
        },
        slow: {
            name: 'Slow',
            icon: '❄️',
            cost: 80,
            damage: 5,
            attackSpeed: 40,
            range: 2.5,
            effect: { type: 'slow', duration: 120, strength: 0.5 },
            targeting: 'first',
            color: '#00d9ff'
        },
        sniper: {
            name: 'Sniper',
            icon: '🎯',
            cost: 200,
            damage: 100,
            attackSpeed: 150,
            range: 8,
            piercing: true,
            targeting: 'strongest',
            color: '#9b59b6'
        },
        support: {
            name: 'Support',
            icon: '✨',
            cost: 150,
            damage: 0,
            attackSpeed: 0,
            range: 3,
            buffRange: 2.5,
            buffs: { damage: 1.2, speed: 1.1 }, // 20% damage, 10% speed
            targeting: 'none',
            color: '#f1c40f'
        }
    };

    // Enemy Types Configuration
    const ENEMY_TYPES = {
        basic: {
            name: 'Drone',
            icon: '🔵',
            health: 30,
            speed: 0.8,
            reward: 5,
            armor: 'light'
        },
        tank: {
            name: 'Tank',
            icon: '⚫',
            health: 100,
            speed: 0.4,
            reward: 15,
            armor: 'heavy'
        },
        swarm: {
            name: 'Scout',
            icon: '🔴',
            health: 12,
            speed: 1.2,
            reward: 3,
            armor: 'light'
        },
        flying: {
            name: 'Flyer',
            icon: '✈️',
            health: 40,
            speed: 1.0,
            reward: 10,
            armor: 'flying',
            ignoresPath: true
        },
        shielded: {
            name: 'Shielded',
            icon: '🛡️',
            health: 60,
            shield: 30,
            speed: 0.6,
            reward: 12,
            armor: 'heavy'
        },
        boss: {
            name: 'Boss',
            icon: '👹',
            health: 500,
            speed: 0.3,
            reward: 100,
            armor: 'boss'
        }
    };

    // Status Effects
    const EFFECTS = {
        slow: { color: '#00d9ff', damageType: null },
        poison: { color: '#2ecc71', damageType: 1 },
        burn: { color: '#e74c3c', damageType: 0.5 },
        shock: { color: '#f1c40f', damageType: 2 }
    };

    // Map Design (configurable)
    const MAP_DESIGN = [
        'SS....................',
        '.PPPPPP.................',
        '.P...PPPPPPPP..........',
        '.P......PP..............',
        '.PPPPP.....PP...........',
        '.P...........PP........'',
        '.PP.......PP............',
        '.P..PP....PP..........C.',
        '....PP..................',
        '..PP...PPPPPPPP.........',
        '..P..............PP.....',
        '..PP..PPPP......PP.......',
        '.............PP........'',
        '.......PPPPP...........P',
        '..........P............P',
        '...PPPPPPPP.....PP.....P',
        '...P..........PP...PP..P',
        '...P...PPPPPP...PP.....P',
        '....PP.......PP........P',
        '......PPPPP......CCCCC.'
    ];

    // ============================================
    // A* PATHFINDING ENGINE
    // ============================================

    class Pathfinding {
        constructor(grid) {
            this.grid = grid;
            this.cachedPaths = new Map();
        }

        findPath(startX, startY, endX, endY, ignoreTowers = false) {
            const key = `${startX},${startY}->${endX},${endY}`;
            if (this.cachedPaths.has(key) && ignoreTowers) {
                return this.cachedPaths.get(key);
            }

            const openSet = [];
            const closedSet = new Set();
            const cameFrom = new Map();
            
            const startKey = `${startX},${startY}`;
            const endKey = `${endX},${endY}`;
            
            const gScore = new Map();
            const fScore = new Map();
            
            gScore.set(startKey, 0);
            fScore.set(startKey, this.heuristic(startX, startY, endX, endY));
            
            openSet.push({ x: startX, y: startY, f: 0 });

            while (openSet.length > 0) {
                // Get node with lowest f-score
                openSet.sort((a, b) => a.f - b.f);
                const current = openSet.shift();
                const currentKey = `${current.x},${current.y}`;

                // Reached goal
                if (current.x === endX && current.y === endY) {
                    return this.reconstructPath(cameFrom, currentKey);
                }

                closedSet.add(currentKey);

                // Check neighbors
                const neighbors = [
                    { x: current.x + 1, y: current.y },
                    { x: current.x - 1, y: current.y },
                    { x: current.x, y: current.y + 1 },
                    { x: current.x, y: current.y - 1 }
                ];

                for (const neighbor of neighbors) {
                    if (!this.isValidTile(neighbor.x, neighbor.y, ignoreTowers)) continue;
                    
                    const neighborKey = `${neighbor.x},${neighbor.y}`;
                    if (closedSet.has(neighborKey)) continue;

                    const tentativeG = (gScore.get(currentKey) || Infinity) + 1;
                    
                    if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
                        cameFrom.set(neighborKey, currentKey);
                        gScore.set(neighborKey, tentativeG);
                        fScore.set(neighborKey, tentativeG + this.heuristic(neighbor.x, neighbor.y, endX, endY));
                        
                        if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                            openSet.push({
                                x: neighbor.x,
                                y: neighbor.y,
                                f: fScore.get(neighborKey)
                            });
                        }
                    }
                }
            }

            return null; // No path found
        }

        heuristic(a, b, c, d) {
            return Math.abs(a - c) + Math.abs(b - d); // Manhattan distance
        }

        isValidTile(x, y, ignoreTowers) {
            if (x < 0 || x >= CONFIG.gridSize || y < 0 || y >= CONFIG.gridSize) {
                return false;
            }
            
            const tile = this.grid[y][x];
            if (tile.type === TILE.PATH || tile.type === TILE.START || tile.type === TILE.CORE) {
                return true;
            }
            
            if (ignoreTowers && tile.tower && tile.type !== TILE.BLOCKED) {
                return false;
            }
            
            return false;
        }

        reconstructPath(cameFrom, currentKey) {
            const path = [{ x: parseInt(currentKey.split(',')[0]), y: parseInt(currentKey.split(',')[1]) }];
            let key = currentKey;
            
            while (cameFrom.has(key)) {
                const [x, y] = cameFrom.get(key).split(',').map(Number);
                path.unshift({ x, y });
                key = cameFrom.get(key);
            }
            
            return path;
        }

        clearCache() {
            this.cachedPaths.clear();
        }
    }

    // ============================================
    // OBJECT POOLING SYSTEM (Performance)
    // ============================================

    class ObjectPool {
        constructor(createFn, expandBy = 50) {
            this.createFn = createFn;
            this.expandBy = expandBy;
            this.pool = [];
        }

        acquire() {
            if (this.pool.length > 0) {
                const obj = this.pool.shift();
                obj.reset();
                return obj;
            }
            this.pool.push(...Array(this.expandBy).fill(null).map(() => this.createFn()));
            return this.pool.shift();
        }

        release(obj) {
            obj.reset();
            this.pool.push(obj);
        }
    }

    // ============================================
    // ENTITY CLASSES
    // ============================================

    class Enemy {
        constructor(type, waveMultiplier) {
            const config = ENEMY_TYPES[type];
            this.type = type;
            this.icon = config.icon;
            
            // Stats scaled by wave
            this.maxHealth = Math.floor(config.health * (1 + waveMultiplier * 0.3));
            this.health = this.maxHealth;
            this.shield = config.shield ? Math.floor(config.shield * (1 + waveMultiplier * 0.3)) : 0;
            this.speed = config.speed;
            this.reward = config.reward;
            this.armor = config.armor;
            
            // Position & movement
            this.x = 0;
            this.y = 0;
            this.path = [];
            this.pathIndex = 0;
            this.progress = 0; // Progress along current segment (0-1)
            
            // Status effects
            this.effects = [];
            this.slowMultiplier = 1.0;
            
            // Animation
            this.scale = 1;
            this.blinkTimer = 0;
        }

        reset() {
            this.health = this.maxHealth;
            this.shield = 0;
            this.effects = [];
            this.slowMultiplier = 1.0;
            this.pathIndex = 0;
            this.progress = 0;
        }

        addEffect(type, duration) {
            // Remove existing effect of same type
            this.effects = this.effects.filter(e => e.type !== type);
            
            this.effects.push({
                type,
                remaining: duration,
                maxDuration: duration
            });
            
            if (type === 'slow') {
                this.slowMultiplier *= 0.5;
            }
        }

        updateEffects(deltaTime) {
            for (let i = this.effects.length - 1; i >= 0; i--) {
                const effect = this.effects[i];
                effect.remaining -= deltaTime;
                
                // Apply damage effects
                if (EFFECTS[effect.type].damageType !== null) {
                    const dmg = EFFECTS[effect.type].damageType;
                    if (dmg > 0 && Math.random() < 0.02) {
                        this.takeDamage(dmg, 'effect');
                    }
                }

                // Remove expired effects
                if (effect.remaining <= 0) {
                    if (effect.type === 'slow') {
                        this.slowMultiplier = Math.min(this.slowMultiplier * 2, 1.0);
                    }
                    this.effects.splice(i, 1);
                }
            }
        }

        takeDamage(amount, source = 'tower', isSplash = false) {
            // Armor resistance
            let multiplier = 1.0;
            if (this.armor === 'heavy' && source === 'tower') multiplier = 0.85;
            if (this.armor === 'boss') multiplier = 0.7;
            
            amount *= multiplier;
            
            // Shield absorbs damage
            if (this.shield > 0) {
                const shieldDamage = Math.min(this.shield, amount);
                this.shield -= shieldDamage;
                amount -= shieldDamage;
            }
            
            this.health -= amount;
            
            // Visual feedback
            if (!isSplash) {
                this.blinkTimer = 5;
                this.scale = Math.min(this.scale + 0.1, 1.3);
            }
        }

        isDead() {
            return this.health <= 0;
        }
    }

    class Tower {
        constructor(type, x, y) {
            const config = TOWER_TYPES[type];
            
            this.type = type;
            this.upgradeLevel = 0;
            this.upgrades = [];
            
            // Position
            this.gridX = x;
            this.gridY = y;
            this.x = x * CONFIG.tileSize + CONFIG.tileSize / 2;
            this.y = y * CONFIG.tileSize + CONFIG.tileSize / 2;
            
            // Stats (copied from config)
            this.damage = config.damage;
            this.attackSpeed = config.attackSpeed;
            this.range = config.range;
            this.splashRadius = config.splashRadius || 0;
            this.targeting = config.targeting;
            this.color = config.color;
            
            // State
            this.cooldown = 0;
            this.angle = 0;
            this.projectilesLaunched = 0;
        }

        update(deltaTime) {
            if (this.cooldown > 0) {
                this.cooldown -= deltaTime;
            }
        }

        findTarget(enemies, gameTowers) {
            if (this.type === 'support') return null;
            
            const rangeSq = (this.range * CONFIG.tileSize) ** 2;
            let targets = [];
            
            for (const enemy of enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq <= rangeSq) {
                    targets.push({
                        enemy,
                        distance: Math.sqrt(distSq),
                        healthPercent: enemy.health / enemy.maxHealth
                    });
                }
            }
            
            if (targets.length === 0) return null;
            
            // Apply targeting mode
            switch (this.targeting) {
                case 'first':
                    targets.sort((a, b) => b.enemy.pathIndex - a.enemy.pathIndex || b.enemy.progress - a.enemy.progress);
                    break;
                case 'last':
                    targets.sort((a, b) => a.enemy.pathIndex - b.enemy.pathIndex || a.enemy.progress - b.enemy.progress);
                    break;
                case 'strongest':
                    targets.sort((a, b) => b.enemy.health - a.enemy.health);
                    break;
                case 'weakest':
                    targets.sort((a, b) => a.enemy.health - b.enemy.health);
                    break;
            }
            
            return targets[0].enemy;
        }

        getBuffs(gameTowers) {
            if (this.type === 'support') return { damage: 1, speed: 1 };
            
            let damageBuff = 1;
            let speedBuff = 1;
            
            for (const tower of gameTowers) {
                if (tower.type !== 'support' || tower === this) continue;
                
                const dx = this.gridX - tower.gridX;
                const dy = this.gridY - tower.gridY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist <= TOWER_TYPES.support.buffRange) {
                    damageBuff *= TOWER_TYPES.support.buffs.damage;
                    speedBuff *= TOWER_TYPES.support.buffs.speed;
                }
            }
            
            return { damage: damageBuff, speed: speedBuff };
        }
    }

    class Projectile {
        constructor(tower, enemy) {
            this.tower = tower;
            this.targetEnemy = enemy;
            this.x = tower.x;
            this.y = tower.y;
            this.speed = 0.5;
            this.damageDealt = false;
        }

        reset() {
            this.damageDealt = false;
        }
    }

    // ============================================
    // WAVE & AI DIRECTOR SYSTEMS
    // ============================================

    class WaveManager {
        constructor(game) {
            this.game = game;
            this.currentWave = 0;
            this.enemiesToSpawn = [];
            this.spawnTimer = 0;
            this.isRunning = false;
            this.waveComplete = true;
        }

        generateWave(waveNumber) {
            const difficulty = waveNumber / CONFIG.maxWaves;
            
            let composition = [];
            
            // Base enemies always present
            const basicCount = Math.floor(5 + waveNumber * 1.5);
            for (let i = 0; i < basicCount; i++) {
                composition.push('basic');
            }
            
            // Add variety based on wave
            if (waveNumber >= 3) {
                const tankCount = Math.floor(waveNumber / 5);
                for (let i = 0; i < tankCount; i++) {
                    composition.push('tank');
                }
            }
            
            if (waveNumber >= 2) {
                const swarmCount = waveNumber * 2;
                for (let i = 0; i < swarmCount; i++) {
                    composition.push('swarm');
                }
            }
            
            if (waveNumber >= 5 && waveNumber % 3 === 0) {
                const flyerCount = Math.floor(waveNumber / 2);
                for (let i = 0; i < flyerCount; i++) {
                    composition.push('flying');
                }
            }
            
            if (waveNumber >= 7 && waveNumber % 4 === 0) {
                const shieldedCount = Math.floor(waveNumber / 4);
                for (let i = 0; i < shieldedCount; i++) {
                    composition.push('shielded');
                }
            }
            
            // Boss waves
            if (waveNumber % 10 === 0 && waveNumber > 0) {
                composition.push('boss');
                const minionCount = Math.floor(waveNumber / 2);
                for (let i = 0; i < minionCount; i++) {
                    composition.push(Math.random() > 0.5 ? 'tank' : 'basic');
                }
            }

            // Shuffle
            composition = this.shuffle(composition);
            return composition;
        }

        startWave(waveNumber) {
            this.currentWave = waveNumber;
            this.enemiesToSpawn = this.generateWave(waveNumber);
            this.spawnTimer = 120; // Start spawning after 2 seconds
            this.isRunning = true;
            this.waveComplete = false;
        }

        update(deltaTime) {
            if (!this.isRunning) return;
            
            // Spawn enemies
            if (this.enemiesToSpawn.length > 0 && this.spawnTimer <= 0) {
                const enemyType = this.enemiesToSpawn.shift();
                const enemy = this.game.enemyPool.acquire();
                enemy.type = enemyType;
                Object.assign(enemy, ENEMY_TYPES[enemyType]);
                enemy.maxHealth = Math.floor(ENEMY_TYPES[enemyType].health * (1 + this.currentWave * 0.3));
                enemy.health = enemy.maxHealth;
                enemy.shield = ENEMY_TYPES[enemyType].shield ? Math.floor(ENEMY_TYPES[enemyType].shield * (1 + this.currentWave * 0.3)) : 0;
                
                // Set path
                const startTile = this.game.pathfindingStart;
                enemy.x = startTile.x * CONFIG.tileSize + CONFIG.tileSize / 2;
                enemy.y = startTile.y * CONFIG.tileSize + CONFIG.tileSize / 2;
                
                if (ENEMY_TYPES[enemyType].ignoresPath) {
                    // Direct path to core for flying enemies
                    const endTile = this.game.pathfindingEnd;
                    enemy.path = [
                        { x: startTile.x, y: startTile.y },
                        { x: endTile.x, y: endTile.y }
                    ];
                } else {
                    enemy.path = [...this.game.mainPath];
                }
                
                enemy.pathIndex = 0;
                enemy.progress = 0;
                
                this.game.enemies.push(enemy);
                this.spawnTimer = Math.max(15, 60 - this.currentWave * 2); // Spawn faster each wave
            } else {
                this.spawnTimer -= deltaTime;
            }
            
            // Check if wave is complete
            if (this.enemiesToSpawn.length === 0 && this.game.enemies.length === 0) {
                this.isRunning = false;
                this.waveComplete = true;
                
                // Bonus gold for completing wave
                this.game.addGold(25 + this.currentWave * 5);
            }
        }

        shuffle(array) {
            const result = [...array];
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        }
    }

    class AIDirector {
        constructor(game) {
            this.game = game;
            this.playerStats = {
                totalDamage: 0,
                enemiesKilled: 0,
                livesLost: 0,
                towersBuilt: 0
            };
            this.difficultyMultiplier = 1.0;
        }

        trackKill(enemy) {
            this.playerStats.enemiesKilled++;
            this.playerStats.totalDamage += enemy.maxHealth;
        }

        trackLifeLost() {
            this.playerStats.livesLost++;
            // Increase difficulty if player is doing too well
            if (this.difficultyMultiplier < 1.5) {
                this.difficultyMultiplier *= 1.05;
            }
        }

        getSpawnModifier() {
            return this.difficultyMultiplier;
        }
    }

    // ============================================
    // MAIN GAME CLASS
    // ============================================

    class Game {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            // Set canvas size
            this.canvas.width = CONFIG.canvasWidth;
            this.canvas.height = CONFIG.canvasHeight;
            
            // Game state
            this.state = 'menu'; // menu, playing, paused, gameover, victory
            this.gameSpeed = 1.0;
            this.lastTime = performance.now();
            
            // Initialize systems
            this.initGrid();
            this.pathfinding = new Pathfinding(this.grid);
            this.calculateMainPath();
            
            // Object pools
            this.enemyPool = new ObjectPool(() => new Enemy('basic', 1), 50);
            this.projectilePool = new ObjectPool(() => new Projectile(null, null), 20);
            
            // Game data
            this.enemies = [];
            this.towers = [];
            this.projectiles = []
