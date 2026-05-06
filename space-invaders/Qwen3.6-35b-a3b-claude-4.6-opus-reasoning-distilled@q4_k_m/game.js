/**
 * Space Invaders Game
 * Classic arcade game implemented with HTML5 Canvas
 */

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ENEMY_BULLET_SPEED = 3;
const PLAYER_BULLET_COOLDOWN = 300;
const ENEMY_BULLET_COOLDOWN = 2000;
const TOTAL_LEVELS = 10;
const ENEMIES_PER_LEVEL = 50;

// Colors
const PLAYER_COLOR = '#00ff00';
const BULLET_COLOR = '#ffff00';
const ENEMY_COLORS = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff'];
const BACKGROUND_COLOR = '#000000';
const STAR_COLOR = '#ffffff';

// Game State
let canvas, ctx;
let gameState = 'start'; // 'start', 'playing', 'gameOver', 'win'
let score = 0;
let lives = 3;
let level = 1;
let lastPlayerShot = 0;
let lastEnemyShot = 0;
let enemiesRemaining = 0;

// Game Objects
let player = null;
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let stars = [];

// Input State
let keys = {};

// ============================================
// INITIALIZATION
// ============================================

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Generate stars for background
    generateStars();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start render loop
    requestAnimationFrame(gameLoop);
}

function generateStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2 + 0.5,
            alpha: Math.random(),
            speed: Math.random() * 0.02 + 0.005
        });
    }
}

function setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        // Prevent scrolling with arrow keys and space
        if (['ArrowLeft', 'ArrowRight', 'Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
            e.preventDefault();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    // UI buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('win-restart-btn').addEventListener('click', restartGame);
}

// ============================================
// GAME CONTROL
// ============================================

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');
    
    score = 0;
    lives = 3;
    level = 1;
    gameState = 'playing';
    
    initLevel();
    updateUI();
}

function restartGame() {
    startGame();
}

function initLevel() {
    // Create player
    player = {
        x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
        y: CANVAS_HEIGHT - 60,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        color: PLAYER_COLOR
    };
    
    // Clear bullets
    playerBullets = [];
    enemyBullets = [];
    
    // Create enemies
    createEnemies();
    
    // Reset timers
    lastPlayerShot = 0;
    lastEnemyShot = 0;
    
    // Calculate enemies remaining for win condition
    enemiesRemaining = enemies.length;
}

function createEnemies() {
    enemies = [];
    const rows = 4;
    const cols = Math.min(11, 8 + Math.floor(level / 2));
    const enemyWidth = 32;
    const enemyHeight = 24;
    const padding = 15;
    const totalWidth = cols * (enemyWidth + padding);
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const startY = 80;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const enemy = {
                x: startX + col * (enemyWidth + padding),
                y: startY + row * (enemyHeight + padding),
                width: enemyWidth,
                height: enemyHeight,
                color: ENEMY_COLORS[row % ENEMY_COLORS.length],
                row: row,
                col: col,
                alive: true
            };
            enemies.push(enemy);
        }
    }
}

// ============================================
// GAME LOOP
// ============================================

let lastFrameTime = 0;

function gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Update based on state
    if (gameState === 'playing') {
        update(deltaTime);
    }
    
    // Always render
    render();
    
    requestAnimationFrame(gameLoop);
}

// ============================================
// UPDATE LOGIC
// ============================================

function update(deltaTime) {
    const now = Date.now();
    
    // Update player
    updatePlayer();
    
    // Update player shooting
    updatePlayerShooting(now);
    
    // Update enemies
    updateEnemies();
    
    // Update enemy shooting
    updateEnemyShooting(now);
    
    // Update bullets
    updateBullets();
    
    // Check collisions
    checkCollisions();
    
    // Check level complete
    checkLevelComplete();
    
    // Check game over
    checkGameOver();
    
    // Update UI
    updateUI();
}

function updatePlayer() {
    if (!player) return;
    
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x -= PLAYER_SPEED;
        if (player.x < 0) player.x = 0;
    }
    
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x += PLAYER_SPEED;
        if (player.x > CANVAS_WIDTH - player.width) {
            player.x = CANVAS_WIDTH - player.width;
        }
    }
}

function updatePlayerShooting(timestamp) {
    if (!player) return;
    
    if (keys['Space'] && timestamp - lastPlayerShot > PLAYER_BULLET_COOLDOWN) {
        playerBullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: BULLET_SPEED,
            color: BULLET_COLOR
        });
        lastPlayerShot = timestamp;
    }
}

