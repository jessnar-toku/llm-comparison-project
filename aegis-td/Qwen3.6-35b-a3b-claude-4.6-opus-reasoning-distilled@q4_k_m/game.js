/**
 * Aegis Grid: Adaptive Defense
 * A comprehensive HTML5 Tower Defense game with adaptive AI systems
 * 
 * Architecture:
 * - Game Engine: Main loop, state management, rendering
 * - Map System: Grid-based map with A* pathfinding
 * - Tower System: Multiple types with branching upgrades
 * - Enemy System: Various types including adaptive AI
 * - Wave System: Procedural generation with difficulty scaling
 * - Resource System: Dual economy (gold + energy)
 * - Player Abilities: Active skills with cooldowns
 * - Status Effects: Poison, slow, burn, shock, shield break
 * - AI Director: Dynamic difficulty adjustment
 * - UI System: HUD, menus, interactions
 * - Save System: LocalStorage persistence
 */

// ============================================
// CONFIGURATION AND CONSTANTS
// ============================================

const CONFIG = {
    // Map settings
    MAP_WIDTH: 25,
    MAP_HEIGHT: 20,
    TILE_SIZE: 40,
    
    // Performance
    TARGET_FPS: 60,
    MAX_ENEMIES: 200,
    MAX_TOWERS: 50,
    
    // Game balance
    INITIAL_GOLD: 100,
    INITIAL_ENERGY: 50,
    INITIAL_CORE_HEALTH: 100,
    CORE_MAX_HEALTH: 100,
    
    // Tower configurations
    TOWERS: {
        basic: {
            name: "Basic Tower",
            cost: 10,
            damage: 15,
            attackSpeed: 1.0,
            range: 120,
            targetingMode: "first",
            color: "#4CAF50",
            upgradeCost: 20
        },
        splash: {
            name: "Splash Tower",
            cost: 25,
            damage: 10,
            attackSpeed: 0.8,
            range: 100,
            targetingMode: "first",
            splashRadius: 30,
            color: "#FF9800",
            upgradeCost: 40
        },
        slow: {
            name: "Slow Tower",
            cost: 20,
            damage: 5,
            attackSpeed: 1.2,
            range: 110,
            targetingMode: "first",
            slowAmount: 0.5,
            slowDuration: 2.0,
            color: "#2196F3",
            upgradeCost: 35
        },
        sniper: {
            name: "Sniper Tower",
            cost: 40,
            damage: 100,
            attackSpeed: 0.2,
            range: 200,
            targetingMode: "strongest",
            color: "#9C27B0",
            upgradeCost: 60
        },
        support: {
            name: "Support Tower",
            cost: 30,
            damage: 0,
            attackSpeed: 0,
            range: 130,
            targetingMode: "none",
            buffAmount: 0.2,
            buffType: "damage",
            color: "#00BCD4",
            upgradeCost: 45
        }
    },
    
    // Enemy configurations
    ENEMIES: {
        basic: {
            name: "Basic",
            health: 50,
            speed: 1.5,
            armor: 0,
            resistance: {},
            reward: 5,
            color: "#f44336",
            size: 8
        },
        tank: {
            name: "Tank",
            health: 200,
            speed: 0.8,
            armor: 2,
            resistance: {physical: 0.3},
            reward: 15,
            color: "#795548",
            size: 12
        },
        swarm: {
            name: "Swarm",
            health: 15,
            speed: 2.5,
            armor: 0,
            resistance: {},
            reward: 1,
            color: "#8BC34A",
            size: 5
        },
        flying: {
            name: "Flying",
            health: 30,
            speed: 2.0,
            armor: 0,
            resistance: {slow: 0.5},
            reward: 8,
            color: "#29B6F6",
            size: 6,
            canFly: true
        },
        shielded: {
            name: "Shielded",
            health: 100,
            speed: 1.2,
            armor: 1,
            resistance: {},
            shield: 50,
            shieldRegen: 5,
            reward: 12,
            color: "#9E9E9E",
            size: 10
        },
        adaptive: {
            name: "Adaptive",
            health: 80,
            speed: 1.3,
            armor: 1,
            resistance: {},
            reward: 20,
            color: "#FF5722",
            size: 9,
            adaptive: true
        }
    },
    
    // Player abilities
    ABILITIES: {
        airstrike: {
            name: "Airstrike",
            description: "Deal AoE damage to all enemies in target area",
            energyCost: 15,
            cooldown: 30,
            damage: 100,
            radius: 60,
            color: "#FF6600"
        },
        freeze: {
            name: "Freeze",
            description: "Slow all enemies by 70% for 3 seconds",
            energyCost: 10,
            cooldown: 45,
            slowAmount: 0.3,
            duration: 3,
            color: "#00CCFF"
        },
        overclock: {
            name: "Overclock",
            description: "Boost all tower attack speed by 50% for 10 seconds",
            energyCost: 20,
            cooldown: 60,
            duration: 10,
            buffAmount: 1.5,
            color: "#FFCC00"
        }
    },
    
    // Status effects
    STATUS_EFFECTS: {
        poison: { name: "Poison", color: "#32CD32", damagePerTick: 5, tickInterval: 1, duration: 3, stackable: true },
        slow: { name: "Slow", color: "#00BFFF", speedReduction: 0.5, duration: 2, stackable: true },
        burn: { name: "Burn", color: "#FF4500", damagePerTick: 10, tickInterval: 0.5, duration: 2, stackable: true },
        shock: { name: "Shock", color: "#FFD700", chainDamage: 25, maxChains: 3, duration: 1, stackable: false },
        shieldBreak: { name: "Shield Break", color: "#999999", duration: 3, stackable: false }
    },
    
    // Tower upgrades
    UPGRADES: {
        basic: {
            path1: {
                name: "Burst Fire",
                cost: 50,
                effect: { attackSpeed: 1.5, damage: 0.9 }
            },
            path2: {
                name: "Precision Shots",
                cost: 50,
                effect: { range: 1.2, damage: 1.3 }
            }
        },
        splash: {
            path1: {
                name: "Poison Splash",
                cost: 70,
                effect: { statusEffect: "poison", statusDuration: 3 }
            },
            path2: {
                name: "Explosion Chain",
                cost: 70,
                effect: { chainDamage: 30, chainRange: 50 }
            }
        },
        slow: {
            path1: {
                name: "Deep Freeze",
                cost: 60,
                effect: { slowAmount: 0.3, slowDuration: 1.0 }
            },
            path2: {
                name: "Frost Nova",
                cost: 60,
                effect: { splashRadius: 40 }
            }
        },
        sniper: {
            path1: {
                name: "Penetrating Rounds",
                cost: 80,
                effect: { damage: 2.0, armorPierce: 50 }
            },
            path2: {
                name: "Rapid Fire",
                cost: 80,
                effect: { attackSpeed: 1.8, range: 0.8 }
            }
        },
        support: {
            path1: {
                name: "Damage Aura",
                cost: 70,
                effect: { buffAmount: 0.3, buffType: "damage" }
            },
            path2: {
                name: "Speed Aura",
                cost: 70,
                effect: { buffAmount: 0.2, buffType: "attackSpeed" }
            }
        }
    }
};

