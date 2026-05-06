// ========================================
// Snake Game - Core Game Logic
// ========================================

(function() {
    'use strict';

    // DOM Elements
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('scoreValue');

    // Game Constants
    const GRID_SIZE = 20;
    const TILE_COUNT = canvas.width / GRID_SIZE; // 20x20 grid
    const GAME_SPEED = 150; // milliseconds per tick

    // Game State
    let snake = [];
    let food = {};
    let direction = { x: 0, y: 0 };
    let nextDirection = { x: 0, y: 0 };
    let score = 0;
    let gameLoopInterval = null;

    // ========================================
    // Initialization Functions
    // ========================================

    /**
     * Initialize the snake at center of canvas with length 3
     */
    function initializeSnake() {
        const centerX = Math.floor(TILE_COUNT / 2);
        const centerY = Math.floor(TILE_COUNT / 2);
        
        // Create snake with 3 segments, extending to the left
        snake = [
            { x: centerX, y: centerY },           // Head (center)
            { x: centerX - 1, y: centerY },       // Body segment
            { x: centerX - 2, y: centerY }        // Tail
        ];
    }

    /**
     * Spawn food at a random position not occupied by snake
     */
    function spawnFood() {
        let validPosition = false;
        
        while (!validPosition) {
            food.x = Math.floor(Math.random() * TILE_COUNT);
            food.y = Math.floor(Math.random() * TILE_COUNT);
            
            // Ensure food doesn't spawn on snake body
            validPosition = true;
            for (const segment of snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    validPosition = false;
                    break;
                }
            }
        }
    }

    /**
     * Reset all game state to initial values
     */
    function resetGame() {
        // Start snake moving right by default
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        score = 0;
        scoreElement.textContent = '0';
        
        if (gameLoopInterval) {
            clearInterval(gameLoopInterval);
            gameLoopInterval = null;
        }
    }

    /**
     * Start a new game with full initialization
     */
    function startGame() {
        resetGame();
        initializeSnake();
        spawnFood();
        
        // Start the game loop
        gameLoopInterval = setInterval(gameLoop, GAME_SPEED);
        
        // Ensure canvas has focus for keyboard input
        canvas.focus();
    }

    // ========================================
    // Input Handling (WASD Controls)
    // ========================================

    /**
     * Handle keyboard input for snake movement
     * W = Up, A = Left, S = Down, D = Right
     */
    function handleKeyPress(event) {
        const key = event.key.toLowerCase();
        
        switch (key) {
            case 'w': // Move UP
                if (direction.y === 0) { // Can only change direction if not already moving vertically
                    nextDirection = { x: 0, y: -1 };
                }
                break;
                
            case 'a': // Move LEFT
                if (direction.x === 0) { // Can only change direction if not already moving horizontally
                    nextDirection = { x: -1, y: 0 };
                }
                break;
                
            case 's': // Move DOWN
                if (direction.y === 0) {
                    nextDirection = { x: 0, y: 1 };
                }
                break;
                
            case 'd': // Move RIGHT
                if (direction.x === 0) {
                    nextDirection = { x: 1, y: 0 };
                }
                break;
        }
    }

    // ========================================
    // Game Logic Functions
    // ========================================

    /**
     * Update snake position based on current direction
     * @returns {boolean} True if food was eaten, false otherwise
     */
    function updateSnake() {
        // Apply the buffered direction (handles rapid key presses)
        direction = { ...nextDirection };
        
        // Calculate new head position based on direction
        const head = {
            x: snake[0].x + direction.x,
            y: snake[0].y + direction.y
        };
        
        // Wrap around screen edges (toroidal topology)
        if (head.x < 0) head.x = TILE_COUNT - 1;
        if (head.x >= TILE_COUNT) head.x = 0;
        if (head.y < 0) head.y = TILE_COUNT - 1;
        if (head.y >= TILE_COUNT) head.y = 0;
        
        // Check if snake ate food
        const ateFood = (head.x === food.x && head.y === food.y);
        
        // Move the snake
        if (ateFood) {
            // Keep all segments including new head (snake grows)
            snake.unshift(head);
        } else {
            // Remove tail segment, add new head
            snake.unshift(head);
            snake.pop();
        }
        
        return ateFood;
    }

    /**
     * Check if snake collided with itself
     * @returns {boolean} True if collision detected, false otherwise
     */
    function checkCollision() {
        const head = snake[0];
        
        // Check body segments (skip index 0 which is the head)
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Handle game over state
     */
    function gameOver() {
        clearInterval(gameLoopInterval);
        alert(`Game Over! 🎮\nYour final score: ${score}\n\nPress OK to play again.`);
        startGame();
    }

    // ========================================
    // Rendering Functions
    // ========================================

    /**
     * Draw the entire game scene
     */
    function draw() {
        // Clear canvas with dark green background
        ctx.fillStyle = '#1a472a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw food as red circle
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(
            food.x * GRID_SIZE + GRID_SIZE / 2,
            food.y * GRID_SIZE + GRID_SIZE / 2,
            GRID_SIZE / 2 - 1,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw snake segments as green circles
        for (let i = 0; i < snake.length; i++) {
            const segment = snake[i];
            
            // Head is slightly darker, body is lighter
            ctx.fillStyle = i === 0 ? '#7cb342' : '#8BC34A';
            
            ctx.beginPath();
            ctx.arc(
                segment.x * GRID_SIZE + GRID_SIZE / 2,
                segment.y * GRID_SIZE + GRID_SIZE / 2,
                GRID_SIZE / 2 - 1,
                0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    // ========================================
    // Main Game Loop
    // ========================================

    /**
     * Execute one game tick
     */
    function gameLoop() {
        // Only move if snake has started moving (direction is not zero vector)
        if (direction.x !== 0 || direction.y !== 0) {
            const ateFood = updateSnake();
            
            // Check for self-collision
            if (checkCollision()) {
                gameOver();
                return;
            }
            
            // Handle food consumption
            if (ateFood) {
                spawnFood();
                score += 10;
                scoreElement.textContent = score.toString();
            }
        }
        
        draw();
    }

    // ========================================
    // Event Listeners & Initialization
    // ========================================

    // Keyboard controls (WASD)
    document.addEventListener('keydown', handleKeyPress);

    // Prevent default behavior for WASD keys to avoid page scrolling
    window.addEventListener('keydown', function(e) {
        if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // Start the game when page loads
    window.addEventListener('load', startGame);
})();
