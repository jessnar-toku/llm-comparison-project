// Game state
const gameState = {
    canvas: null,
    ctx: null,
    ball: { x: 400, y: 250, radius: 10, speedX: 5, speedY: 5 },
    playerPaddle: { x: 20, y: 200, width: 15, height: 80, speed: 8 },
    cpuPaddle: { x: 765, y: 200, width: 15, height: 80, speed: 8 },
    playerScore: 0,
    cpuScore: 0,
    difficulty: 'hard', // Default difficulty
    gameActive: false,
    menuVisible: true
};

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('pong-canvas');
    gameState.canvas = canvas;
    gameState.ctx = canvas.getContext('2d');

    // Set canvas dimensions matching container
    const resizeCanvas = () => {
        const containerWidth = document.querySelector('.game-container').offsetWidth;
        const containerHeight = document.querySelector('.game-container').offsetHeight;
        canvas.width = 800;
        canvas.height = 500;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Event listeners for menu buttons
    document.getElementById('easy-btn').addEventListener('click', () => {
        gameState.difficulty = 'easy';
        updateDifficultyButtons('easy');
    });

    document.getElementById('medium-btn').addEventListener('click', () => {
        gameState.difficulty = 'medium';
        updateDifficultyButtons('medium');
    });

    document.getElementById('hard-btn').addEventListener('click', () => {
        gameState.difficulty = 'hard';
        updateDifficultyButtons('hard');
    });

    document.getElementById('start-btn').addEventListener('click', () => {
        startGame();
    });

    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
});

// Update difficulty button states
function updateDifficultyButtons(activeDifficulty) {
    const buttons = ['easy', 'medium', 'hard'];
    buttons.forEach(diff => {
        const btn = document.getElementById(`${diff}-btn`);
        btn.classList.toggle('active', diff === activeDifficulty);
    });
}

// Handle keyboard input
function handleKeyDown(e) {
    if (!gameState.gameActive) return;
    
    const movement = 10;
    
    if (e.key === 'ArrowUp' && gameState.playerPaddle.y > 0) {
        gameState.playerPaddle.y -= movement;
    }
    if (e.key === 'ArrowDown' && gameState.playerPaddle.y < gameState.canvas.height - gameState.playerPaddle.height) {
        gameState.playerPaddle.y += movement;
    }
}

// Start the game
function startGame() {
    gameState.gameActive = true;
    gameState.menuVisible = false;
    document.getElementById('menu').style.display = 'none';
    gameState.canvas.style.display = 'block';
    
    // Reset scores and position
    gameState.playerScore = 0;
    gameState.cpuScore = 0;
    resetBall();
    
    // Start game loop
    gameLoop();
}

// Reset ball to center
function resetBall() {
    gameState.ball.x = gameState.canvas.width / 2;
    gameState.ball.y = gameState.canvas.height / 2;
    
    // Random direction
    const angle = Math.random() * Math.PI - Math.PI / 2;
    gameState.ball.speedX = (gameState.difficulty === 'easy' ? 4 : gameState.difficulty === 'medium' ? 5 : 6) * Math.cos(angle);
    gameState.ball.speedY = (gameState.difficulty === 'easy' ? 4 : gameState.difficulty === 'medium' ? 5 : 6) * Math.sin(angle);
}

// Speed values for different difficulties
function getCpuSpeed() {
    switch(gameState.difficulty) {
        case 'easy': return 4;
        case 'medium': return 6;
        case 'hard': return 8;
    }
}

// CPU AI logic
function updateCpu() {
    const cpuSpeed = getCpuSpeed();
    
    // Target position based on difficulty
    let targetY;
    if (gameState.difficulty === 'easy') {
        // Predict ball path
        targetY = gameState.ball.y;
    } else if (gameState.difficulty === 'medium') {
        // Follow ball and include some prediction
        const timeToReachCenterX = (gameState.canvas.width - gameState.ball.x) / Math.abs(gameState.ball.speedX);
        targetY = gameState.ball.y + gameState.ball.speedY * timeToReachCenterX;
    } else { // hard
        // Advanced prediction with extrapolation
        const extrapolate = (gameState.difficulty === 'hard') ? 1.5 : 1;
        const predictedX = gameState.ball.x + gameState.ball.speedX * extrapolate;
        const predictedY = gameState.ball.y + gameState.ball.speedY * extrapolate;
        const proportion = (gameState.canvas.width - predictedX) / gameState.ball.speedX;
        targetY = predictedY + proportion * gameState.ball.speedY;
    }
    
    // Smooth movement with some randomness
    const targetCenter = targetY - gameState.cpuPaddle.height / 2;
    
    // Add difficulty-based randomness
    let randomOffset = 0;
    if (gameState.difficulty === 'easy') {
        randomOffset = Math.random() * 30 - 15;
    } else if (gameState.difficulty === 'medium') {
        randomOffset = Math.random() * 20 - 10;
    }
    
    const finalTarget = targetCenter + randomOffset;
    
    // Move cpu paddle
    if (gameState.cpuPaddle.y < finalTarget - 10) {
        gameState.cpuPaddle.y += cpuSpeed;
    } else if (gameState.cpuPaddle.y > finalTarget + 10) {
        gameState.cpuPaddle.y -= cpuSpeed;
    }
}

