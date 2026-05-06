/**
 * Pong Game - Multi-Level AI Challenge
 * 
 * Features:
 * - Player paddle (left side) controlled by UP/WASD keys
 * - CPU paddle (right side) with 3 difficulty levels
 * - Easy (60% speed): CPU tracks ball but moves slowly and imperfectly
 * - Intermediate (80% speed): Better tracking, smaller prediction errors
 * - Hard (95% speed): Fast tracking, minimal reaction delay, near-perfect play
 */

// ==================== GAME CONSTANTS ====================
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

// Paddle settings
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 7;

// Ball settings  
const BALL_RADIUS = 10;
const BASE_BALL_SPEED = 6;
const MAX_BALL_SPEED = 14; // Cap speed to prevent unbeatable situations even in Hard mode

// Difficulty configurations (speed multiplier for CPU)
const DIFFICULTY = {
    easy:   { speedMultiplier: 0.6, errorMargin: 60, reactionDelay: 3 },
    intermediate: { speedMultiplier: 0.8, errorMargin: 40, reactionDelay: 2 },
    hard:   { speedMultiplier: 0.95, errorMargin: 15, reactionDelay: 1 }
};

// ==================== GAME STATE ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let gameRunning = false;
let animationId = null;

// Paddles and Ball objects
const player = {
    x: 30, // Left side
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: '#4ade80',
    score: 0
};

const cpu = {
    x: CANVAS_WIDTH - 30 - PADDLE_WIDTH, // Right side
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: '#f87171',
    score: 0
};

const ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    width: BALL_RADIUS * 2,
    height: BALL_RADIUS * 2,
    dx: BASE_BALL_SPEED, // Starting velocity
    dy: BASE_BALL_SPEED,
    speedMultiplier: 1.05, // Speed increases with each wall hit
    color: '#fbbf24'
};

// ==================== INPUT HANDLING ====================
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Prevent page scrolling when using arrow keys or WASD
    if (['ArrowUp', 'ArrowDown', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ==================== GAME LOGIC FUNCTIONS ====================

function resetBall() {
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    
    // Randomize direction - serve from loser's side or random
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    ball.dx = BASE_BALL_SPEED * direction;
    ball.dy = (Math.random() * 6 - 3) + BASE_BALL_SPEED * (direction > 0 ? 1 : -1); // Slight angle variation
    
    // Reset speed multiplier
    ball.speedMultiplier = 1.05;
}

function updatePlayerPosition() {
    // UP arrow or W key to move up
    if ((keys['ArrowUp'] || keys['w']) && player.y > PADDLE_HEIGHT / 2) {
        player.y -= PADDLE_SPEED;
    }
    
    // DOWN arrow or S key to move down
    if ((keys['ArrowDown'] || keys['s']) && player.y < CANVAS_HEIGHT - PADDLE_HEIGHT - PADDLE_HEIGHT / 2) {
        player.y += PADDLE_SPEED;
    }
}

function updateCPUPosition() {
    // Get current difficulty settings
    const difficulty = DIFFICULTY[document.getElementById('difficulty-select').value];
    
    // Calculate center positions for comparison
    const ballCenter = ball.y + BALL_RADIUS;
    const playerCenter = player.y + PADDLE_HEIGHT / 2;
    const cpuCenter = cpu.y + PADDLE_HEIGHT / 2;
    
    // Apply reaction delay (frames to react)
    if (!cpu.reactionTimer && Math.abs(ballCenter - cpuCenter) > 50) {
        cpu.reactionTimer = difficulty.reactionDelay;
    } else {
        cpu.reactionTimer--;
        
        // Only move when timer reaches zero
        if (cpu.reactionTimer <= 0) {
            // Calculate error based on difficulty (smaller = more accurate)
            const error = (Math.random() - 0.5) * difficulty.errorMargin;
            
            // FIX: Track ball position, not player paddle!
            // CPU should follow the ball's Y position with some intelligent positioning
            let targetY = ball.y + BALL_RADIUS; 
            
            // Apply strategic positioning based on where ball is heading (aim slightly ahead/behind)
            if (ball.dy > 0) {
                // Ball coming down - aim for top half of paddle for better control
                targetY -= 15;
            } else {
                // Ball going up - aim for bottom half  
                targetY += 15;
            }
            
            // Add difficulty-based error margin (makes CPU imperfect)
            const adjustedTarget = targetY + error;
            
            // Move CPU paddle toward the ball's position with smooth movement
            if (adjustedTarget > cpuCenter) {
                cpu.y += PADDLE_SPEED * difficulty.speedMultiplier;
            } else {
                cpu.y -= PADDLE_SPEED * difficulty.speedMultiplier;
            }
        }
    }
    
    // Keep CPU in bounds
    cpu.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, cpu.y));
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Wall collision (top/bottom)
    if (ball.y <= BALL_RADIUS || ball.y >= CANVAS_HEIGHT - BALL_RADIUS) {
        ball.dy *= -1;
        ball.speedMultiplier = Math.min(ball.speedMultiplier * 1.05, MAX_BALL_SPEED / BASE_BALL_SPEED);
    }
    
    // Player paddle collision (left side)
    if (ball.x <= player.x + PADDLE_WIDTH && 
        ball.y >= player.y && 
        ball.y <= player.y + PADDLE_HEIGHT) {
        
        // Calculate hit position within paddle for angle variation
        const hitPoint = ball.y - (player.y + PADDLE_HEIGHT / 2);
        const normalizedHit = hitPoint / (PADDLE_HEIGHT / 2);
        
        // Increase x velocity and add angle based on where ball hits paddle
        ball.dx = Math.abs(ball.dx) * ball.speedMultiplier;
        ball.dy = normalizedHit * 12;
    }
    
    // CPU paddle collision (right side)
    if (ball.x >= cpu.x && 
        ball.y >= cpu.y && 
        ball.y <= cpu.y + PADDLE_HEIGHT) {
        
        const hitPoint = ball.y - (cpu.y + PADDLE_HEIGHT / 2);
        const normalizedHit = hitPoint / (PADDLE_HEIGHT / 2);
        
        ball.dx *= -1 * ball.speedMultiplier;
        ball.dy = normalizedHit * 12;
    }
    
    // Check for scoring
    if (ball.x < 0) {
        cpu.score++;
        updateScore();
        resetBall();
    } else if (ball.x > CANVAS_WIDTH) {
        player.score++;
        updateScore();
        resetBall();
    }
}