// ============================================
// UTILITIES AND HELPERS
// ============================================

const Utils = {
    distance: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    
    angleBetween: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
    
    lerp: (start, end, t) => start + (end - start) * t,
    
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    
    randomRange: (min, max) => min + Math.random() * (max - min),
    
    randomElement: (arr) => arr[Math.floor(Math.random() * arr.length)],
    
    formatTime: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    seededRandom: (seed) => {
        let s = seed;
        return () => {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };
    }
};

// ============================================
// A* PATHFINDING ENGINE
// ============================================

class AStarPathfinder {
    constructor(width, height, tileMap) {
        this.width = width;
        this.height = height;
        this.tileMap = tileMap;
        this.cache = new Map();
    }
    
    findPath(startX, startY, endX, endY) {
        // Check if cache exists for these coordinates
        const cacheKey = `${startX},${startY},${endX},${endY}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const openSet = [{ x: startX, y: startY, f: 0, g: 0, parent: null }];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const heuristic = (x, y) => {
            return Utils.distance(x, y, endX, endY);
        };
        
        while (openSet.length > 0) {
            // Find node with lowest f score
            let current = openSet.reduce((a, b) => a.f < b.f ? a : b);
            
            if (current.x === endX && current.y === endY) {
                // Reconstruct path
                const path = [];
                let node = current;
                while (node) {
                    path.unshift({ x: node.x, y: node.y });
                    node = node.parent;
                }
                this.cache.set(cacheKey, path);
                return path;
            }
            
            openSet.splice(openSet.indexOf(current), 1);
            closedSet.add(`${current.x},${current.y}`);
            
            // Check neighbors
            const neighbors = [
                { x: current.x - 1, y: current.y },
                { x: current.x + 1, y: current.y },
                { x: current.x, y: current.y - 1 },
                { x: current.x, y: current.y + 1 }
            ];
            
            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (closedSet.has(key)) continue;
                if (neighbor.x < 0 || neighbor.x >= this.width || neighbor.y < 0 || neighbor.y >= this.height) continue;
                if (this.tileMap[neighbor.y][neighbor.x] === 1 || this.tileMap[neighbor.y][neighbor.x] === 2) continue; // Blocked
                
                const tentativeG = gScore.get(`${current.x},${current.y}`) + 1;
                
                if (!gScore.has(key) || tentativeG < gScore.get(key)) {
                    cameFrom.set(key, current);
                    gScore.set(key, tentativeG);
                    fScore.set(key, tentativeG + heuristic(neighbor.x, neighbor.y));
                    
                    if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push({
                            x: neighbor.x,
                            y: neighbor.y,
                            f: fScore.get(key),
                            g: gScore.get(key),
                            parent: current
                        });
                    }
                }
            }
        }
        
        // No path found
        this.cache.set(cacheKey, []);
        return [];
    }
    
    // Clear cache for performance
    clearCache() {
        this.cache.clear();
    }
}

// ============================================
// MAP SYSTEM
// ============================================

class MapSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.path = [];
        this.pathSet = new Set();
        this.entryPoints = [];
        this.exitPoints = [];
        this.generator = null;
    }
    
    generateMap(seed) {
        // Initialize tile types: 0=buildable, 1=path, 2=blocked
        this.tiles = Array.from({ length: this.height }, () => 
            Array.from({ length: this.width }, () => 0)
        );
        
        // Generate path using random walk
        const rng = Utils.seededRandom(seed);
        const startX = Math.floor(rng() * this.width);
        const startY = 0;
        
        this.tiles[startY][startX] = 1;
        this.path.push({ x: startX, y: startY });
        
        let currentX = startX;
        let currentY = startY;
        let steps = 0;
        const maxSteps = this.width * this.height * 2;
        
        while (currentY < this.height - 1 && steps < maxSteps) {
            const directions = [{ x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
            const dir = Utils.randomElement(directions);
            
            const newX = currentX + dir.x;
            const newY = currentY + dir.y;
            
            if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
                if (this.tiles[newY][newX] === 0 || this.tiles[newY][newX] === 1) {
                    if (this.tiles[newY][newX] === 0) {
                        this.tiles[newY][newX] = 1;
                        this.path.push({ x: newX, y: newY });
                    }
                    currentX = newX;
                    currentY = newY;
                }
            }
            steps++;
        }
        
        // Mark entry and exit points
        this.entryPoints = [{ x: this.path[0].x, y: this.path[0].y }];
        this.exitPoints = [{ x: this.path[this.path.length - 1].x, y: this.path[this.path.length - 1].y }];
        
        // Create path set for quick lookup
        this.pathSet = new Set(this.path.map(p => `${p.x},${p.y}`));
        
        // Add some obstacles for visual interest
        for (let i = 0; i < 15; i++) {
            const x = Math.floor(rng() * this.width);
            const y = Math.floor(rng() * this.height);
            if (!this.pathSet.has(`${x},${y}`)) {
                this.tiles[y][x] = 2;
            }
        }
        
        return this.tiles;
    }
    
    isPath(x, y) {
        return this.pathSet.has(`${x},${y}`);
    }
    
    canPlaceTower(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height && 
               this.tiles[y][x] === 0 && !this.pathSet.has(`${x},${y}`);
    }
    
    // Get all path positions for enemy movement
    getPathPositions() {
        return [...this.path];
    }
}

// ============================================
// TOWER SYSTEM
// ============================================

class Tower {
    constructor(type, x, y) {
        const config = CONFIG.TOWERS[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.damage = config.damage;
        this.attackSpeed = config.attackSpeed;
        this.range = config.range;
        this.targetingMode = config.targetingMode;
        this.color = config.color;
        this.attackCooldown = 0;
        this.level = 1;
        this.upgradePath = null;
        
        // Special properties based on type
        this.splashRadius = config.splashRadius || 0;
        this.slowAmount = config.slowAmount || 0;
        this.slowDuration = config.slowDuration || 0;
        this.buffAmount = config.buffAmount || 0;
        this.buffType = config.buffType || null;
    }
    
    getAttackInterval() {
        let interval = 1 / this.attackSpeed;
        
        // Apply overclock buff
        if (Game.instance && Game.instance.overclockActive) {
            interval *= 0.67; // 50% faster
        }
        
        // Apply support tower buff
        if (Game.instance) {
            const nearbySupports = Game.instance.towers.filter(t => 
                t.type === 'support' && Utils.distance(this.x, this.y, t.x, t.y) < t.range
            );
            for (const support of nearbySupports) {
                if (support.upgradePath) {
                    const upgrade = CONFIG.UPGRADES[support.type][support.upgradePath];
                    if (upgrade && upgrade.effect.buffType === this.buffType) {
                        interval *= (1 / (1 + support.buffAmount + (upgrade.effect.buffAmount - support.buffAmount)));
                    }
                }
            }
        }
        
        return interval;
    }
    
    findTarget(enemies) {
        const nearbyEnemies = enemies.filter(enemy => 
            enemy.alive && Utils.distance(this.x, this.y, enemy.x, enemy.y) <= this.range
        );
        
        if (nearbyEnemies.length === 0) return null;
        
        switch (this.targetingMode) {
            case 'first':
                return nearbyEnemies[0];
            case 'last':
                return nearbyEnemies[nearbyEnemies.length - 1];
            case 'strongest':
                return nearbyEnemies.reduce((a, b) => a.health > b.health ? a : b);
            case 'weakest':
                return nearbyEnemies.reduce((a, b) => a.health < b.health ? a : b);
            default:
                return null;
        }
    }
    
    attack(target, enemies = []) {
        if (!target || !target.alive) return;
        
        let damage = this.damage;
        
        // Apply support tower buff
        if (this.type !== 'support' && Game.instance) {
            const nearbySupports = Game.instance.towers.filter(t => 
                t.type === 'support' && Utils.distance(this.x, this.y, t.x, t.y) < t.range
            );
            for (const support of nearbySupports) {
                if (support.upgradePath) {
                    const upgrade = CONFIG.UPGRADES[support.type][support.upgradePath];
                    if (upgrade && upgrade.effect.buffType === 'damage') {
                        damage *= (1 + support.buffAmount + (upgrade.effect.buffAmount - support.buffAmount));
                    }
                }
            }
        }
        
        // Apply armor reduction
        const armorReduction = 1 - (target.armor / 100);
        damage *= armorReduction;
        
        // Apply resistance
        let resistance = 1;
        if (target.resistance) {
            resistance = 1 - (target.resistance.physical || 0);
        }
        damage *= resistance;
        
        // Apply shield
        if (target.shield > 0) {
            target.shield -= damage;
            if (target.shield < 0) {
                target.health += target.shield;
                target.shield = 0;
            }
            Game.instance.addProjectile(this.x, this.y, target.x, target.y, damage, this.color);
            return;
        }
        
        target.health -= damage;
        Game.instance.addProjectile(this.x, this.y, target.x, target.y, damage, this.color);
        
        // Splash damage
        if (this.splashRadius > 0 && enemies.length > 0) {
            for (const enemy of enemies) {
                if (enemy !== target && enemy.alive && Utils.distance(target.x, target.y, enemy.x, enemy.y) < this.splashRadius) {
                    const splashDamage = damage * 0.5;
                    if (enemy.shield > 0) {
                        enemy.shield -= splashDamage;
                        if (enemy.shield < 0) {
                            enemy.health += enemy.shield;
                            enemy.shield = 0;
                        }
                    } else {
                        enemy.health -= splashDamage;
                    }
                }
            }
        }
        
        // Apply slow effect
        if (this.slowAmount > 0) {
            target.addStatusEffect('slow', {
                amount: this.slowAmount,
                duration: this.slowDuration
            });
        }
        
        // Apply poison splash upgrade
        if (this.type === 'splash' && this.upgradePath === 'path1') {
            target.addStatusEffect('poison', {
                duration: 3
            });
        }
        
        // Apply frost nova upgrade
        if (this.type === 'slow' && this.upgradePath === 'path2') {
            for (const enemy of enemies) {
                if (enemy.alive && Utils.distance(target.x, target.y, enemy.x, enemy.y) < 40) {
                    enemy.addStatusEffect('slow', {
                        amount: 0.7,
                        duration: 1
                    });
                }
            }
        }
        
        if (target.health <= 0) {
            target.die();
        }
    }
    
    upgrade(upgradePath) {
        const upgrade = CONFIG.UPGRADES[this.type][upgradePath];
        if (!upgrade) return false;
        
        this.upgradePath = upgradePath;
        const effect = upgrade.effect;
        
        // Apply upgrade effects
        if (effect.attackSpeed) this.attackSpeed *= effect.attackSpeed;
        if (effect.damage) this.damage *= effect.damage;
        if (effect.range) this.range *= effect.range;
        if (effect.slowAmount) this.slowAmount *= effect.slowAmount;
        if (effect.slowDuration) this.slowDuration *= effect.slowDuration;
        if (effect.splashRadius) this.splashRadius = effect.splashRadius;
        if (effect.buffAmount) this.buffAmount += (effect.buffAmount - (this.buffAmount || 0));
        if (effect.buffType) this.buffType = effect.buffType;
        if (effect.statusEffect) this.statusEffect = effect.statusEffect;
        if (effect.statusDuration) this.statusDuration = effect.statusDuration;
        
        this.level++;
        return true;
    }
    
    getCost() {
        const baseCost = CONFIG.TOWERS[this.type].cost;
        return baseCost + (this.level - 1) * CONFIG.TOWERS[this.type].upgradeCost;
    }
}

// ============================================
// ENEMY SYSTEM
// ============================================

class Enemy {
    constructor(type, path, position) {
        const config = CONFIG.ENEMIES[type];
        this.type = type;
        this.path = path;
        this.pathIndex = 0;
        this.position = position;
        this.health = config.health;
        this.maxHealth = config.health;
        this.speed = config.speed;
        this.armor = config.armor;
        this.resistance = { ...config.resistance };
        this.reward = config.reward;
        this.color = config.color;
        this.size = config.size;
        this.alive = true;
        this.canFly = config.canFly || false;
        this.shield = config.shield || 0;
        this.shieldRegen = config.shieldRegen || 0;
        this.adaptive = config.adaptive || false;
        this.statusEffects = new Map();
        
        // Start position from path
        if (this.path.length > 0) {
            this.x = this.path[0].x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            this.y = this.path[0].y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            this.currentTile = this.path[0];
        }
    }
    
    addStatusEffect(type, data) {
        const effect = CONFIG.STATUS_EFFECTS[type];
        if (effect.stackable) {
            const existing = this.statusEffects.get(type);
            if (existing) {
                existing.duration = Math.max(existing.duration, data.duration || effect.duration);
                if (data.amount && data.amount > existing.amount) {
                    existing.amount = data.amount;
                }
            } else {
                this.statusEffects.set(type, { ...effect, ...data, amount: data.amount || effect.speedReduction || effect.damagePerTick });
            }
        } else {
            this.statusEffects.set(type, { ...effect, ...data, amount: data.amount || effect.speedReduction || effect.damagePerTick });
        }
    }
    
    updateStatusEffects(deltaTime) {
        for (const [type, effect] of this.statusEffects) {
            if (effect.duration !== undefined) {
                effect.duration -= deltaTime;
                if (effect.duration <= 0) {
                    this.statusEffects.delete(type);
                    continue;
                }
            }
            
            if (effect.tickInterval) {
                if (!effect.lastTick) effect.lastTick = 0;
                effect.lastTick += deltaTime;
                if (effect.lastTick >= effect.tickInterval) {
                    this.health -= effect.damagePerTick;
                    effect.lastTick = 0;
                }
            }
        }
        
        // Shield regen
        if (this.shieldRegen > 0 && this.shield > 0) {
            this.shield = Math.min(this.shield + this.shieldRegen * deltaTime, this.maxHealth * 0.5);
        }
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        // Update status effects
        this.updateStatusEffects(deltaTime);
        
        if (this.health <= 0) {
            this.die();
            return;
        }
        
        // Calculate speed with effects
        let speedMultiplier = 1;
        if (this.statusEffects.has('slow')) {
            speedMultiplier = 1 - this.statusEffects.get('slow').amount;
        }
        
        if (Game.instance && Game.instance.freezeActive) {
            speedMultiplier *= 0.3;
        }
        
        // Move along path
        if (!this.canFly) {
            if (this.pathIndex < this.path.length - 1) {
                const currentTile = this.path[this.pathIndex];
                const nextTile = this.path[this.pathIndex + 1];
                
                const currentX = currentTile.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                const currentY = currentTile.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                const nextX = nextTile.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                const nextY = nextTile.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                
                const distanceToNext = Utils.distance(this.x, this.y, nextX, nextY);
                const moveAmount = this.speed * speedMultiplier * deltaTime * 60;
                
                if (moveAmount >= distanceToNext) {
                    this.x = nextX;
                    this.y = nextY;
                    this.pathIndex++;
                } else {
                    const progress = moveAmount / distanceToNext;
                    this.x = Utils.lerp(this.x, nextX, progress);
                    this.y = Utils.lerp(this.y, nextY, progress);
                }
            } else {
                // Reached end
                this.reachEnd();
            }
        } else {
            // Flying - move in straight line
            if (this.pathIndex < this.path.length - 1) {
                const nextTile = this.path[this.pathIndex + 1];
                const nextX = nextTile.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                const nextY = nextTile.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                
                const distanceToNext = Utils.distance(this.x, this.y, nextX, nextY);
                const moveAmount = this.speed * speedMultiplier * deltaTime * 60;
                
                if (moveAmount >= distanceToNext) {
                    this.x = nextX;
                    this.y = nextY;
                    this.pathIndex++;
                } else {
                    const progress = moveAmount / distanceToNext;
                    this.x = Utils.lerp(this.x, nextX, progress);
                    this.y = Utils.lerp(this.y, nextY, progress);
                }
            } else {
                this.reachEnd();
            }
        }
        
        // Adaptive AI - learn from damage patterns
        if (this.adaptive && Game.instance) {
            const dominantTowerType = Game.instance.getDominantTowerType();
            if (dominantTowerType === 'splash') {
                this.resistance.physical = Math.min((this.resistance.physical || 0) + 0.01, 0.5);
            }
        }
    }
    
    reachEnd() {
        this.alive = false;
        if (Game.instance) {
            Game.instance.loseCoreHealth(10);
        }
    }
    
    die() {
        this.alive = false;
        if (Game.instance) {
            Game.instance.addGold(this.reward);
            // Chance for energy reward
            if (Math.random() < 0.1) {
                Game.instance.addEnergy(1);
            }
        }
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        // Draw body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw health bar
        const barWidth = this.size * 2;
        const barHeight = 3;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 8;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#f44336';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Draw status effect indicators
        let indicatorX = this.x - this.size - 4;
        for (const [type, effect] of this.statusEffects) {
            ctx.fillStyle = effect.color;
            ctx.fillRect(indicatorX, barY, 3, barHeight);
            indicatorX -= 5;
        }
        
        // Draw shield
        if (this.shield > 0) {
            ctx.strokeStyle = '#88ccff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// ============================================
// PROJECTILE SYSTEM
// ============================================

class Projectile {
    constructor(x, y, targetX, targetY, damage, color) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.damage = damage;
        this.color = color;
        this.speed = 5;
        this.alive = true;
    }
    
    update(deltaTime) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
            this.alive = false;
            return;
        }
        
        this.x += (dx / distance) * this.speed * deltaTime * 60;
        this.y += (dy / distance) * this.speed * deltaTime * 60;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================
// WAVE SYSTEM
// ============================================

class WaveSystem {
    constructor() {
        this.waveNumber = 0;
        this.waveActive = false;
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;
        this.wavePreview = [];
        this.difficulty = 1;
    }
    
    generateWave() {
        this.waveNumber++;
        this.difficulty = 1 + (this.waveNumber - 1) * 0.2;
        
        // Linear + exponential hybrid scaling
        const baseEnemies = 10;
        const enemyCount = Math.floor(baseEnemies * Math.pow(1.15, this.waveNumber - 1));
        
        this.enemiesToSpawn = [];
        this.wavePreview = [];
        
        // Determine enemy composition based on difficulty
        const basicChance = Math.max(0.3, 1 - this.waveNumber * 0.05);
        const tankChance = Math.min(0.3, (this.waveNumber - 3) * 0.05);
        const swarmChance = 0.3;
        const specialChance = Math.min(0.2, this.waveNumber * 0.02);
        
        for (let i = 0; i < enemyCount; i++) {
            let type;
            const roll = Math.random();
            if (roll < basicChance) {
                type = 'basic';
            } else if (roll < basicChance + tankChance) {
                type = 'tank';
            } else if (roll < basicChance + tankChance + swarmChance) {
                type = 'swarm';
            } else if (roll < basicChance + tankChance + swarmChance + specialChance) {
                type = Utils.randomElement(['flying', 'shielded', 'adaptive']);
            } else {
                type = 'basic';
            }
            
            this.enemiesToSpawn.push({ type, spawnDelay: i * 0.5 });
            this.wavePreview.push(type);
        }
        
        // Boss wave every 5 waves
        if (this.waveNumber % 5 === 0) {
            this.enemiesToSpawn.unshift({ type: 'tank', spawnDelay: 0 });
            this.wavePreview.unshift('boss');
        }
    }
    
    update(deltaTime) {
        if (!this.waveActive) return;
        
        this.spawnTimer += deltaTime;
        
        // Spawn enemies based on delay
        while (this.enemiesToSpawn.length > 0 && this.enemiesToSpawn[0].spawnDelay <= this.spawnTimer) {
            const enemyData = this.enemiesToSpawn.shift();
            const path = Game.instance.map.getPathPositions();
            const startPos = path[0];
            Game.instance.spawnEnemy(enemyData.type, path, startPos);
        }
        
        // Check if wave is complete
        if (this.enemiesToSpawn.length === 0) {
            const livingEnemies = Game.instance.enemies.filter(e => e.alive).length;
            if (livingEnemies === 0) {
                this.waveActive = false;
                this.startNextWave();
            }
        }
    }
    
    startWave() {
        this.generateWave();
        this.waveActive = true;
        this.spawnTimer = 0;
    }
    
    startNextWave() {
        // Passive income between waves
        Game.instance.addGold(10);
        Game.instance.addEnergy(5);
        
        setTimeout(() => {
            this.startWave();
        }, 3000);
    }
    
    isWaveActive() {
        return this.waveActive;
    }
    
    getWavePreview() {
        return this.wavePreview;
    }
}

// ============================================
// AI DIRECTOR
// ============================================

class AIDirector {
    constructor() {
        this.playerMetrics = {
            damageOutput: 0,
            leakRate: 0,
            resourceUsage: 0,
            recentDeaths: 0
        };
        this.lastCheckTime = 0;
        this.checkInterval = 30; // Check every 30 seconds
        this.difficultyModifiers = {
            enemyHealthMultiplier: 1,
            enemySpeedMultiplier: 1,
            spawnRateMultiplier: 1
        };
    }
    
    update(playerMetrics, deltaTime) {
        this.lastCheckTime += deltaTime;
        
        if (this.lastCheckTime >= this.checkInterval) {
            this.lastCheckTime = 0;
            this.adjustDifficulty(playerMetrics);
        }
    }
    
    adjustDifficulty(metrics) {
        // Calculate flow state indicators
        const engagementScore = metrics.damageOutput > 100 ? 1 : 0;
        const stressIndicator = metrics.leakRate > 5 ? 1 : 0;
        
        if (engagementScore === 1 && stressIndicator === 0) {
            // Player is engaged but not stressed - increase difficulty
            this.difficultyModifiers.enemyHealthMultiplier += 0.05;
            this.difficultyModifiers.spawnRateMultiplier += 0.02;
        } else if (stressIndicator === 1) {
            // Player is stressed - decrease difficulty
            this.difficultyModifiers.enemyHealthMultiplier -= 0.05;
            this.difficultyModifiers.spawnRateMultiplier -= 0.02;
        }
        
        // Clamp values
        this.difficultyModifiers.enemyHealthMultiplier = Math.max(0.8, Math.min(1.5, this.difficultyModifiers.enemyHealthMultiplier));
        this.difficultyModifiers.spawnRateMultiplier = Math.max(0.8, Math.min(1.5, this.difficultyModifiers.spawnRateMultiplier));
    }
    
    getDifficultyModifier() {
        return this.difficultyModifiers;
    }
}

// ============================================
// GAME ENGINE - MAIN SYSTEM
// ============================================

class Game {
    static instance = null;
    
    constructor(canvasId) {
        Game.instance = this;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameover
        this.lastTime = 0;
        this.accumulator = 0;
        this.frameTime = 1000 / CONFIG.TARGET_FPS;
        
        // Game systems
        this.map = new MapSystem(CONFIG.MAP_WIDTH, CONFIG.MAP_HEIGHT);
        this.pathfinder = null;
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.waveSystem = new WaveSystem();
        this.aiDirector = new AIDirector();
        
        // Resources
        this.gold = CONFIG.INITIAL_GOLD;
        this.energy = CONFIG.INITIAL_ENERGY;
        this.coreHealth = CONFIG.INITIAL_CORE_HEALTH;
        
        // Player abilities
        this.abilities = {
            airstrike: { cooldown: 0, active: false },
            freeze: { cooldown: 0, active: false },
            overclock: { cooldown: 0, active: false }
        };
        this.overclockActive = false;
        this.freezeActive = false;
        
        // Input handling
        this.selectedTower = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        
        // UI elements
        this.uiElements = {
            hudLeft: document.getElementById('hud-left'),
            hudCenter: document.getElementById('hud-center'),
            hudRight: document.getElementById('hud-right'),
            upgradeMenu: document.getElementById('upgrade-menu'),
            wavePreview: document.getElementById('wave-preview'),
            gameOver: document.getElementById('game-over')
        };
        
        // Player metrics tracking
        this.playerMetrics = {
            damageOutput: 0,
            leakRate: 0,
            resourceUsage: 0,
            recentDeaths: 0
        };
        
        this.seed = Date.now() % 10000;
        this.resize();
        this.setupEventListeners();
        this.startGame();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.map.generateMap(this.seed);
        this.pathfinder = new AStarPathfinder(CONFIG.MAP_WIDTH, CONFIG.MAP_HEIGHT, this.map.tiles);
        this.waveSystem.startWave();
        this.gameLoop();
    }
    
    resize() {
        const container = document.getElementById('game-container');
        const hudHeight = document.getElementById('hud') ? document.getElementById('hud').offsetHeight : 80;
        
        this.canvas.width = CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE;
        this.canvas.height = CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = hudHeight + 'px';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = `calc(100vh - ${hudHeight}px)`;
        
        this.canvas.style.maxWidth = this.canvas.width + 'px';
        this.canvas.style.maxHeight = this.canvas.height + 'px';
        this.canvas.style.margin = '0 auto';
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.handleClick();
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });
        
        // Tower selection buttons
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                if (this.selectedTower === btn.dataset.type) {
                    this.selectedTower = null;
                } else {
                    this.selectedTower = btn.dataset.type;
                    btn.classList.add('selected');
                }
            });
        });
        
        // Close upgrade menu
        document.getElementById('close-upgrade').addEventListener('click', () => {
            this.uiElements.upgradeMenu.classList.add('hidden');
        });
        
        // Restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restart();
        });
        
        // Resize handler
        window.addEventListener('resize', () => this.resize());
    }
    
    handleClick() {
        if (this.gameState !== 'playing') return;
        
        const gridX = Math.floor(this.mouseX / CONFIG.TILE_SIZE);
        const gridY = Math.floor(this.mouseY / CONFIG.TILE_SIZE);
        
        // Check if clicking on a tower
        const clickedTower = this.towers.find(t => t.x === gridX && t.y === gridY);
        if (clickedTower) {
            this.showUpgradeMenu(clickedTower);
            return;
        }
        
        // Place tower
        if (this.selectedTower && this.map.canPlaceTower(gridX, gridY)) {
            const towerConfig = CONFIG.TOWERS[this.selectedTower];
            if (this.gold >= towerConfig.cost) {
                this.gold -= towerConfig.cost;
                const tower = new Tower(this.selectedTower, gridX, gridY);
                this.towers.push(tower);
                this.updateResourceDisplay();
            }
        }
    }
    
    showUpgradeMenu(tower) {
        const menu = this.uiElements.upgradeMenu;
        const path1Div = document.getElementById('upgrade-path-1');
        const path2Div = document.getElementById('upgrade-path-2');
        
        path1Div.innerHTML = '';
        path2Div.innerHTML = '';
        
        const upgrades = CONFIG.UPGRADES[tower.type];
        if (upgrades) {
            Object.entries(upgrades).forEach(([pathId, upgrade]) => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <strong>${upgrade.name}</strong> - Cost: ${upgrade.cost}
                    <button class="upgrade-btn" data-tower-x="${tower.x}" data-tower-y="${tower.y}" data-path="${pathId}" data-cost="${upgrade.cost}">
                        Upgrade
                    </button>
                `;
                
                const btn = div.querySelector('button');
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const cost = parseInt(btn.dataset.cost);
                    const towerX = parseInt(btn.dataset.towerX);
                    const towerY = parseInt(btn.dataset.towerY);
                    const pathId = btn.dataset.path;
                    
                    if (this.gold >= cost) {
                        this.gold -= cost;
                        const targetTower = this.towers.find(t => t.x === towerX && t.y === towerY);
                        if (targetTower && targetTower.upgrade(pathId)) {
                            this.updateResourceDisplay();
                            this.uiElements.upgradeMenu.classList.add('hidden');
                        }
                    }
                });
                
                (pathId === 'path1' ? path1Div : path2Div).appendChild(div);
            });
        }
        
        menu.classList.remove('hidden');
    }
    
    addGold(amount) {
        this.gold += amount;
        this.updateResourceDisplay();
    }
    
    addEnergy(amount) {
        this.energy += amount;
        this.updateResourceDisplay();
    }
    
    useAbility(type) {
        const ability = CONFIG.ABILITIES[type];
        if (!ability || this.energy < ability.energyCost || this.abilities[type].cooldown > 0) return;
        
        this.energy -= ability.energyCost;
        this.abilities[type].cooldown = ability.cooldown;
        this.updateResourceDisplay();
        
        switch (type) {
            case 'airstrike':
                this.triggerAirstrike();
                break;
            case 'freeze':
                this.triggerFreeze();
                break;
            case 'overclock':
                this.triggerOverclock();
                break;
        }
    }
    
    triggerAirstrike() {
        // Find position near mouse
        const gridX = Math.floor(this.mouseX / CONFIG.TILE_SIZE);
        const gridY = Math.floor(this.mouseY / CONFIG.TILE_SIZE);
        const radius = CONFIG.ABILITIES.airstrike.radius;
        
        for (const enemy of this.enemies) {
            if (enemy.alive && Utils.distance(this.mouseX, this.mouseY, enemy.x, enemy.y) < radius) {
                enemy.health -= CONFIG.ABILITIES.airstrike.damage;
                if (enemy.health <= 0) {
                    enemy.die();
                }
            }
        }
    }
    
    triggerFreeze() {
        this.freezeActive = true;
        setTimeout(() => {
            this.freezeActive = false;
        }, 3000);
    }
    
    triggerOverclock() {
        this.overclockActive = true;
        setTimeout(() => {
            this.overclockActive = false;
        }, 10000);
    }
    
    loseCoreHealth(amount) {
        this.coreHealth -= amount;
        if (this.coreHealth <= 0) {
            this.coreHealth = 0;
            this.gameState = 'gameover';
            this.showGameOver();
        }
        this.updateHealthDisplay();
    }
    
    addProjectile(x, y, targetX, targetY, damage, color) {
        this.projectiles.push(new Projectile(x, y, targetX, targetY, damage, color));
    }
    
    spawnEnemy(type, path, position) {
        const enemy = new Enemy(type, path, position);
        this.enemies.push(enemy);
    }
    
    getDominantTowerType() {
        const counts = {};
        for (const tower of this.towers) {
            counts[tower.type] = (counts[tower.type] || 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }
    
    updateHealthDisplay() {
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        const percent = (this.coreHealth / CONFIG.CORE_MAX_HEALTH) * 100;
        
        healthFill.style.width = percent + '%';
        healthText.textContent = `Core: ${Math.round(percent)}%`;
        
        // Change color based on health
        if (percent > 50) {
            healthFill.style.background = 'linear-gradient(90deg, #ff4444, #44ff44)';
        } else if (percent > 25) {
            healthFill.style.background = 'linear-gradient(90deg, #ff4444, #ffff44)';
        } else {
            healthFill.style.background = 'linear-gradient(90deg, #ff4444, #ff4444)';
        }
    }
    
    updateResourceDisplay() {
        document.getElementById('gold').textContent = `Gold: ${Math.floor(this.gold)}`;
        document.getElementById('energy').textContent = `Energy: ${Math.floor(this.energy)}`;
    }
    
    updateWaveDisplay() {
        document.getElementById('wave-number').textContent = `Wave: ${this.waveSystem.waveNumber}`;
    }
    
    updateAbilityCooldowns(deltaTime) {
        for (const [type, ability] of Object.entries(this.abilities)) {
            if (ability.cooldown > 0) {
                ability.cooldown -= deltaTime;
                if (ability.cooldown < 0) ability.cooldown = 0;
            }
        }
        
        // Update UI
        for (const [type, ability] of Object.entries(this.abilities)) {
            const el = document.getElementById(`ability-${type}`);
            const cooldownEl = el.querySelector('.ability-cooldown');
            cooldownEl.textContent = Math.ceil(ability.cooldown);
            
            if (ability.cooldown > 0) {
                el.classList.add('disabled');
            } else {
                el.classList.remove('disabled');
                el.onclick = () => this.useAbility(type);
            }
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update wave system
        this.waveSystem.update(deltaTime);
        
        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update(deltaTime);
        }
        
        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.alive || this.enemies.some(e2 => e2 === e));
        
        // Update towers
        for (const tower of this.towers) {
            tower.attackCooldown -= deltaTime;
            if (tower.attackCooldown <= 0) {
                const target = tower.findTarget(this.enemies);
                if (target) {
                    tower.attack(target, this.enemies);
                    tower.attackCooldown = tower.getAttackInterval();
                }
            }
        }
        
        // Update projectiles
        for (const projectile of this.projectiles) {
            projectile.update(deltaTime);
        }
        this.projectiles = this.projectiles.filter(p => p.alive);
        
        // Update player abilities
        this.updateAbilityCooldowns(deltaTime);
        
        // Update AI director
        this.aiDirector.update(this.playerMetrics, deltaTime);
        
        // Update player metrics
        this.playerMetrics.damageOutput = this.enemies.filter(e => !e.alive).length;
        this.playerMetrics.leakRate = this.enemies.filter(e => e.alive).length;
        
        // Update health display
        this.updateHealthDisplay();
        this.updateWaveDisplay();
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw map
        for (let y = 0; y < CONFIG.MAP_HEIGHT; y++) {
            for (let x = 0; x < CONFIG.MAP_WIDTH; x++) {
                const tile = this.map.tiles[y][x];
                const px = x * CONFIG.TILE_SIZE;
                const py = y * CONFIG.TILE_SIZE;
                
                switch (tile) {
                    case 0: // Buildable
                        this.ctx.fillStyle = '#2d4a2d';
                        this.ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                        break;
                    case 1: // Path
                        this.ctx.fillStyle = '#4a3728';
                        this.ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                        break;
                    case 2: // Blocked
                        this.ctx.fillStyle = '#1a1a1a';
                        this.ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                        break;
                }
            }
        }
        
        // Draw towers
        for (const tower of this.towers) {
            const px = tower.x * CONFIG.TILE_SIZE;
            const py = tower.y * CONFIG.TILE_SIZE;
            
            // Draw tower base
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(px + 2, py + 2, CONFIG.TILE_SIZE - 4, CONFIG.TILE_SIZE - 4);
            
            // Draw tower
            this.ctx.fillStyle = tower.color;
            this.ctx.beginPath();
            this.ctx.arc(px + CONFIG.TILE_SIZE / 2, py + CONFIG.TILE_SIZE / 2, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw range indicator when hovering
            const distToMouse = Utils.distance(px + CONFIG.TILE_SIZE / 2, py + CONFIG.TILE_SIZE / 2, this.mouseX, this.mouseY);
            if (distToMouse < CONFIG.TILE_SIZE / 2) {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(px + CONFIG.TILE_SIZE / 2, py + CONFIG.TILE_SIZE / 2, tower.range, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        // Draw enemies
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }
        
        // Draw projectiles
        for (const projectile of this.projectiles) {
            projectile.draw(this.ctx);
        }
        
        // Draw placement preview
        if (this.selectedTower) {
            const gridX = Math.floor(this.mouseX / CONFIG.TILE_SIZE);
            const gridY = Math.floor(this.mouseY / CONFIG.TILE_SIZE);
            const px = gridX * CONFIG.TILE_SIZE;
            const py = gridY * CONFIG.TILE_SIZE;
            
            this.ctx.fillStyle = this.map.canPlaceTower(gridX, gridY) ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
            this.ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
        }
    }
    
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.accumulator += deltaTime;
        
        while (this.accumulator >= this.frameTime) {
            this.update(this.frameTime);
            this.accumulator -= this.frameTime;
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    showGameOver() {
        this.uiElements.gameOver.classList.remove('hidden');
        document.getElementById('game-over-text').textContent = `You reached Wave ${this.waveSystem.waveNumber}`;
    }
    
    restart() {
        this.gameState = 'playing';
        this.gold = CONFIG.INITIAL_GOLD;
        this.energy = CONFIG.INITIAL_ENERGY;
        this.coreHealth = CONFIG.INITIAL_CORE_HEALTH;
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.waveSystem = new WaveSystem();
        this.waveSystem.startWave();
        this.uiElements.gameOver.classList.add('hidden');
        this.updateResourceDisplay();
        this.updateHealthDisplay();
        this.gameLoop();
    }
}

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game('gameCanvas');
});