// Game loop
function gameLoop() {
    if (!gameState.gameActive) return;
    
    // Clear canvas
    gameState.ctx.fillStyle = '#000';
    gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Draw center line
    gameState.ctx.strokeStyle = '#4CAF50';
    gameState.ctx.lineWidth = 2;
    for (let i = 0; i < gameState.canvas.height; i += 30) {
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(gameState.canvas.width / 2, i);
        gameState.ctx.lineTo(gameState.canvas.width / 2, i + 20);
        gameState.ctx.stroke();
    }
    
    // Update ball position
    gameState.ball.x += gameState.ball.speedX;
    gameState.ball.y += gameState.ball.speedY;
    
    // Ball collision with top and bottom
    if (gameState.ball.y - gameState.ball.radius < 0 || gameState.ball.y + gameState.ball.radius > gameState.canvas.height) {
        gameState.ball.speedY = -gameState.ball.speedY;
    }
    
    // Ball collision with paddles
    const ballLeft = gameState.ball.x - gameState.ball.radius;
    const ballRight = gameState.ball.x + gameState.ball.radius;
    
    // Player paddle collision
    if (ballLeft < gameState.playerPaddle.x + gameState.playerPaddle.width &&
        ballRight > gameState.playerPaddle.x &&
        gameState.ball.y > gameState.playerPaddle.y &&
        gameState.ball.y < gameState.playerPaddle.y + gameState.playerPaddle.height) {
        
        // Add effect when ball hits paddle
        if (gameState.ball.speedX < 0) {
            gameState.ball.speedX = -Math.abs(gameState.ball.speedX) * 1.05; // Speed up
        }
    }
    
    // CPU paddle collision
    if (ballRight > gameState.cpuPaddle.x &&
        ballLeft < gameState.cpuPaddle.x + gameState.cpuPaddle.width &&
        gameState.ball.y > gameState.cpuPaddle.y &&
        gameState.ball.y < gameState.cpuPaddle.y + gameState.cpuPaddle.height) {
        
        // Add effect when ball hits paddle
        if (gameState.ball.speedX > 0) {
            gameState.ball.speedX = Math.abs(gameState.ball.speedX) * 1.05; // Speed up
        }
    }
    
    // Score points
    if (gameState.ball.x - gameState.ball.radius < 0) {
        gameState.cpuScore++;
        resetBall();
    }
    
    if (gameState.ball.x + gameState.ball.radius > gameState.canvas.width) {
        gameState.playerScore++;
        resetBall();
    }
    
    // CPU AI
    updateCpu();
    
    // Draw paddles
    gameState.ctx.fillStyle = '#4CAF50';
    gameState.ctx.fillRect(gameState.playerPaddle.x, gameState.playerPaddle.y, gameState.playerPaddle.width, gameState.playerPaddle.height);
    gameState.ctx.fillRect(gameState.cpuPaddle.x, gameState.cpuPaddle.y, gameState.cpuPaddle.width, gameState.cpuPaddle.height);
    
    // Draw ball
    gameState.ctx.beginPath();
    gameState.ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    gameState.ctx.fillStyle = '#fff';
    gameState.ctx.fill();
    gameState(ctx);
    
    // Draw scores
    gameState.ctx.fillStyle = '#fff';
    gameState.ctx.font = '48px Arial';
    gameState.ctx.textAlign = 'center';
    gameState.ctx.fillText(gameState.playerScore, gameState.canvas.width / 4, 50);
    gameState.ctx.fillText(gameState.cpuScore, gameState.canvas.width * 3/4, 50);
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Game over condition
if (gameState.playerScore >= 10 || gameState.cpuScore >= 10) {
    endGame();
}

// End game and show results
function endGame() {
    gameState.gameActive = false;
    
    // Create results overlay
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'results-overlay';
    
    const winner = gameState.playerScore > gameState.cpuScore ? 'Player' : 'CPU';
    const winnerColor = winner === 'Player' ? '#4CAF50' : '#f44336';
    
    resultsDiv.innerHTML = `
        <h1>Game Over</h1>
        <p class="score">Player: ${gameState.playerScore} - ${gameState.cpuScore} CPU</p>
        <h2 style="color: ${winnerColor}">${winner} Wins!</h1>
        <button id="replay-btn" class="start-btn">Play Again</button>
    `;
    
    document.querySelector('.game-container').appendChild(resultsDiv);
    
    // Replay button
    document.getElementById('replay-btn').addEventListener('click', () => {
        document.querySelector('.results-overlay').remove();
        startGame();
    });
}