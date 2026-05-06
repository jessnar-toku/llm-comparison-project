// Snake Game with WASD Controls

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const gridSize = 20;
const tileCount = canvas.width / gridSize;
const gameSpeed = 100; // milliseconds per frame

// Colors
const colors = {
    snakeHead: '#00ff88',
    snakeBody: '#00cc6a',
    food: '#ff6b6b',
    background: '#0a0a0a'
};

// Game state
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameInterval = null;
let isGameRunning = false;
let isGameOver = false;

// Initialize game
function initGame() {
    // Start snake in the middle
    const startX = Math.floor(tileCount / 2);
    const startY = Math.floor(tileCount / 2);
    
    snake = [
        {x: startX, y: startY},
        {x: startX - 1, y: startY},
        {x: startX - 2, y: startY}
    ];
    
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    isGameOver = false;
    
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('startScreen').classList.add('hidden');
    
    placeFood();
    drawGame();
    
    // Start the game loop immediately
    startGameLoop();
}

// Place food at random position not on snake
function placeFood() {
    let validPosition = false;
    
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        
        // Check if food is on snake body
        validPosition = !snake.some(segment => 
            segment.x === food.x && segment.y === food.y
        );
    }
}

// Draw the game
function drawGame() {
    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid (subtle)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // Draw food with glow effect
    ctx.shadowColor = colors.food;
    ctx.shadowBlur = 15;
    ctx.fillStyle = colors.food;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw snake
    snake.forEach((segment, index) => {
        const gradient = ctx.createLinearGradient(
            segment.x * gridSize,
            segment.y * gridSize,
            segment.x * gridSize + gridSize,
            segment.y * gridSize + gridSize
        );
        
        if (index === 0) {
            // Head
            gradient.addColorStop(0, colors.snakeHead);
            gradient.addColorStop(1, '#66ffcc');
            
            // Draw eyes based on direction
            ctx.fillStyle = '#fff';
            const eyeSize = gridSize / 8;
            const eyeOffsetX = gridSize / 4;
            const eyeOffsetY = gridSize / 4;
            
            if (direction === 'up') {
                drawEye(segment.x, segment.y - 1);
                drawEye(segment.x + 1, segment.y - 1);
            } else if (direction === 'down') {
                drawEye(segment.x, segment.y + 2);
                drawEye(segment.x + 1, segment.y + 2);
            } else if (direction === 'left') {
                drawEye(segment.x - 1, segment.y);
                drawEye(segment.x - 1, segment.y + 1);
            } else {
                drawEye(segment.x + 2, segment.y);
                drawEye(segment.x + 2, segment.y + 1);
            }
        } else {
            // Body segments with gradient
            const ratio = index / snake.length;
            gradient.addColorStop(0, colors.snakeBody);
            gradient.addColorStop(ratio * 0.5, '#66ffcc');
            gradient.addColorStop(1, colors.snakeBody);
        }
        
        ctx.fillStyle = gradient;
        // Rounded rectangle for snake body
        roundRect(ctx, 
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2,
            4
        );
        ctx.fill();
    });
}