function updateEnemies() {
    if (enemies.length === 0) return;
    
    // Find alive enemies
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0) return;
    
    // Calculate movement speed based on remaining enemies
    const speed = 0.5 + (1 - aliveEnemies.length / enemies.length) * 2;
    
    let shouldReverse = false;
    let maxY = 0;
    
    // Check boundaries for each alive enemy individually
    for (const enemy of aliveEnemies) {
        if (enemy.x + enemy.width >= CANVAS_WIDTH || enemy.x <= 0) {
            shouldReverse = true;
        }
        maxY = Math.max(maxY, enemy.y);
    }
    
    // Move enemies down if at bottom
    if (maxY >= CANVAS_HEIGHT - 150) {
        gameState = 'gameOver';
        showGameOver();
        return;
    }
    
    // Apply movement
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        
        enemy.direction = enemy.direction || 1;
        
        // Handle edge boundary: flip direction and move down, but don't move horizontally on this frame
        if (shouldReverse) {
            if (enemy.x + enemy.width >= CANVAS_WIDTH) {
                enemy.direction = -1;
                enemy.x = CANVAS_WIDTH - enemy.width;
            }
            if (enemy.x <= 0) {
                enemy.direction = 1;
                enemy.x = 0;
            }
            if (enemy.x + enemy.width >= CANVAS_WIDTH || enemy.x <= 0) {
                enemy.y += 10;
            }
        }
        
        enemy.x += enemy.direction * speed;
    }
}

function updateEnemyShooting(timestamp) {
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0) return;
    
    // Random enemy shoots
    if (timestamp - lastEnemyShot > ENEMY_BULLET_COOLDOWN - (level * 100)) {
        const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        enemyBullets.push({
            x: shooter.x + shooter.width / 2 - 2,
            y: shooter.y + shooter.height,
            width: 4,
            height: 10,
            speed: ENEMY_BULLET_SPEED,
            color: '#ff0000'
        });
        lastEnemyShot = timestamp;
    }
}

function updateBullets() {
    // Update player bullets (moving up)
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        playerBullets[i].y -= playerBullets[i].speed;
        if (playerBullets[i].y < 0) {
            playerBullets.splice(i, 1);
        }
    }
    
    // Update enemy bullets (moving down)
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        if (enemyBullets[i].y > CANVAS_HEIGHT) {
            enemyBullets.splice(i, 1);
        }
    }
}

// ============================================
// COLLISION DETECTION
// ============================================

function checkCollisions() {
    // Player bullets vs enemies
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            
            if (rectCollision(bullet, enemy)) {
                enemy.alive = false;
                playerBullets.splice(i, 1);
                score += 10 * (enemy.row + 1);
                break;
            }
        }
    }
    
    // Enemy bullets vs player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        if (rectCollision(bullet, player)) {
            enemyBullets.splice(i, 1);
            lives--;
            
            if (lives <= 0) {
                gameState = 'gameOver';
                showGameOver();
            }
            break;
        }
    }
}

function rectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// ============================================
// GAME STATE CHECKS
// ============================================

function checkLevelComplete() {
    const aliveCount = enemies.filter(e => e.alive).length;
    
    if (aliveCount === 0 && enemiesRemaining > 0) {
        if (level >= TOTAL_LEVELS) {
            gameState = 'win';
            showWin();
        } else {
            level++;
            enemiesRemaining = enemies.length;
            initLevel();
        }
    }
}

function checkGameOver() {
    if (lives <= 0) {
        gameState = 'gameOver';
        showGameOver();
    }
}

function showGameOver() {
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').textContent = 'Score: ' + score;
}

function showWin() {
    document.getElementById('win-screen').classList.remove('hidden');
    document.getElementById('win-score').textContent = 'Score: ' + score;
}

function updateUI() {
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
    document.getElementById('level').textContent = 'Level: ' + level;
}

// ============================================
// RENDERING
// ============================================

function render() {
    // Clear canvas
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw stars
    renderStars();
    
    // Draw game objects
    if (gameState === 'playing') {
        renderEnemies();
        renderPlayer();
        renderBullets();
    }
}

function renderStars() {
    for (const star of stars) {
        star.alpha += star.speed;
        if (star.alpha > 1) star.alpha = 0;
        if (star.alpha < 0.1) star.alpha = 0.1;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
}

function renderPlayer() {
    if (!player) return;
    
    // Draw ship body
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y + 5, player.width, player.height - 5);
    
    // Draw ship top (pointed shape)
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + 10);
    ctx.lineTo(player.x, player.y + 10);
    ctx.closePath();
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, 2);
    ctx.shadowBlur = 0;
}

function renderEnemies() {
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        
        // Draw alien body
        ctx.fillStyle = enemy.color;
        
        // Main body
        ctx.fillRect(enemy.x + 4, enemy.y + 4, enemy.width - 8, enemy.height - 8);
        
        // Arms
        ctx.fillRect(enemy.x, enemy.y + 8, enemy.width, 4);
        
        // Legs
        ctx.fillRect(enemy.x + 4, enemy.y + enemy.height - 4, 6, 4);
        ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + enemy.height - 4, 6, 4);
        
        // Eyes
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(enemy.x + 8, enemy.y + 8, 4, 4);
        ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + 8, 4, 4);
        
        // Glow effect
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 5;
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x + 4, enemy.y + 4, enemy.width - 8, 2);
        ctx.shadowBlur = 0;
    }
}

function renderBullets() {
    // Player bullets
    for (const bullet of playerBullets) {
        ctx.fillStyle = bullet.color;
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    }
    
    // Enemy bullets
    for (const bullet of enemyBullets) {
        ctx.fillStyle = bullet.color;
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    }
}

// ============================================
// START THE GAME
// ============================================

window.addEventListener('load', init);