function checkWinCondition() {
    // First to 10 wins, or first to 3 for quick matches
    const winScore = 10;
    
    if (player.score >= winScore || cpu.score >= winScore) {
        gameOver();
    } else if (!gameRunning && !modalVisible) {
            showGameOverModal(player.score > cpu.score);
        }
}

// ==================== RENDER FUNCTIONS ====================

function drawPaddle(paddle) {
    ctx.fillStyle = paddle.color;
    
    // Add glow effect for active paddle
    const activeGlow = gameRunning && (paddle === player ? '0 0 35px rgba(74, 222, 128, 0.9)' : '0 0 35px rgba(248, 113, 113, 0.9)');
    
    ctx.shadowColor = activeGlow ? activeGlow.split(' ').slice(0, 3).join(' ') : paddle.color;
    ctx.shadowBlur = activeGlow ? 35 : 20;
    
    // Rounded rectangle for modern look
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
    ctx.fill();
    
    ctx.shadowBlur = 0; // Reset shadow
    
    // Add inner highlight bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(paddle.x + 2, paddle.y + 10, paddle.width - 4, 15, 3);
    ctx.fill();
    
    ctx.fillStyle = paddle.color;
    ctx.beginPath();
    ctx.roundRect(paddle.x + 2, paddle.y + paddle.height - 25, paddle.width - 4, 15, 3);
    ctx.fill();
}

function drawBall() {
    ctx.fillStyle = ball.color;
    
    // Add glow to ball
    ctx.shadowColor = '#fef3c7';
    ctx.shadowBlur = 40;
    
    // Draw circular ball with gradient effect
    const centerX = ball.x + BALL_RADIUS;
    const centerY = ball.y + BALL_RADIUS;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, BALL_RADIUS * 0.3, centerX, centerY, BALL_RADIUS);
    gradient.addColorStop(0, '#fef3c7'); // Light center
    gradient.addColorStop(1, '#fbbf24'); // Darker edge
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function drawNet() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    for (let y = CANVAS_HEIGHT / 2; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2 - 5, y);
        ctx.lineTo(CANVAS_WIDTH / 2 + 5, y);
        ctx.stroke();
    }
    
    for (let y = CANVAS_HEIGHT / 2; y > 0; y -= 40) {
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2 - 5, y);
        ctx.lineTo(CANVAS_WIDTH / 2 + 5, y);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

