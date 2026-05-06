// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Game Engine
// ============================================================

'use strict';

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
    GRID_COLS: 20,
    GRID_ROWS: 14,
    CELL_SIZE: 40,
    FPS_TARGET: 60,
    INITIAL_GOLD: 250,
    INITIAL_ENERGY: 0,
    INITIAL_LIVES: 20,
    PASSIVE_INCOME: 10,
    ENERGY_PER_KILL: 2,
    SELL_REFUND: 0.6,

    TILE: { EMPTY: 0, PATH: 1, BLOCKED: 2, ENTRY: 3, EXIT: 4, TOWER: 5 },

    COLORS: {
        BG: '#0d0d1f',
        GRID_LINE: '#1a1a3a',
        PATH: '#1e1e3a',
        BLOCKED: '#2a1a1a',
        BUILDABLE: '#12122a',
        ENTRY: '#004d40',
        EXIT: '#b71c1c',
        RANGE_FILL: 'rgba(0,229,255,0.08)',
        RANGE_STROKE: 'rgba(0,229,255,0.25)',
    },

    TOWER_TYPES: {
        basic: {
            name: 'Basic Tower', cost: 50, damage: 15, speed: 1.0, range: 3,
            color: '#42a5f5', projectileColor: '#90caf9', projectileSpeed: 8,
            upgrades: [
                { name: 'Rapid Fire', cost: 40, desc: '+50% speed', apply: t => { t.speed *= 1.5; } },
                { name: 'Heavy Rounds', cost: 60, desc: '+100% damage', apply: t => { t.damage *= 2; } },
            ]
        },
        splash: {
            name: 'Splash Tower', cost: 100, damage: 20, speed: 0.6, range: 2.5,
            color: '#ef5350', projectileColor: '#ffcdd2', projectileSpeed: 6,
            splash: 1.2,
            upgrades: [
                { name: 'Poison AoE', cost: 75, desc: 'Poison on splash', apply: t => { t.statusEffect = 'poison'; } },
                { name: 'Explosion Chain', cost: 90, desc: '+80% splash radius', apply: t => { t.splash *= 1.8; } },
            ]
        },
        slow: {
            name: 'Slow Tower', cost: 75, damage: 5, speed: 0.8, range: 2.5,
            color: '#26c6da', projectileColor: '#b2ebf2', projectileSpeed: 7,
            statusEffect: 'slow',
            upgrades: [
                { name: 'Deep Freeze', cost: 60, desc: '+Stronger slow', apply: t => { t.slowPower = 0.6; } },
                { name: 'Shock Field', cost: 80, desc: '+Chain shock', apply: t => { t.statusEffect = 'shock'; } },
            ]
        },
        sniper: {
            name: 'Sniper Tower', cost: 125, damage: 80, speed: 0.3, range: 6,
            color: '#ab47bc', projectileColor: '#e1bee7', projectileSpeed: 14,
            upgrades: [
                { name: 'Armor Pierce', cost: 80, desc: 'Ignores armor', apply: t => { t.armorPierce = true; } },
                { name: 'Burn Shot', cost: 70, desc: '+Burn effect', apply: t => { t.statusEffect = 'burn'; } },
            ]
        },
        support: {
            name: 'Support Tower', cost: 150, damage: 0, speed: 0, range: 2.5,
            color: '#66bb6a', projectileColor: '#a5d6a7', projectileSpeed: 0,
            isSupport: true,
            upgrades: [
                { name: 'Power Boost', cost: 80, desc: '+30% nearby damage', apply: t => { t.supportDamageBoost = 0.3; } },
                { name: 'Speed Boost', cost: 80, desc: '+25% nearby speed', apply: t => { t.supportSpeedBoost = 0.25; } },
            ]
        },
    },

    ENEMY_TYPES: {
        basic: { name: 'Basic', hp: 35, speed: 1.5, armor: 0, reward: 8, color: '#e0e0e0', radius: 6 },
        tank: { name: 'Tank', hp: 250, speed: 0.8, armor: 3, reward: 20, color: '#8d6e63', radius: 9 },
        swarm: { name: 'Swarm', hp: 20, speed: 2.2, armor: 0, reward: 3, color: '#fff176', radius: 4 },
        flying: { name: 'Flying', hp: 50, speed: 1.8, armor: 0, reward: 8, color: '#80deea', radius: 5, flying: true },
        shielded: { name: 'Shielded', hp: 100, speed: 1.2, armor: 0, reward: 12, color: '#b39ddb', radius: 7, shield: 50 },
        adaptive: { name: 'Adaptive', hp: 120, speed: 1.3, armor: 1, reward: 20, color: '#ff8a65', radius: 7, adaptive: true },
    },

    ABILITIES: {
        airstrike: { name: 'Airstrike', energyCost: 50, cooldown: 15, radius: 2.5, damage: 200 },
        freeze: { name: 'Freeze', energyCost: 40, cooldown: 20, duration: 4 },
        overclock: { name: 'Overclock', energyCost: 30, cooldown: 25, duration: 6, boost: 2.0 },
    },

    STATUS_EFFECTS: {
        poison: { duration: 4, tickDamage: 3, tickInterval: 0.5, color: '#76ff03' },
        slow: { duration: 2.5, factor: 0.4, color: '#00e5ff' },
        burn: { duration: 3, tickDamage: 5, tickInterval: 0.3, stacking: true, color: '#ff9100' },
        shock: { duration: 1, chainRange: 1.5, chainDamage: 10, color: '#ffea00' },
        shieldBreak: { duration: 5, color: '#d500f9' },
    },
};

// ============================================================
// MAP DEFINITION
// ============================================================
const MAP_LAYOUT = (() => {
    const T = CONFIG.TILE;
    const cols = CONFIG.GRID_COLS;
    const rows = CONFIG.GRID_ROWS;
    const grid = [];
    for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
            grid[r][c] = T.EMPTY;
        }
    }

    // Define path - S-shaped through the grid
    const pathCells = [];
    const addPath = (r, c) => { grid[r][c] = T.PATH; pathCells.push({ r, c }); };

    // Path: left entry -> right -> down -> left -> down -> right -> exit
    for (let c = 0; c <= 17; c++) addPath(3, c);
    for (let r = 3; r <= 6; r++) addPath(r, 17);
    for (let c = 17; c >= 2; c--) addPath(6, c);
    for (let r = 6; r <= 10; r++) addPath(r, 2);
    for (let c = 2; c <= 19; c++) addPath(10, c);

    // Entry/Exit points (set AFTER path so they aren't overwritten)
    grid[3][0] = T.ENTRY;
    grid[10][cols - 1] = T.EXIT;

    // Add some blocked terrain
    const blocked = [[0, 5], [0, 6], [1, 5], [1, 6], [12, 8], [12, 9], [13, 8], [13, 9], [0, 14], [0, 15], [1, 14]];
    blocked.forEach(([r, c]) => { if (r < rows && c < cols) grid[r][c] = T.BLOCKED; });

    return grid;
})();

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
function dist(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }
function lerp(a, b, t) { return a + (b - a) * t; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return Math.random() * (max - min) + min; }
function cellCenter(col, row) {
    return { x: col * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2, y: row * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2 };
}
function pixelToGrid(px, py, offsetX, offsetY) {
    return { col: Math.floor((px - offsetX) / CONFIG.CELL_SIZE), row: Math.floor((py - offsetY) / CONFIG.CELL_SIZE) };
}

// ============================================================
// BINARY HEAP (min-heap for A*)
// ============================================================
class BinaryHeap {
    constructor(scoreFunc) {
        this.content = [];
        this.scoreFunc = scoreFunc;
    }

    get size() { return this.content.length; }

    push(element) {
        this.content.push(element);
        this._sinkDown(this.content.length - 1);
    }

