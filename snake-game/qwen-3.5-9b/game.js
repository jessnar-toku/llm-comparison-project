// Game constants
const CANVAS_SIZE = 600;
const CELL_SIZE = 20;
const GAME_SPEED = 100;

// Game state variables - using var so they're available globally and initialized immediately
var canvas, ctx, snake = [], food = {};
var direction = { x: 1, y: 0 };
var nextDirection = { x: 1, y: 0 };
var score = 0, highScore = localStorage.getItem('snakeHighScore') || 0;
var gameInterval = null, isGameRunning = false;

// DOM element references (will be set in DOMContentLoaded)
var scoreElement, highScoreElement, startButton;

// Get DOM elements and initialize UI
function getElements() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return null;
    
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    highScoreElement = document.getElementById('highScore');
    startButton = document.getElementById('startBtn');
    
    // Set canvas display size
    canvas.style.width = CANVAS_SIZE + 'px';
    canvas.style.height = (CELL_SIZE * 20) + 'px';
    
    // Initialize UI text
    scoreElement.textContent = '0';
    highScoreElement.textContent = highScore;
    startButton.textContent = 'Start Game';
    startButton.onclick = startGame;
    
    return true;
}

// Main initialization - runs when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (!getElements()) return;
    initGame();
});

// Start the game
function startGame() {
    if (isGameRunning) {
        // Restart - reset game state and clear old interval
        initGame();
        isGameRunning = true;
        
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, GAME_SPEED);
        
        startButton.textContent = 'Restart';
    }
}

// Initialize/reset game state
function initGame() {
    // Snake starts visible in upper-left area
    snake = [
        { x: CELL_SIZE, y: CELL_SIZE },      // head at position (1,1)
        { x: 0, y: CELL_SIZE },              // body segment
        { x: -CELL_SIZE, y: CELL_SIZE }      // another body segment
    ];
    
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreElement.textContent = '0';
    
    spawnFood();
}

// Game loop
function gameLoop() {
    if (!isGameRunning) return;
    update();
    draw();
}

// Update game state
function update() {
    direction = { ...nextDirection };
    
    const head = {
        x: snake[0].x + direction.x * CELL_SIZE,
        y: snake[0].y + direction.y * CELL_SIZE
    };
    
    // Wall collision (game over)
    if (head.x < 0 || head.x >= CANVAS_SIZE || head.y < 0 || head.y >= CANVAS_SIZE) {
        gameOver();
        return;
    }
    
    // Self collision (game over)
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check if food eaten
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        spawnFood();
    } else {
        snake.pop();
    }
}

// Draw everything on canvas
function draw() {
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_SIZE; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_SIZE);
        ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_SIZE; y += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_SIZE, y);
        ctx.stroke();
    }
    
    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        
        if (i === 0) {
            ctx.fillStyle = '#00ff88';
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = '#00cc6a';
            ctx.shadowBlur = 0;
        }
        
        const padding = 2;
        ctx.fillRect(segment.x + padding, segment.y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2);
    }
    
    ctx.shadowBlur = 0;
    
    // Draw food
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 10;
    
    const fx = food.x + CELL_SIZE / 2;
    const fy = food.y + CELL_SIZE / 2;
    const radius = (CELL_SIZE / 2) - 3;
    
    ctx.beginPath();
    ctx.arc(fx, fy, radius, 0, Math.PI * 2);
    ctx.fill();
}

// Spawn food
function spawnFood() {
    const positions = [];
    
    for (let x = CELL_SIZE; x < CANVAS_SIZE; x += CELL_SIZE) {
        for (let y = CELL_SIZE; y < CANVAS_SIZE; y += CELL_SIZE) {
            if (!snake.some(s => s.x === x && s.y === y)) {
                positions.push({ x, y });
            }
        }
    }
    
    if (positions.length > 0) {
        food = positions[Math.floor(Math.random() * positions.length)];
    } else {
        gameOver();
    }
}

// Game over handler
function gameOver() {
    isGameRunning = false;
    
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 10;
    ctx.fillText('GAME OVER', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30);
    
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText('Score: ' + score, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);
    ctx.fillText('Press button to restart', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 45);
    
    startButton.textContent = 'Play Again';
}

// WASD keyboard controls
document.addEventListener('keydown', function(e) {
    if (!isGameRunning) return;
    
    const key = e.key.toLowerCase();
    
    switch (key) {
        case 'w':
            if (direction.y !== 0) break;
            nextDirection = { x: 0, y: -1 };
            e.preventDefault();
            break;
        case 's':
            if (direction.y !== 0) break;
            nextDirection = { x: 0, y: 1 };
            e.preventDefault();
            break;
        case 'a':
            if (direction.x !== 0) break;
            nextDirection = { x: -1, y: 0 };
            e.preventDefault();
            break;
        case 'd':
            if (direction.x !== 0) break;
            nextDirection = { x: 1, y: 0 };
            e.preventDefault();
            break;
    }
});