function draw() {
    // Clear canvas with semi-transparent background for subtle trail effect
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw center net
    if (gameRunning || ball.x < CANVAS_WIDTH / 2 - PADDLE_WIDTH || ball.x > CANVAS_WIDTH / 2 + PADDLE_WIDTH) {
        drawNet();
    }
    
    // Draw paddles and ball
    drawPaddle(player);
    drawPaddle(cpu);
    drawBall();
}

// ==================== GAME CONTROL FUNCTIONS ====================

function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    
    // Reset scores
    player.score = 0;
    cpu.score = 0;
    updateScore();
    
    resetBall();
}

function pauseGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    document.getElementById('start-btn').textContent = 'Resume';
}

function resetGame() {
    showGameOverModal(false); // Show modal instead of pausing
    
    // Reset all game state
    player.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    cpu.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    resetBall();
    
    player.score = 0;
    cpu.score = 0;
    updateScore();
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    document.getElementById('player-final').textContent = player.score;
    document.getElementById('cpu-final').textContent = cpu.score;
    
    const winnerText = document.getElementById('winnerText');
    if (player.score > cpu.score) {
        winnerText.textContent = '🎉 YOU WIN!';
        winnerText.style.color = '#4ade80';
    } else if (cpu.score > player.score) {
        winnerText.textContent = '😤 CPU WINS!';
        winnerText.style.color = '#f87171';
    } else {
        winnerText.textContent = '🤝 IT\'S A DRAW!';
        winnerText.style.color = '#fbbf24';
    }
    
    // Show modal with game over screen
    document.getElementById('gameOverModal').classList.remove('hidden');
}

function showGameOverModal(winner) {
    if (!modalVisible) {
        modalVisible = true;
        
        const winnerText = document.getElementById('winnerText');
        if (player.score > cpu.score) {
            winnerText.textContent = '🎉 YOU WIN!';
            winnerText.style.color = '#4ade80';
        } else if (cpu.score > player.score) {
            winnerText.textContent = '😤 CPU WINS!';
            winnerText.style.color = '#f87171';
        } else {
            winnerText.textContent = '🤝 IT\'S A DRAW!';
            winnerText.style.color = '#fbbf24';
        }
        
        document.getElementById('gameOverModal').classList.remove('hidden');
    }
}

function changeDifficulty() {
    // Reset and start with new difficulty
    resetGame();
}

// ==================== UPDATE SCORE DISPLAY ====================
function updateScore() {
    document.getElementById('player-score').textContent = player.score;
    document.getElementById('cpu-score').textContent = cpu.score;
    
    const playerEl = document.getElementById('player-score');
    const cpuEl = document.getElementById('cpu-score');
    
    // Animate score changes
    if (player.score > 0 || cpu.score > 0) {
        playerEl.style.transform = 'scale(1.3)';
        cpuEl.style.transform = 'scale(1.3)';
        
        setTimeout(() => {
            playerEl.style.transform = '';
            cpuEl.style.transform = '';
        }, 200);
    }
}

// ==================== MAIN GAME LOOP ====================

function gameLoop() {
    if (!gameRunning) return;
    
    // Update game state
    updatePlayerPosition();
    updateCPUPosition();
    updateBall();
    
    draw();
    
    animationId = requestAnimationFrame(gameLoop);
}

// ==================== EVENT LISTENERS ====================

document.getElementById('start-btn').addEventListener('click', () => {
    if (gameRunning) {
        pauseGame();
    } else {
        startGame();
        
        // Only start loop on "Start Game" click to allow multiple difficulty changes
        gameLoop();
    }
});

document.getElementById('difficulty-select').addEventListener('change', () => {
    if (gameRunning) {
        pauseGame();
        document.getElementById('start-btn').textContent = 'Resume';
    }
});

// ==================== INITIALIZATION ====================

function init() {
    // Reset positions on load
    player.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    cpu.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    
    // Draw initial state with ball in center
    resetBall();
    draw();
}

init();