    pop() {
        const first = this.content[0];
        const last = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = last;
            this._bubbleUp(0);
        }
        return first;
    }

    _sinkDown(n) {
        const element = this.content[n];
        const score = this.scoreFunc(element);
        while (n > 0) {
            const parentN = ((n + 1) >> 1) - 1;
            const parent = this.content[parentN];
            if (score >= this.scoreFunc(parent)) break;
            this.content[parentN] = element;
            this.content[n] = parent;
            n = parentN;
        }
    }

    _bubbleUp(n) {
        const length = this.content.length;
        const element = this.content[n];
        const score = this.scoreFunc(element);

        while (true) {
            const child2N = (n + 1) << 1;
            const child1N = child2N - 1;
            let swap = -1;
            let swapScore;

            if (child1N < length) {
                const child1Score = this.scoreFunc(this.content[child1N]);
                if (child1Score < score) { swap = child1N; swapScore = child1Score; }
            }
            if (child2N < length) {
                const child2Score = this.scoreFunc(this.content[child2N]);
                if (child2Score < (swap === -1 ? score : swapScore)) { swap = child2N; }
            }
            if (swap === -1) break;
            this.content[n] = this.content[swap];
            this.content[swap] = element;
            n = swap;
        }
    }
}

// ============================================================
// A* PATHFINDING
// ============================================================
class Pathfinder {
    constructor(grid, cols, rows) {
        this.grid = grid;
        this.cols = cols;
        this.rows = rows;
        this.cache = new Map();
    }

    clearCache() {
        this.cache.clear();
    }

    heuristic(a, b) {
        return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
    }

    getKey(start, end) {
        return `${start.row},${start.col}->${end.row},${end.col}`;
    }

    isWalkable(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return false;
        const t = this.grid[row][col];
        return t === CONFIG.TILE.PATH || t === CONFIG.TILE.ENTRY || t === CONFIG.TILE.EXIT;
    }

    findPath(start, end) {
        const key = this.getKey(start, end);
        if (this.cache.has(key)) return this.cache.get(key);

        const closedSet = new Set();
        const gScore = new Map();
        const cameFrom = new Map();

        const nodeKey = (r, c) => r * this.cols + c;
        const startKey = nodeKey(start.row, start.col);

        gScore.set(startKey, 0);
        const openSet = new BinaryHeap(n => n.f);
        openSet.push({ row: start.row, col: start.col, f: this.heuristic(start, end), key: startKey });

        const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        while (openSet.size > 0) {
            const current = openSet.pop();
            const curKey = current.key;

            if (current.row === end.row && current.col === end.col) {
                const path = [];
                let ck = curKey;
                while (ck !== undefined) {
                    const r = Math.floor(ck / this.cols);
                    const c = ck % this.cols;
                    path.unshift({ row: r, col: c });
                    ck = cameFrom.get(ck);
                }
                this.cache.set(key, path);
                return path;
            }

            if (closedSet.has(curKey)) continue;
            closedSet.add(curKey);

            for (const [dr, dc] of neighbors) {
                const nr = current.row + dr;
                const nc = current.col + dc;
                if (!this.isWalkable(nr, nc)) continue;
                const nk = nodeKey(nr, nc);
                if (closedSet.has(nk)) continue;

                const tentG = gScore.get(curKey) + 1;
                if (tentG < (gScore.get(nk) ?? Infinity)) {
                    cameFrom.set(nk, curKey);
                    gScore.set(nk, tentG);
                    const f = tentG + this.heuristic({ row: nr, col: nc }, end);
                    openSet.push({ row: nr, col: nc, f, key: nk });
                }
            }
        }

        return null; // No path found
    }

    findPathForFlying(start, end) {
        // Flying enemies go in a straight line
        const path = [];
        const steps = Math.max(Math.abs(end.col - start.col), Math.abs(end.row - start.row));
        for (let i = 0; i <= steps; i++) {
            const t = i / Math.max(steps, 1);
            path.push({
                row: Math.round(lerp(start.row, end.row, t)),
                col: Math.round(lerp(start.col, end.col, t)),
            });
        }
        return path;
    }
}

// ============================================================
// OBJECT POOL
// ============================================================
class ObjectPool {
    constructor(factory, reset) {
        this.factory = factory;
        this.reset = reset;
        this.pool = [];
    }

    get() {
        if (this.pool.length > 0) {
            const obj = this.pool.pop();
            this.reset(obj);
            return obj;
        }
        return this.factory();
    }

    release(obj) {
        this.pool.push(obj);
    }
}

// ============================================================
// STATUS EFFECT
// ============================================================
class StatusEffect {
    constructor(type, duration, data = {}) {
        this.type = type;
        this.duration = duration;
        this.elapsed = 0;
        this.tickTimer = 0;
        this.data = data;
        this.stacks = 1;
    }

    get expired() { return this.elapsed >= this.duration; }

    update(dt) {
        this.elapsed += dt;
        this.tickTimer += dt;
    }
}

// ============================================================
// ENEMY
// ============================================================
class Enemy {
    constructor() {
        this.active = false;
        this.reset();
    }

    reset() {
        this.x = 0; this.y = 0;
        this.hp = 0; this.maxHp = 0;
        this.speed = 0; this.baseSpeed = 0;
        this.armor = 0;
        this.reward = 0;
        this.color = '#fff';
        this.radius = 6;
        this.type = 'basic';
        this.flying = false;
        this.shield = 0; this.maxShield = 0;
        this.adaptive = false;
        this.resistances = {};
        this.path = null;
        this.pathIndex = 0;
        this.active = false;
        this.effects = [];
        this.distanceTravelled = 0;
    }

    init(type, path, entryPixel) {
        const cfg = CONFIG.ENEMY_TYPES[type];
        this.type = type;
        this.hp = cfg.hp;
        this.maxHp = cfg.hp;
        this.speed = cfg.speed;
        this.baseSpeed = cfg.speed;
        this.armor = cfg.armor;
        this.reward = cfg.reward;
        this.color = cfg.color;
        this.radius = cfg.radius;
        this.flying = cfg.flying || false;
        this.shield = cfg.shield || 0;
        this.maxShield = cfg.shield || 0;
        this.adaptive = cfg.adaptive || false;
        this.resistances = {};
        this.path = path;
        this.pathIndex = 0;
        this.effects = [];
        this.distanceTravelled = 0;
        this.active = true;
        if (entryPixel) {
            this.x = entryPixel.x;
            this.y = entryPixel.y;
        } else if (path && path.length > 0) {
            const start = cellCenter(path[0].col, path[0].row);
            this.x = start.x;
            this.y = start.y;
        }
    }

    applyEffect(type) {
        const cfg = CONFIG.STATUS_EFFECTS[type];
        if (!cfg) return;

        // Check adaptive resistance
        if (this.adaptive && this.resistances[type] && this.resistances[type] > 0.8) return;

        const existing = this.effects.find(e => e.type === type);
        if (existing && cfg.stacking) {
            existing.stacks++;
            existing.elapsed = 0;
        } else if (!existing) {
            this.effects.push(new StatusEffect(type, cfg.duration, { ...cfg }));
        } else {
            existing.elapsed = 0; // refresh
        }

        // Adaptive enemies build resistance
        if (this.adaptive) {
            this.resistances[type] = (this.resistances[type] || 0) + 0.15;
        }
    }