// Draw eye on a snake segment
function drawEye(x, y) {
    const pupilSize = 2;
    const offset = 3;
    
    // Pupil (direction-dependent)
    if (direction === 'up') {
        ctx.fillStyle = '#000';
        ctx.fillRect(x * gridSize + offset - pupilSize/2, y * gridSize + offset - pupilSize/2, pupilSize, pupilSize);
        ctx.fillRect(x * gridSize + offset + 1 - pupilSize/2, y * gridSize + offset - pupilSize/2, pupilSize, pupilSize);
    } else if (direction === 'down') {
        ctx.fillStyle = '#000';
        ctx.fillRect(x * gridSize + offset - pupilSize/2, y * gridSize + offset + 1 - pupilSize/2, pupilSize, pupilSize);
        ctx.fillRect(x * gridSize + offset + 1 - pupilSize/2, y * gridSize + offset + 1 - pupilSize/2, pupilSize, pupilSize);
    } else if (direction === 'left') {
        ctx.fillStyle = '#000';
        ctx.fillRect(x * gridSize + offset - pupilSize/2, y * gridSize + offset - pupilSize/2, pupilSize, pupilSize);
        ctx.fillRect(x * gridSize + offset - pupilSize/2, y * gridSize + offset + 1 - pupilSize/2, pupilSize, pupilSize);
    } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(x * gridSize + offset - pupilSize/2, y * gridSize + offset - pupilSize/2, pupilSize, pupilSize);
        ctx.fillRect(x * gridSize + offset - pupilSize/2, y * gridSize + offset + 1 - pupilSize/2, pupilSize, pupilSize);
    }
}

// Draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Game loop
function gameLoop() {
    if (isGameOver) return;
    
    // Update direction from buffered input
    direction = nextDirection;
    
    // Calculate new head position
    const head = snake[0];
    let newX, newY;
    
    switch (direction) {
        case 'up':
            newY = head.y - 1;
            break;
        case 'down':
            newY = head.y + 1;
            break;
        case 'left':
            newX = head.x - 1;
            break;
        case 'right':
            newX = head.x + 1;
            break;
    }
    
    // Check wall collision
    if (newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount) {
        gameOver();
        return;
    }
    
    // Check self collision
    for (let i = 0; i < snake.length - 1; i++) {
        if (snake[i].x === newX && snake[i].y === newY) {
            gameOver();
            return;
        }
    }
    
    // Move snake (add new head)
    const newHead = { x: newX, y: newY };
    snake.unshift(newHead);
    
    // Check food collision
    if (newHead.x === food.x && newHead.y === food.y) {
        score += 10;
        document.getElementById('score').textContent = `Score: ${score}`;
        
        // Speed up slightly every 50 points
        if (score % 50 === 0 && gameSpeed > 40) {
            clearInterval(gameInterval);
            gameSpeed -= 5;
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        
        placeFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
    
    drawGame();
}

// Game over
function gameOver() {
    isGameOver = true;
    clearInterval(gameInterval);
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('overlayTitle').textContent = 'Game Over!';
    document.getElementById('overlay').classList.remove('hidden');
}

// Start game helper - calls init and starts the loop if needed
function startGameOnKey() {
    if (!isGameOver && !isGameRunning) {
        initGame();
        isGameRunning = true;
    }
}

// Restart game with arrow keys
function restartWithArrowKeys() {
    if (isGameOver) {
        initGame();
        isGameRunning = true;
    } else if (!isGameRunning) {
        initGame();
        isGameRunning = true;
        startGameLoop();
    }
}

// Start game loop
function startGameLoop() {
    clearInterval(gameInterval);
    gameSpeed = 100;
    gameInterval = setInterval(gameLoop, gameSpeed);
}

// Input handling - WASD controls
document.addEventListener('keydown', (e) => {
    // Prevent default for arrow keys and WASD to avoid scrolling
    const preventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    if (preventKeys.includes(e.code)) {
        e.preventDefault();
    }
    
    // Start game on any movement key press during start screen
    if (!isGameOver && !isGameRunning) {
        initGame();
    }
    
    switch (e.key.toLowerCase()) {
        case 'w':
            nextDirection = 'up';
            break;
        case 'a':
            nextDirection = 'left';
            break;
        case 's':
            nextDirection = 'down';
            break;
        case 'd':
            nextDirection = 'right';
            break;
        case 'arrowup':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'arrowleft':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'arrowdown':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'arrowright':
            if (direction !== 'left') nextDirection = 'right';
            break;
    }
});

// Restart button click handler
document.getElementById('restartBtn').addEventListener('click', () => {
    initGame();
});

// Prevent spacebar from scrolling
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') e.preventDefault();
});
