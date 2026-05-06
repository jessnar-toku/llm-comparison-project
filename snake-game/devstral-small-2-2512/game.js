// Snake Game with WASD Controls

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');

// Game variables
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
    {x: tileCount / 2, y: tileCount / 2}
];

let food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};

let direction = {x: 0, y: 0};
let nextDirection = {x: 0, y: 0};

let score = 0;
let gameSpeed = 150; // milliseconds per move
let gameLoop;

// WASD Controls
function handleKeyPress(event) {
    switch(event.key.toLowerCase()) {
        case 'w': // Up
            if (direction.y === 0) nextDirection = {x: 0, y: -1};
            break;
        case 'a': // Left
            if (direction.x === 0) nextDirection = {x: -1, y: 0};
            break;
        case 's': // Down
            if (direction.y === 0) nextDirection = {x: 0, y: 1};
            break;
        case 'd': // Right
            if (direction.x === 0) nextDirection = {x: 1, y: 0};
            break;
    }
}

// Update snake position based on direction
function updateSnake() {
    // Apply the next direction and reset it for next frame
    direction = {...nextDirection};
    
    // Calculate new head position
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };
    
    // Wrap around screen edges
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;
    
    // Check if snake ate food
    const ateFood = head.x === food.x && head.y === food.y;
    
    // Move snake
    if (ateFood) {
        // Keep head and add new segment
        snake.unshift(head);
    } else {
        // Move body by removing tail and adding new head
        snake.unshift(head);
        snake.pop();
    }
    
    return ateFood;
}

// Spawn new food
function spawnFood() {
    let validPosition = false;
    
    while (!validPosition) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
        
        // Make sure food doesn't appear on snake
        validPosition = true;
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                validPosition = false;
                break;
            }
        }
    }
}

// Check if snake collided with itself
function checkCollision() {
    const head = snake[0];
    // Check body collision (skip first segment which is the head)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    return false;
}

// Draw everything
function draw() {
    // Clear canvas with background color
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw food
    ctx.fillStyle = '#FF5722';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    
    // Draw snake
    ctx.fillStyle = '#8BC34A';
    for (let segment of snake) {
        ctx.beginPath();
        ctx.arc(
            segment.x * gridSize + gridSize / 2,
            segment.y * gridSize + gridSize / 2,
            gridSize / 2 - 1,
            0, Math.PI * 2
        );
        ctx.fill();
    }
}

// Main game loop
function gameStep() {
    // Update direction first (before movement)
    const ateFood = updateSnake();
    
    // Check collision
    if (checkCollision()) {
        clearInterval(gameLoop);
        alert(`Game Over! Your score: ${score}`);
        resetGame();
        return;
    }
    
    // If ate food, spawn new food and increase score
    if (ateFood) {
        spawnFood();
        score += 10;
        scoreElement.textContent = score;
        
        // Increase speed slightly every 50 points
        if (score % 50 === 0) {
            gameSpeed = Math.max(80, gameSpeed - 10);
        }
    }
    
    // Draw everything on canvas
    draw();
}

// Reset game to initial state
function resetGame() {
    snake = [
        {x: tileCount / 2, y: tileCount / 2}
    ];
    direction = {x: 0, y: 0};
    nextDirection = {x: 0, y: 0};
    score = 0;
    scoreElement.textContent = score;
    gameSpeed = 150;
    spawnFood();
}

// Event listeners for WASD controls
document.addEventListener('keydown', handleKeyPress);

// Initialize game
spawnFood();
gameLoop = setInterval(gameStep, gameSpeed);

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    clearInterval(gameLoop);
});  