    takeDamage(amount, armorPierce = false) {
        let dmg = amount;
        if (!armorPierce && this.armor > 0) {
            dmg = Math.max(1, dmg - this.armor);
        }
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, dmg);
            this.shield -= absorbed;
            dmg -= absorbed;
        }
        this.hp -= dmg;
        return this.hp <= 0;
    }

    update(dt, offsetX, offsetY) {
        if (!this.active || !this.path) return;

        // Update status effects
        let speedMul = 1;
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const eff = this.effects[i];
            eff.update(dt);
            const cfg = CONFIG.STATUS_EFFECTS[eff.type];

            if (eff.type === 'slow') {
                speedMul *= (cfg.factor || 0.4);
            }
            if (eff.type === 'poison' && eff.tickTimer >= cfg.tickInterval) {
                eff.tickTimer = 0;
                this.hp -= cfg.tickDamage;
            }
            if (eff.type === 'burn' && eff.tickTimer >= cfg.tickInterval) {
                eff.tickTimer = 0;
                this.hp -= cfg.tickDamage * eff.stacks;
            }

            if (eff.expired) this.effects.splice(i, 1);
        }

        if (this.hp <= 0) { this.active = false; return; }

        // Move along path
        const currentSpeed = this.baseSpeed * speedMul * CONFIG.CELL_SIZE;
        if (this.pathIndex < this.path.length) {
            const target = cellCenter(this.path[this.pathIndex].col, this.path[this.pathIndex].row);
            const tx = target.x + offsetX;
            const ty = target.y + offsetY;
            const dx = tx - this.x;
            const dy = ty - this.y;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < currentSpeed * dt) {
                this.x = tx;
                this.y = ty;
                this.distanceTravelled += d;
                this.pathIndex++;
            } else {
                const move = currentSpeed * dt;
                this.x += (dx / d) * move;
                this.y += (dy / d) * move;
                this.distanceTravelled += move;
            }
        }
    }

    get reachedEnd() {
        return this.path && this.pathIndex >= this.path.length;
    }
}

// ============================================================
// PROJECTILE
// ============================================================
class Projectile {
    constructor() {
        this.active = false;
        this.reset();
    }

    reset() {
        this.x = 0; this.y = 0;
        this.targetId = -1;
        this.damage = 0;
        this.speed = 8;
        this.color = '#fff';
        this.splash = 0;
        this.statusEffect = null;
        this.armorPierce = false;
        this.slowPower = 0;
        this.active = false;
    }

    update(dt, enemies) {
        if (!this.active) return;
        const target = this._targetRef;
        if (!target || !target.active) {
            this.active = false;
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const move = this.speed * CONFIG.CELL_SIZE * dt;

        if (d < move + target.radius) {
            // Hit
            this.active = false;
            const killed = target.takeDamage(this.damage, this.armorPierce);
            if (this.statusEffect) {
                target.applyEffect(this.statusEffect);
            }

            // Splash damage
            if (this.splash > 0) {
                const splashPx = this.splash * CONFIG.CELL_SIZE;
                for (const e of enemies) {
                    if (!e.active || e === target) continue;
                    if (dist(target.x, target.y, e.x, e.y) < splashPx) {
                        e.takeDamage(this.damage * 0.5, false);
                        if (this.statusEffect) e.applyEffect(this.statusEffect);
                    }
                }
            }

            // Shock chain
            if (this.statusEffect === 'shock') {
                const shockCfg = CONFIG.STATUS_EFFECTS.shock;
                const chainPx = shockCfg.chainRange * CONFIG.CELL_SIZE;
                for (const e of enemies) {
                    if (!e.active || e === target) continue;
                    if (dist(target.x, target.y, e.x, e.y) < chainPx) {
                        e.takeDamage(shockCfg.chainDamage, false);
                        e.applyEffect('shock');
                    }
                }
            }
            return killed;
        }

        this.x += (dx / d) * move;
        this.y += (dy / d) * move;
        return false;
    }
}

// ============================================================
// TOWER
// ============================================================
class Tower {
    constructor(col, row, type) {
        const cfg = CONFIG.TOWER_TYPES[type];
        this.col = col;
        this.row = row;
        this.type = type;
        this.name = cfg.name;
        this.damage = cfg.damage;
        this.speed = cfg.speed;
        this.range = cfg.range;
        this.color = cfg.color;
        this.projectileColor = cfg.projectileColor;
        this.projectileSpeed = cfg.projectileSpeed;
        this.splash = cfg.splash || 0;
        this.statusEffect = cfg.statusEffect || null;
        this.armorPierce = cfg.armorPierce || false;
        this.slowPower = 0;
        this.isSupport = cfg.isSupport || false;
        this.supportDamageBoost = 0;
        this.supportSpeedBoost = 0;
        this.targeting = 'first'; // first, last, strongest, weakest
        this.cooldown = 0;
        this.totalCost = cfg.cost;
        this.upgradeLevel = 0;
        this.maxUpgrades = cfg.upgrades.length;
        this.overclockMul = 1;

        const center = cellCenter(col, row);
        this.x = center.x;
        this.y = center.y;
    }

    getUpgrade() {
        const cfg = CONFIG.TOWER_TYPES[this.type];
        if (this.upgradeLevel < cfg.upgrades.length) {
            return cfg.upgrades[this.upgradeLevel];
        }
        return null;
    }

    applyUpgrade() {
        const upgrade = this.getUpgrade();
        if (!upgrade) return false;
        upgrade.apply(this);
        this.totalCost += upgrade.cost;
        this.upgradeLevel++;
        return true;
    }

    findTarget(enemies, offsetX, offsetY) {
        const rangePx = this.range * CONFIG.CELL_SIZE;
        const px = this.x + offsetX;
        const py = this.y + offsetY;

        const inRange = enemies.filter(e =>
            e.active && dist(px, py, e.x, e.y) <= rangePx
        );

        if (inRange.length === 0) return null;

        switch (this.targeting) {
            case 'first':
                return inRange.reduce((a, b) => b.distanceTravelled > a.distanceTravelled ? b : a);
            case 'last':
                return inRange.reduce((a, b) => b.distanceTravelled < a.distanceTravelled ? b : a);
            case 'strongest':
                return inRange.reduce((a, b) => b.hp > a.hp ? b : a);
            case 'weakest':
                return inRange.reduce((a, b) => b.hp < a.hp ? b : a);
            default:
                return inRange[0];
        }
    }

    update(dt, enemies, projectilePool, activeProjectiles, offsetX, offsetY) {
        if (this.isSupport) return;

        this.cooldown -= dt;
        if (this.cooldown > 0) return;

        const target = this.findTarget(enemies, offsetX, offsetY);
        if (!target) return;

        this.cooldown = 1 / (this.speed * this.overclockMul);

        const proj = projectilePool.get();
        proj.x = this.x + offsetX;
        proj.y = this.y + offsetY;
        proj.damage = this.damage;
        proj.speed = this.projectileSpeed;
        proj.color = this.projectileColor;
        proj.splash = this.splash;
        proj.statusEffect = this.statusEffect;
        proj.armorPierce = this.armorPierce;
        proj.slowPower = this.slowPower;
        proj._targetRef = target;
        proj.active = true;
        activeProjectiles.push(proj);
    }
}

// ============================================================
// PARTICLE (for visual effects)
// ============================================================
class Particle {
    constructor() {
        this.active = false;
        this.reset();
    }

    reset() {
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.life = 0; this.maxLife = 1;
        this.color = '#fff';
        this.radius = 2;
        this.active = false;
    }

    update(dt) {
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life += dt;
        if (this.life >= this.maxLife) this.active = false;
    }
}

// ============================================================
// WAVE MANAGER
// ============================================================
class WaveManager {
    constructor() {
        this.waveNumber = 0;
        this.enemies = [];
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveActive = false;
        this.waveComplete = false;
        this._cachedWaveNum = -1;
        this._cachedWave = null;
    }

    generateWave(waveNum) {
        // Return cached wave if already generated for this wave number
        if (this._cachedWaveNum === waveNum && this._cachedWave) {
            return this._cachedWave.map(e => ({ ...e }));
        }

        this.waveNumber = waveNum;
        const queue = [];
        const difficulty = 1 + waveNum * 0.5 + (waveNum * waveNum) * 0.02;

        const isBoss = waveNum % 5 === 0 && waveNum > 0;
        const isMutation = waveNum % 7 === 0 && waveNum > 3;

        if (isBoss) {
            // Boss wave: tanks + adaptive
            const tankCount = Math.floor(2 + waveNum / 5);
            for (let i = 0; i < tankCount; i++) {
                queue.push({ type: 'tank', hpMul: 1 + waveNum * 0.3, delay: 1.5 });
            }
            if (waveNum >= 10) {
                queue.push({ type: 'adaptive', hpMul: 1 + waveNum * 0.4, delay: 2 });
            }
        } else {
            // Normal waves
            const baseCount = Math.floor(4 + difficulty * 1.5);

            // Determine composition
            const types = ['basic'];
            if (waveNum >= 2) types.push('swarm');
            if (waveNum >= 4) types.push('shielded');
            if (waveNum >= 5) types.push('flying');
            if (waveNum >= 7) types.push('tank');
            if (waveNum >= 10) types.push('adaptive');

            for (let i = 0; i < baseCount; i++) {
                const type = types[randInt(0, types.length - 1)];
                let count = 1;
                if (type === 'swarm') count = randInt(2, 3);

                const hpMul = 1 + (waveNum - 1) * 0.1;
                const delay = type === 'swarm' ? 0.3 : 0.8;

                for (let j = 0; j < count; j++) {
                    queue.push({ type, hpMul, delay });
                }
            }

            if (isMutation) {
                // Random mutation: boost all
                for (const e of queue) {
                    e.hpMul *= randFloat(1.2, 1.8);
                }
            }
        }

        this._cachedWaveNum = waveNum;
        this._cachedWave = queue.map(e => ({ ...e }));
        return queue;
    }

    invalidateCache() {
        this._cachedWaveNum = -1;
        this._cachedWave = null;
    }

    getWavePreview(waveNum) {
        const queue = this.generateWave(waveNum);
        const counts = {};
        for (const e of queue) {
            counts[e.type] = (counts[e.type] || 0) + 1;
        }
        return counts;
    }

    startWave(waveNum) {
        this.spawnQueue = this.generateWave(waveNum);
        this.spawnTimer = 0;
        this.waveActive = true;
        this.waveComplete = false;
        this.waveNumber = waveNum;
    }
}

// ============================================================
// AI DIRECTOR
// ============================================================
class AIDirector {
    constructor() {
        this.playerDps = 0;
        this.leakRate = 0;
        this.totalLeaked = 0;
        this.totalKilled = 0;
        this.wavesPlayed = 0;
        this.difficultyMod = 1.0;
        this.recentDamage = [];
    }

    recordKill() { this.totalKilled++; }
    recordLeak() { this.totalLeaked++; }

    update(dt) {
        // Calculate rolling DPS from recent damage
        const now = performance.now();
        this.recentDamage = this.recentDamage.filter(d => now - d.time < 5000);
        this.playerDps = this.recentDamage.reduce((s, d) => s + d.amount, 0) / 5;

        // Adjust difficulty
        if (this.totalKilled > 0) {
            this.leakRate = this.totalLeaked / (this.totalKilled + this.totalLeaked);
        }

        // Flow state targeting: 5-15% leak rate
        if (this.leakRate < 0.05) {
            this.difficultyMod = Math.min(2.0, this.difficultyMod + dt * 0.05);
        } else if (this.leakRate > 0.15) {
            this.difficultyMod = Math.max(0.5, this.difficultyMod - dt * 0.08);
        }
    }

    modifyWave(queue) {
        for (const e of queue) {
            e.hpMul *= this.difficultyMod;
        }
        // If player is too strong, add more enemies
        if (this.difficultyMod > 1.3) {
            const extra = Math.floor((this.difficultyMod - 1) * 5);
            for (let i = 0; i < extra; i++) {
                queue.push({ type: 'basic', hpMul: this.difficultyMod, delay: 0.6 });
            }
        }
        return queue;
    }
}

// ============================================================
// FLOATING TEXT
// ============================================================
class FloatingText {
    constructor(x, y, text, color = '#fff', duration = 1) {
        this.x = x; this.y = y;
        this.text = text; this.color = color;
        this.duration = duration;
        this.elapsed = 0;
        this.active = true;
    }

    update(dt) {
        this.elapsed += dt;
        this.y -= 30 * dt;
        if (this.elapsed >= this.duration) this.active = false;
    }
}

// ============================================================
// MAIN GAME CLASS
// ============================================================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game state
        this.state = 'menu'; // menu, playing, paused, gameover
        this.gold = CONFIG.INITIAL_GOLD;
        this.energy = CONFIG.INITIAL_ENERGY;
        this.lives = CONFIG.INITIAL_LIVES;
        this.maxLives = CONFIG.INITIAL_LIVES;
        this.wave = 0;
        this.totalKills = 0;
        this.gameSpeed = 1;
        this.selectedTowerType = null;
        this.selectedTower = null;

        // Grid
        this.grid = MAP_LAYOUT.map(row => [...row]);
        this.entryPoints = [];
        this.exitPoints = [];
        this.findEntryExitPoints();

        // Pathfinding
        this.pathfinder = new Pathfinder(this.grid, CONFIG.GRID_COLS, CONFIG.GRID_ROWS);

        // Precompute ground path
        this.groundPath = this.pathfinder.findPath(
            { row: this.entryPoints[0].row, col: this.entryPoints[0].col },
            { row: this.exitPoints[0].row, col: this.exitPoints[0].col }
        );
        this.flyingPath = this.pathfinder.findPathForFlying(
            { row: this.entryPoints[0].row, col: this.entryPoints[0].col },
            { row: this.exitPoints[0].row, col: this.exitPoints[0].col }
        );

        // Entities
        this.towers = [];
        this.enemies = [];
        this.projectiles = new ObjectPool(
            () => new Projectile(),
            p => p.reset()
        );
        this.activeProjectiles = [];
        this.particles = new ObjectPool(
            () => new Particle(),
            p => p.reset()
        );
        this.activeParticles = [];
        this.floatingTexts = [];

        // Systems
        this.waveManager = new WaveManager();
        this.aiDirector = new AIDirector();

        // Abilities
        this.abilityCooldowns = {
            airstrike: 0,
            freeze: 0,
            overclock: 0,
        };
        this.overclockActive = false;
        this.overclockTimer = 0;
        this.freezeActive = false;
        this.freezeTimer = 0;
        this.abilityTargeting = null; // 'airstrike' when placing

        // Rendering offsets
        this.offsetX = 0;
        this.offsetY = 0;

        // Timing
        this.lastTime = 0;

        // Input
        this.mouse = { x: 0, y: 0, gridCol: -1, gridRow: -1 };
        this.hoveredCell = null;

        // Init
        this.resize();
        this.bindEvents();
        this.checkSaveExists();
        this.loop(0);
    }

    findEntryExitPoints() {
        for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
            for (let c = 0; c < CONFIG.GRID_COLS; c++) {
                if (this.grid[r][c] === CONFIG.TILE.ENTRY) this.entryPoints.push({ row: r, col: c });
                if (this.grid[r][c] === CONFIG.TILE.EXIT) this.exitPoints.push({ row: r, col: c });
            }
        }
    }

    resize() {
        const hudH = 48;
        const panelH = 70;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - hudH - panelH;

        // Center grid
        const gridW = CONFIG.GRID_COLS * CONFIG.CELL_SIZE;
        const gridH = CONFIG.GRID_ROWS * CONFIG.CELL_SIZE;
        this.offsetX = Math.floor((this.canvas.width - gridW) / 2);
        this.offsetY = Math.floor((this.canvas.height - gridH) / 2);
    }

    // ---- EVENT BINDING ----
    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        // Menu buttons
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('continueBtn').addEventListener('click', () => this.loadGame());

        // Game buttons
        document.getElementById('startWaveBtn').addEventListener('click', () => this.startNextWave());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('speedBtn').addEventListener('click', () => this.cycleSpeed());
        document.getElementById('menuBtn').addEventListener('click', () => this.togglePause());

        // Pause overlay
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveGame());
        document.getElementById('quitBtn').addEventListener('click', () => this.quitToMenu());

        // Game over
        document.getElementById('retryBtn').addEventListener('click', () => this.newGame());
        document.getElementById('mainMenuBtn').addEventListener('click', () => this.quitToMenu());

        // Tower panel
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.tower;
                this.selectTowerType(type);
            });
        });

        // Ability buttons
        document.querySelectorAll('.ability-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ability = btn.dataset.ability;
                this.activateAbility(ability);
            });
        });

        // Tower info panel
        document.getElementById('infoClose').addEventListener('click', () => this.deselectTower());
        document.getElementById('infoTargeting').addEventListener('change', (e) => {
            if (this.selectedTower) this.selectedTower.targeting = e.target.value;
        });
        document.getElementById('sellBtn').addEventListener('click', () => this.sellSelectedTower());

        // Canvas events
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.cancelSelection();
        });

        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.cancelSelection();
            if (e.key === ' ' && this.state === 'playing') {
                e.preventDefault();
                if (!this.waveManager.waveActive) this.startNextWave();
            }
            if (e.key === 'p' || e.key === 'P') this.togglePause();
        });
    }

    // ---- GAME STATE ----
    newGame() {
        this.gold = CONFIG.INITIAL_GOLD;
        this.energy = CONFIG.INITIAL_ENERGY;
        this.lives = CONFIG.INITIAL_LIVES;
        this.wave = 0;
        this.totalKills = 0;
        this.gameSpeed = 1;
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.abilityTargeting = null;

        // Reset grid
        this.grid = MAP_LAYOUT.map(row => [...row]);
        this.pathfinder = new Pathfinder(this.grid, CONFIG.GRID_COLS, CONFIG.GRID_ROWS);
        this.groundPath = this.pathfinder.findPath(
            { row: this.entryPoints[0].row, col: this.entryPoints[0].col },
            { row: this.exitPoints[0].row, col: this.exitPoints[0].col }
        );

        this.towers = [];
        this.enemies = [];
        this.activeProjectiles = [];
        this.activeParticles = [];
        this.floatingTexts = [];

        this.waveManager = new WaveManager();
        this.aiDirector = new AIDirector();
        this.abilityCooldowns = { airstrike: 0, freeze: 0, overclock: 0 };
        this.overclockActive = false;
        this.freezeActive = false;

        this.setState('playing');
        this.updateUI();
        this.showWavePreview();
        document.getElementById('startWaveBtn').disabled = false;
    }

    setState(state) {
        this.state = state;
        document.getElementById('menuScreen').classList.toggle('hidden', state !== 'menu');
        document.getElementById('gameScreen').classList.toggle('hidden', state !== 'playing' && state !== 'paused');
        document.getElementById('gameOverScreen').classList.toggle('hidden', state !== 'gameover');
        document.getElementById('pauseOverlay').classList.toggle('hidden', state !== 'paused');

        if (state === 'gameover') {
            document.getElementById('finalWaves').textContent = this.wave;
            document.getElementById('finalKills').textContent = this.totalKills;
        }
    }

    togglePause() {
        if (this.state === 'playing') this.setState('paused');
        else if (this.state === 'paused') this.setState('playing');
    }

    cycleSpeed() {
        const speeds = [1, 2, 3];
        const idx = speeds.indexOf(this.gameSpeed);
        this.gameSpeed = speeds[(idx + 1) % speeds.length];
        document.getElementById('speedBtn').textContent = this.gameSpeed + 'x';
    }

    quitToMenu() {
        this.setState('menu');
        this.checkSaveExists();
    }

    // ---- INPUT ----
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        const g = pixelToGrid(this.mouse.x, this.mouse.y, this.offsetX, this.offsetY);
        this.mouse.gridCol = g.col;
        this.mouse.gridRow = g.row;
    }

    onCanvasClick(e) {
        if (this.state !== 'playing') return;

        const col = this.mouse.gridCol;
        const row = this.mouse.gridRow;

        // Airstrike targeting
        if (this.abilityTargeting === 'airstrike') {
            this.executeAirstrike(this.mouse.x, this.mouse.y);
            this.abilityTargeting = null;
            this.canvas.style.cursor = 'crosshair';
            return;
        }

        if (col < 0 || col >= CONFIG.GRID_COLS || row < 0 || row >= CONFIG.GRID_ROWS) {
            this.deselectTower();
            return;
        }

        // Check if clicking on existing tower
        const existingTower = this.towers.find(t => t.col === col && t.row === row);
        if (existingTower && !this.selectedTowerType) {
            this.selectTower(existingTower);
            return;
        }

        // Place tower
        if (this.selectedTowerType) {
            this.placeTower(col, row, this.selectedTowerType);
            return;
        }

        this.deselectTower();
    }

    cancelSelection() {
        this.selectedTowerType = null;
        this.abilityTargeting = null;
        this.canvas.style.cursor = 'crosshair';
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        this.deselectTower();
    }

    selectTowerType(type) {
        const cost = CONFIG.TOWER_TYPES[type].cost;
        if (this.gold < cost) return;

        this.abilityTargeting = null;
        this.deselectTower();

        if (this.selectedTowerType === type) {
            this.selectedTowerType = null;
            document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
            return;
        }

        this.selectedTowerType = type;
        document.querySelectorAll('.tower-btn').forEach(b => {
            b.classList.toggle('selected', b.dataset.tower === type);
        });
    }

    selectTower(tower) {
        this.selectedTower = tower;
        this.selectedTowerType = null;
        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
        this.showTowerInfo(tower);
    }

    deselectTower() {
        this.selectedTower = null;
        document.getElementById('towerInfo').classList.add('hidden');
    }

    // ---- TOWER MANAGEMENT ----
    canPlaceTower(col, row) {
        if (col < 0 || col >= CONFIG.GRID_COLS || row < 0 || row >= CONFIG.GRID_ROWS) return false;
        const tile = this.grid[row][col];
        return tile === CONFIG.TILE.EMPTY;
    }

    placeTower(col, row, type) {
        const cost = CONFIG.TOWER_TYPES[type].cost;
        if (this.gold < cost) return;
        if (!this.canPlaceTower(col, row)) return;

        this.gold -= cost;
        this.grid[row][col] = CONFIG.TILE.TOWER;
        const tower = new Tower(col, row, type);
        this.towers.push(tower);

        // Recalculate paths
        this.pathfinder.clearCache();
        this.pathfinder.grid = this.grid;
        this.groundPath = this.pathfinder.findPath(
            { row: this.entryPoints[0].row, col: this.entryPoints[0].col },
            { row: this.exitPoints[0].row, col: this.exitPoints[0].col }
        );

        // Update existing enemies' paths
        for (const enemy of this.enemies) {
            if (enemy.active && !enemy.flying) {
                const curCell = pixelToGrid(enemy.x, enemy.y, this.offsetX, this.offsetY);
                const newPath = this.pathfinder.findPath(
                    { row: clamp(curCell.row, 0, CONFIG.GRID_ROWS - 1), col: clamp(curCell.col, 0, CONFIG.GRID_COLS - 1) },
                    { row: this.exitPoints[0].row, col: this.exitPoints[0].col }
                );
                if (newPath) {
                    enemy.path = newPath;
                    enemy.pathIndex = 0;
                }
            }
        }

        this.updateUI();
        this.spawnParticles(tower.x + this.offsetX, tower.y + this.offsetY, tower.color, 8);
    }

    sellSelectedTower() {
        if (!this.selectedTower) return;
        const tower = this.selectedTower;
        const refund = Math.floor(tower.totalCost * CONFIG.SELL_REFUND);
        this.gold += refund;
        this.grid[tower.row][tower.col] = CONFIG.TILE.EMPTY;
        this.towers = this.towers.filter(t => t !== tower);

        // Recalc paths
        this.pathfinder.clearCache();
        this.pathfinder.grid = this.grid;
        this.groundPath = this.pathfinder.findPath(
            { row: this.entryPoints[0].row, col: this.entryPoints[0].col },
            { row: this.exitPoints[0].row, col: this.exitPoints[0].col }
        );

        this.floatingTexts.push(new FloatingText(
            tower.x + this.offsetX, tower.y + this.offsetY,
            `+${refund}g`, '#ffd740'
        ));

        this.deselectTower();
        this.updateUI();
    }

    showTowerInfo(tower) {
        document.getElementById('towerInfo').classList.remove('hidden');
        document.getElementById('infoName').textContent = tower.name + (tower.upgradeLevel > 0 ? ` ★${tower.upgradeLevel}` : '');
        document.getElementById('infoDamage').textContent = Math.round(tower.damage);
        document.getElementById('infoSpeed').textContent = tower.speed.toFixed(1);
        document.getElementById('infoRange').textContent = tower.range.toFixed(1);
        document.getElementById('infoTargeting').value = tower.targeting;

        // Upgrade buttons
        const container = document.getElementById('upgradeButtons');
        container.innerHTML = '';
        const upgrade = tower.getUpgrade();
        if (upgrade) {
            const btn = document.createElement('button');
            btn.className = 'upgrade-btn' + (this.gold < upgrade.cost ? ' disabled' : '');
            btn.textContent = `${upgrade.name} (${upgrade.cost}g) — ${upgrade.desc}`;
            btn.addEventListener('click', () => {
                if (this.gold >= upgrade.cost) {
                    this.gold -= upgrade.cost;
                    tower.applyUpgrade();
                    this.showTowerInfo(tower);
                    this.updateUI();
                }
            });
            container.appendChild(btn);
        } else {
            container.innerHTML = '<span style="color:#666;font-size:0.75rem">Max level</span>';
        }

        // Sell value
        const sellValue = Math.floor(tower.totalCost * CONFIG.SELL_REFUND);
        document.getElementById('sellBtn').textContent = `Sell (${sellValue}g)`;
    }

    // ---- WAVES ----
    startNextWave() {
        if (this.waveManager.waveActive) return;
        this.wave++;

        // Passive income
        this.gold += CONFIG.PASSIVE_INCOME * this.wave;

        let queue = this.waveManager.generateWave(this.wave);
        queue = this.aiDirector.modifyWave(queue);
        this.waveManager.spawnQueue = queue;
        this.waveManager.invalidateCache();
        this.waveManager.spawnTimer = 0;
        this.waveManager.waveActive = true;
        this.waveManager.waveComplete = false;

        document.getElementById('startWaveBtn').disabled = true;
        document.getElementById('wavePreview').classList.add('hidden');
        this.updateUI();
    }

    showWavePreview() {
        const preview = this.waveManager.getWavePreview(this.wave + 1);
        const container = document.getElementById('waveEnemies');
        container.innerHTML = '';
        for (const [type, count] of Object.entries(preview)) {
            const cfg = CONFIG.ENEMY_TYPES[type];
            const item = document.createElement('div');
            item.className = 'wave-enemy-item';
            item.innerHTML = `<div class="wave-enemy-icon" style="background:${cfg.color}"></div><span>${count}x ${cfg.name}</span>`;
            container.appendChild(item);
        }
        document.getElementById('wavePreview').classList.remove('hidden');
    }

    // ---- ABILITIES ----
    activateAbility(type) {
        if (this.state !== 'playing') return;
        const cfg = CONFIG.ABILITIES[type];
        if (this.energy < cfg.energyCost) return;
        if (this.abilityCooldowns[type] > 0) return;

        if (type === 'airstrike') {
            this.abilityTargeting = 'airstrike';
            this.canvas.style.cursor = 'pointer';
            return;
        }

        this.energy -= cfg.energyCost;
        this.abilityCooldowns[type] = cfg.cooldown;

        if (type === 'freeze') {
            this.freezeActive = true;
            this.freezeTimer = cfg.duration;
            for (const enemy of this.enemies) {
                if (enemy.active) enemy.applyEffect('slow');
            }
        }

        if (type === 'overclock') {
            this.overclockActive = true;
            this.overclockTimer = cfg.duration;
            for (const tower of this.towers) {
                tower.overclockMul = cfg.boost;
            }
        }

        this.updateUI();
    }

    executeAirstrike(px, py) {
        const cfg = CONFIG.ABILITIES.airstrike;
        if (this.energy < cfg.energyCost) return;

        this.energy -= cfg.energyCost;
        this.abilityCooldowns.airstrike = cfg.cooldown;

        const radiusPx = cfg.radius * CONFIG.CELL_SIZE;
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            if (dist(px, py, enemy.x, enemy.y) <= radiusPx) {
                const killed = enemy.takeDamage(cfg.damage, true);
                if (killed || enemy.hp <= 0) {
                    enemy.active = false;
                    this.onEnemyKilled(enemy);
                }
            }
        }

        // Visual
        this.spawnParticles(px, py, '#ff9100', 30);
        this.spawnParticles(px, py, '#ff1744', 20);
        this.updateUI();
    }

    // ---- UPDATE ----
    update(dt) {
        if (this.state !== 'playing') return;

        const gameDt = dt * this.gameSpeed;

        // Update ability cooldowns
        for (const key of Object.keys(this.abilityCooldowns)) {
            if (this.abilityCooldowns[key] > 0) {
                this.abilityCooldowns[key] = Math.max(0, this.abilityCooldowns[key] - gameDt);
            }
        }

        // Overclock timer
        if (this.overclockActive) {
            this.overclockTimer -= gameDt;
            if (this.overclockTimer <= 0) {
                this.overclockActive = false;
                for (const tower of this.towers) tower.overclockMul = 1;
            }
        }

        // Freeze timer
        if (this.freezeActive) {
            this.freezeTimer -= gameDt;
            if (this.freezeTimer <= 0) this.freezeActive = false;
        }

        // AI Director
        this.aiDirector.update(gameDt);

        // Spawn enemies
        if (this.waveManager.waveActive && this.waveManager.spawnQueue.length > 0) {
            this.waveManager.spawnTimer -= gameDt;
            if (this.waveManager.spawnTimer <= 0) {
                const spawn = this.waveManager.spawnQueue.shift();
                const enemy = new Enemy();
                const path = spawn.type === 'flying' ? [...this.flyingPath] : [...this.groundPath];
                const entry = cellCenter(this.entryPoints[0].col, this.entryPoints[0].row);
                enemy.init(spawn.type, path, { x: entry.x + this.offsetX, y: entry.y + this.offsetY });

                // Apply HP multiplier
                enemy.hp = Math.round(enemy.hp * spawn.hpMul);
                enemy.maxHp = enemy.hp;
                if (enemy.shield > 0) {
                    enemy.shield = Math.round(enemy.shield * spawn.hpMul);
                    enemy.maxShield = enemy.shield;
                }

                this.enemies.push(enemy);
                this.waveManager.spawnTimer = spawn.delay;
            }
        }

        // Support tower buffs — accumulate from multiple supports
        for (const tower of this.towers) {
            tower._supportDmgBuff = 0;
            tower._supportSpdBuff = 0;
        }
        for (const tower of this.towers) {
            if (!tower.isSupport) continue;
            const rangePx = tower.range * CONFIG.CELL_SIZE;
            for (const other of this.towers) {
                if (other === tower || other.isSupport) continue;
                const d = dist(tower.x, tower.y, other.x, other.y);
                if (d <= rangePx) {
                    if (tower.supportDamageBoost > 0) {
                        other._supportDmgBuff += tower.supportDamageBoost;
                    }
                    if (tower.supportSpeedBoost > 0) {
                        other._supportSpdBuff += tower.supportSpeedBoost;
                    }
                }
            }
        }

        // Update towers
        for (const tower of this.towers) {
            // Apply support buffs to effective stats
            let effectiveDamage = tower.damage * (1 + (tower._supportDmgBuff || 0));
            let effectiveSpeed = tower.speed * (1 + (tower._supportSpdBuff || 0));
            const origDamage = tower.damage;
            const origSpeed = tower.speed;
            tower.damage = effectiveDamage;
            tower.speed = effectiveSpeed;

            tower.update(gameDt, this.enemies, this.projectiles, this.activeProjectiles, this.offsetX, this.offsetY);

            tower.damage = origDamage;
            tower.speed = origSpeed;
            tower._supportDmgBuff = 0;
            tower._supportSpdBuff = 0;
        }

        // Update projectiles
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const proj = this.activeProjectiles[i];
            const killed = proj.update(gameDt, this.enemies);
            if (killed) {
                const target = proj._targetRef;
                if (target && !target.active) {
                    this.onEnemyKilled(target);
                }
            }
            if (!proj.active) {
                this.projectiles.release(proj);
                this.activeProjectiles.splice(i, 1);
            }
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy.active) continue;

            enemy.update(gameDt, this.offsetX, this.offsetY);

            if (!enemy.active) {
                // Killed by status effects
                this.onEnemyKilled(enemy);
                continue;
            }

            if (enemy.reachedEnd) {
                enemy.active = false;
                this.lives--;
                this.aiDirector.recordLeak();
                this.floatingTexts.push(new FloatingText(
                    enemy.x, enemy.y, '-1 ❤️', '#ff1744', 1.5
                ));
                if (this.lives <= 0) {
                    this.setState('gameover');
                    return;
                }
            }
        }

        // Clean up dead enemies
        this.enemies = this.enemies.filter(e => e.active);

        // Check wave complete
        if (this.waveManager.waveActive &&
            this.waveManager.spawnQueue.length === 0 &&
            this.enemies.length === 0) {
            this.waveManager.waveActive = false;
            document.getElementById('startWaveBtn').disabled = false;
            this.showWavePreview();
        }

        // Update particles
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            this.activeParticles[i].update(gameDt);
            if (!this.activeParticles[i].active) {
                this.particles.release(this.activeParticles[i]);
                this.activeParticles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update(gameDt);
            if (!this.floatingTexts[i].active) this.floatingTexts.splice(i, 1);
        }

        // Update ability cooldown UI
        this.updateAbilityCooldownUI();
        this.updateUI();
    }

    onEnemyKilled(enemy) {
        this.gold += enemy.reward;
        this.energy += CONFIG.ENERGY_PER_KILL;
        this.totalKills++;
        this.aiDirector.recordKill();
        this.aiDirector.recentDamage.push({ amount: enemy.maxHp, time: performance.now() });

        this.floatingTexts.push(new FloatingText(
            enemy.x, enemy.y, `+${enemy.reward}g`, '#ffd740'
        ));
        this.spawnParticles(enemy.x, enemy.y, enemy.color, 6);
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const p = this.particles.get();
            p.x = x;
            p.y = y;
            p.vx = randFloat(-80, 80);
            p.vy = randFloat(-80, 80);
            p.color = color;
            p.radius = randFloat(1, 3);
            p.maxLife = randFloat(0.3, 0.8);
            p.active = true;
            this.activeParticles.push(p);
        }
    }

    // ---- RENDERING ----
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = CONFIG.COLORS.BG;
        ctx.fillRect(0, 0, w, h);

        if (this.state === 'menu' || this.state === 'gameover') return;

        this.renderGrid(ctx);
        this.renderTowers(ctx);
        this.renderEnemies(ctx);
        this.renderProjectiles(ctx);
        this.renderParticles(ctx);
        this.renderFloatingTexts(ctx);
        this.renderPlacementPreview(ctx);
        this.renderSelectedTowerRange(ctx);
        this.renderAbilityTargeting(ctx);
    }

    renderGrid(ctx) {
        const cs = CONFIG.CELL_SIZE;
        const ox = this.offsetX;
        const oy = this.offsetY;

        for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
            for (let c = 0; c < CONFIG.GRID_COLS; c++) {
                const x = c * cs + ox;
                const y = r * cs + oy;
                const tile = this.grid[r][c];

                switch (tile) {
                    case CONFIG.TILE.EMPTY:
                        ctx.fillStyle = CONFIG.COLORS.BUILDABLE;
                        break;
                    case CONFIG.TILE.PATH:
                        ctx.fillStyle = CONFIG.COLORS.PATH;
                        break;
                    case CONFIG.TILE.BLOCKED:
                        ctx.fillStyle = CONFIG.COLORS.BLOCKED;
                        break;
                    case CONFIG.TILE.ENTRY:
                        ctx.fillStyle = CONFIG.COLORS.ENTRY;
                        break;
                    case CONFIG.TILE.EXIT:
                        ctx.fillStyle = CONFIG.COLORS.EXIT;
                        break;
                    case CONFIG.TILE.TOWER:
                        ctx.fillStyle = '#0e0e2a';
                        break;
                }

                ctx.fillRect(x, y, cs, cs);

                // Grid lines
                ctx.strokeStyle = CONFIG.COLORS.GRID_LINE;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, cs, cs);
            }
        }

        // Entry/Exit labels
        for (const ep of this.entryPoints) {
            const x = ep.col * cs + ox + cs / 2;
            const y = ep.row * cs + oy + cs / 2;
            ctx.fillStyle = '#00e676';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('IN', x, y);
        }
        for (const ep of this.exitPoints) {
            const x = ep.col * cs + ox + cs / 2;
            const y = ep.row * cs + oy + cs / 2;
            ctx.fillStyle = '#ff5252';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('OUT', x, y);
        }
    }

    renderTowers(ctx) {
        const cs = CONFIG.CELL_SIZE;
        const ox = this.offsetX;
        const oy = this.offsetY;

        for (const tower of this.towers) {
            const x = tower.col * cs + ox + cs / 2;
            const y = tower.row * cs + oy + cs / 2;
            const size = cs * 0.35;

            // Tower body
            ctx.fillStyle = tower.color;
            if (tower.isSupport) {
                // Diamond shape
                ctx.beginPath();
                ctx.moveTo(x, y - size);
                ctx.lineTo(x + size, y);
                ctx.lineTo(x, y + size);
                ctx.lineTo(x - size, y);
                ctx.closePath();
                ctx.fill();
            } else {
                // Square with rounded feel
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();

                // Inner circle
                ctx.fillStyle = '#0d0d1f';
                ctx.beginPath();
                ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
                ctx.fill();
            }

            // Upgrade stars
            if (tower.upgradeLevel > 0) {
                ctx.fillStyle = '#ffd740';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('★'.repeat(tower.upgradeLevel), x, y - size - 4);
            }

            // Support range indicator
            if (tower.isSupport) {
                ctx.strokeStyle = 'rgba(102, 187, 106, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y, tower.range * cs, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Overclock glow
            if (tower.overclockMul > 1) {
                ctx.strokeStyle = 'rgba(255, 215, 64, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, size + 4, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    renderEnemies(ctx) {
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;

            const x = enemy.x;
            const y = enemy.y;
            const r = enemy.radius;

            // Shadow for flying
            if (enemy.flying) {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(x + 3, y + 5, r, r * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Body
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(x, y - (enemy.flying ? 5 : 0), r, 0, Math.PI * 2);
            ctx.fill();

            // Shield
            if (enemy.shield > 0) {
                ctx.strokeStyle = '#b39ddb';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y - (enemy.flying ? 5 : 0), r + 3, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Adaptive indicator
            if (enemy.adaptive) {
                ctx.strokeStyle = '#ff8a65';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.arc(x, y, r + 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // HP bar
            const barW = r * 2.5;
            const barH = 3;
            const barX = x - barW / 2;
            const barY = y - r - 8 - (enemy.flying ? 5 : 0);
            const hpPct = enemy.hp / enemy.maxHp;

            ctx.fillStyle = '#1a1a3e';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
            ctx.fillRect(barX, barY, barW * hpPct, barH);

            // Shield bar
            if (enemy.maxShield > 0) {
                const shieldPct = enemy.shield / enemy.maxShield;
                ctx.fillStyle = 'rgba(179, 157, 219, 0.6)';
                ctx.fillRect(barX, barY - 3, barW * shieldPct, 2);
            }

            // Status effect indicators
            let effectY = barY - 6;
            for (const eff of enemy.effects) {
                const effCfg = CONFIG.STATUS_EFFECTS[eff.type];
                if (effCfg) {
                    ctx.fillStyle = effCfg.color;
                    ctx.beginPath();
                    ctx.arc(x - barW / 2 + enemy.effects.indexOf(eff) * 5, effectY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    renderProjectiles(ctx) {
        for (const proj of this.activeProjectiles) {
            if (!proj.active) continue;
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Trail
            ctx.fillStyle = proj.color + '44';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderParticles(ctx) {
        for (const p of this.activeParticles) {
            if (!p.active) continue;
            const alpha = 1 - p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    renderFloatingTexts(ctx) {
        for (const ft of this.floatingTexts) {
            if (!ft.active) continue;
            const alpha = 1 - ft.elapsed / ft.duration;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1;
    }

    renderPlacementPreview(ctx) {
        if (!this.selectedTowerType) return;

        const col = this.mouse.gridCol;
        const row = this.mouse.gridRow;
        if (col < 0 || col >= CONFIG.GRID_COLS || row < 0 || row >= CONFIG.GRID_ROWS) return;

        const cs = CONFIG.CELL_SIZE;
        const x = col * cs + this.offsetX;
        const y = row * cs + this.offsetY;
        const canPlace = this.canPlaceTower(col, row);

        // Highlight cell
        ctx.fillStyle = canPlace ? 'rgba(0,229,255,0.15)' : 'rgba(255,23,68,0.15)';
        ctx.fillRect(x, y, cs, cs);
        ctx.strokeStyle = canPlace ? 'rgba(0,229,255,0.6)' : 'rgba(255,23,68,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cs, cs);

        // Range preview
        if (canPlace) {
            const cfg = CONFIG.TOWER_TYPES[this.selectedTowerType];
            const rangePx = cfg.range * cs;
            const cx = x + cs / 2;
            const cy = y + cs / 2;
            ctx.fillStyle = CONFIG.COLORS.RANGE_FILL;
            ctx.beginPath();
            ctx.arc(cx, cy, rangePx, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = CONFIG.COLORS.RANGE_STROKE;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    renderSelectedTowerRange(ctx) {
        if (!this.selectedTower) return;
        const tower = this.selectedTower;
        const cs = CONFIG.CELL_SIZE;
        const x = tower.col * cs + this.offsetX + cs / 2;
        const y = tower.row * cs + this.offsetY + cs / 2;
        const rangePx = tower.range * cs;

        ctx.fillStyle = CONFIG.COLORS.RANGE_FILL;
        ctx.beginPath();
        ctx.arc(x, y, rangePx, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = CONFIG.COLORS.RANGE_STROKE;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Highlight cell
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(tower.col * cs + this.offsetX, tower.row * cs + this.offsetY, cs, cs);
    }

    renderAbilityTargeting(ctx) {
        if (this.abilityTargeting !== 'airstrike') return;
        const cfg = CONFIG.ABILITIES.airstrike;
        const radiusPx = cfg.radius * CONFIG.CELL_SIZE;

        ctx.fillStyle = 'rgba(255,145,0,0.12)';
        ctx.beginPath();
        ctx.arc(this.mouse.x, this.mouse.y, radiusPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,145,0,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosshair
        ctx.strokeStyle = 'rgba(255,23,68,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.mouse.x - 12, this.mouse.y);
        ctx.lineTo(this.mouse.x + 12, this.mouse.y);
        ctx.moveTo(this.mouse.x, this.mouse.y - 12);
        ctx.lineTo(this.mouse.x, this.mouse.y + 12);
        ctx.stroke();
    }

    // ---- UI ----
    updateUI() {
        document.getElementById('goldText').textContent = this.gold;
        document.getElementById('energyText').textContent = this.energy;
        document.getElementById('healthText').textContent = `${this.lives}/${this.maxLives}`;
        document.getElementById('healthFill').style.width = `${(this.lives / this.maxLives) * 100}%`;
        document.getElementById('waveText').textContent = `Wave ${this.wave}`;

        // Tower affordability
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const type = btn.dataset.tower;
            const cost = CONFIG.TOWER_TYPES[type].cost;
            btn.classList.toggle('disabled', this.gold < cost);
        });

        // Ability affordability
        document.querySelectorAll('.ability-btn').forEach(btn => {
            const type = btn.dataset.ability;
            const cfg = CONFIG.ABILITIES[type];
            const canUse = this.energy >= cfg.energyCost && this.abilityCooldowns[type] <= 0;
            btn.classList.toggle('disabled', !canUse);
        });
    }

    updateAbilityCooldownUI() {
        for (const key of Object.keys(this.abilityCooldowns)) {
            const cd = this.abilityCooldowns[key];
            const maxCd = CONFIG.ABILITIES[key].cooldown;
            const pct = cd > 0 ? (cd / maxCd) * 100 : 0;
            const el = document.getElementById(`${key}Cooldown`);
            if (el) el.style.height = `${pct}%`;
        }
    }

    // ---- SAVE/LOAD ----
    saveGame() {
        const data = {
            gold: this.gold,
            energy: this.energy,
            lives: this.lives,
            wave: this.wave,
            totalKills: this.totalKills,
            grid: this.grid,
            towers: this.towers.map(t => ({
                col: t.col, row: t.row, type: t.type,
                upgradeLevel: t.upgradeLevel, targeting: t.targeting,
                totalCost: t.totalCost,
            })),
            aiDirector: {
                totalKilled: this.aiDirector.totalKilled,
                totalLeaked: this.aiDirector.totalLeaked,
                difficultyMod: this.aiDirector.difficultyMod,
            },
        };
        try {
            localStorage.setItem('aegis_save', JSON.stringify(data));
            this.floatingTexts.push(new FloatingText(
                this.canvas.width / 2, this.canvas.height / 2,
                'Game Saved!', '#00e5ff', 1.5
            ));
        } catch (e) {
            // Storage might be full; silently fail
        }
    }

    loadGame() {
        try {
            const raw = localStorage.getItem('aegis_save');
            if (!raw) return;
            const data = JSON.parse(raw);

            this.gold = data.gold;
            this.energy = data.energy;
            this.lives = data.lives;
            this.wave = data.wave;
            this.totalKills = data.totalKills;
            this.grid = data.grid;
            this.gameSpeed = 1;

            // Rebuild pathfinder
            this.pathfinder = new Pathfinder(this.grid, CONFIG.GRID_COLS, CONFIG.GRID_ROWS);
            this.groundPath = this.pathfinder.findPath(
                { row: this.entryPoints[0].row, col: this.entryPoints[0].col },
                { row: this.exitPoints[0].row, col: this.exitPoints[0].col }
            );

            // Rebuild towers
            this.towers = [];
            for (const td of data.towers) {
                const tower = new Tower(td.col, td.row, td.type);
                tower.targeting = td.targeting;
                tower.totalCost = td.totalCost;
                for (let i = 0; i < td.upgradeLevel; i++) {
                    tower.applyUpgrade();
                }
                this.towers.push(tower);
            }

            // AI Director
            if (data.aiDirector) {
                this.aiDirector.totalKilled = data.aiDirector.totalKilled;
                this.aiDirector.totalLeaked = data.aiDirector.totalLeaked;
                this.aiDirector.difficultyMod = data.aiDirector.difficultyMod;
            }

            this.enemies = [];
            this.activeProjectiles = [];
            this.activeParticles = [];
            this.floatingTexts = [];
            this.waveManager = new WaveManager();
            this.abilityCooldowns = { airstrike: 0, freeze: 0, overclock: 0 };

            this.setState('playing');
            this.updateUI();
            this.showWavePreview();
        } catch (e) {
            // Invalid save; start fresh
            this.newGame();
        }
    }

    checkSaveExists() {
        const hasSave = localStorage.getItem('aegis_save') !== null;
        document.getElementById('continueBtn').classList.toggle('hidden', !hasSave);
    }

    // ---- GAME LOOP ----
    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
