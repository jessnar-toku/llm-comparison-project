// Game Configuration
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 500,
    PADDLE_WIDTH: 10,
    PADDLE_HEIGHT: 80,
    BALL_RADIUS: 6,
    WINNING_SCORE: 10,
    PLAYER_SPEED: 7,
    EASY_CPU_SPEED: 3.5,
    INTERMEDIATE_CPU_SPEED: 5.5,
    HARD_CPU_SPEED: 8.0,
    INITIAL_BALL_SPEED: 5
};

// Game State
class GameState {
    constructor() {
        this.screen = 'menu';
        this.difficulty = null;
        this.playerScore = 0;
        this.cpuScore = 0;
        this.gameOver = false;
    }
}

const gameState = new GameState();

// Canvas Setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

// Input Tracking
class InputHandler {
    constructor() {
        this.keysUp = {};
        this.keysDown = {};
        
        window.addEventListener('keydown', (e) => {
            if (!this.keysUp[e.key] && !this.keysDown[e.key]) {
                this.keysDown[e.key] = true;
                this.keysUp[e.key] = false;
                return false;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (!this.keysUp[e.key] && this.keysDown[e.key]) {
                this.keysDown[e.key] = false;
                this.keysUp[e.key] = true;
                return false;
            }
        });
    }
}

const inputHandler = new InputHandler();

// Player Paddle
class Paddle {
    constructor(x, y, isCpu = false) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PADDLE_WIDTH;
        this.height = CONFIG.PADDLE_HEIGHT;
        this.isCpu = isCpu;
    }
    
    update(ball, speed) {
        if (this.isCpu && !gameState.gameOver) {
            // AI follows the ball with difficulty-based speed
            const targetY = ball.y - this.height / 2;
            const distance = Math.abs(targetY - this.y);
            
            if (distance > speed) {
                this.y += Math.sign(targetY - this.y) * speed;
            }
        } else if (!this.isCpu && !gameState.gameOver) {
            // Player controls
            const keysUp = inputHandler.keysUp;
            const keysDown = inputHandler.keysDown;
            
            if (keysDown['w'] || keysDown['W']) this.y -= CONFIG.PLAYER_SPEED;
            if (keysDown['s'] || keysDown['S']) this.y += CONFIG.PLAYER_SPEED;
        }
        
        // Keep paddle within canvas
        this.y = Math.max(0, Math.min(this.y, CONFIG.CANVAS_HEIGHT - this.height));
    }
    
    draw(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

const player = new Paddle(20, 150, false);
const cpu = new Paddle(CONFIG.CANVAS_WIDTH - 30, 150, true);

// Ball
class Ball {
    constructor() {
        this.x = CONFIG.CANVAS_WIDTH / 2;
        this.y = CONFIG.CANVAS_HEIGHT / 2;
        this.speedX = CONFIG.INITIAL_BALL_SPEED;
        this.speedY = CONFIG.INITIAL_BALL_SPEED;
        this.radius = CONFIG.BALL_RADIUS;
    }
    
    update() {
        if (gameState.gameOver) return;
        
        // Move the ball
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Bounce off top and bottom walls
        if (this.y - this.radius < 0 || this.y + this.radius > CONFIG.CANVAS_HEIGHT) {
            this.speedY *= -1;
            // Push ball out of wall to prevent sticking
            if (this.y - this.radius < 0) this.y = this.radius;
            else this.y = CONFIG.CANVAS_HEIGHT - this.radius;
        }
        
        // Check paddle collisions
        this.checkPaddleCollision(player);
        this.checkPaddleCollision(cpu);
        
        // Score points
        if (this.x < 0) {
            gameState.cpuScore++;
            this.resetBall();
            return true; // scored
        }
        if (this.x > CONFIG.CANVAS_WIDTH) {
            gameState.playerScore++;
            this.resetBall();
            return true; // scored
        }
        
        return false;
    }
    
    checkPaddleCollision(paddle) {
        const overlap = !(this.x + this.radius < paddle.x ||
                        this.x - this.radius > paddle.x + paddle.width ||
                        this.y + this.radius < paddle.y ||
                        this.y - this.radius > paddle.y + paddle.height);
        
        if (overlap) {
            // Reverse ball direction
            this.speedX *= -1;
            // Increase speed slightly on each hit
            this.speedX *= 1.05;
            this.speedY *= 1.02;
            
            // Push ball out of paddle to prevent sticking
            if (paddle.isCpu) {
                this.x = paddle.x - this.radius;
            } else {
                this.x = paddle.x + paddle.width + this.radius;
            }
        }
    }
    
    resetBall() {
        this.x = CONFIG.CANVAS_WIDTH / 2;
        this.y = CONFIG.CANVAS_HEIGHT / 2;
        this.speedX = -CONFIG.INITIAL_BALL_SPEED;
        this.speedY = Math.random() * CONFIG.INITIAL_BALL_SPEED * 2 - CONFIG.INITIAL_BALL_SPEED;
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.closePath();
    }
}

const ball = new Ball();

// UI Elements
const menuScreen = document.getElementById('menu-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const winnerText = document.getElementById('winner-text');
const finalScoreEl = document.getElementById('final-score');

function showMenu() {
    gameState.screen = 'menu';
    menuScreen.classList.add('active');
    gameOverScreen.classList.remove('active');
}

function hideMenu() {
    menuScreen.classList.remove('active');
}

function showGameOver(winner) {
    gameState.screen = 'gameover';
    winnerText.textContent = winner === 'player' ? 'You Win!' : 'CPU Wins!';
    finalScoreEl.textContent = `${gameState.playerScore} - ${gameState.cpuScore}`;
    gameOverScreen.classList.add('active');
}

function hideGameOver() {
    gameOverScreen.classList.remove('active');
}

// Menu Button Handlers
const easyBtn = document.getElementById('easy-btn');
const intermediateBtn = document.getElementById('intermediate-btn');
const hardBtn = document.getElementById('hard-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');

function startGame(difficulty) {
    gameState.difficulty = difficulty;
    gameState.playerScore = 0;
    gameState.cpuScore = 0;
    gameState.gameOver = false;
    
    player.y = 150;
    cpu.y = 150;
    ball.resetBall();
    
    hideMenu();
    hideGameOver();
}

function gameOver() {
    gameState.gameOver = true;
    showGameOver(gameState.playerScore > gameState.cpuScore ? 'player' : 'cpu');
}

// Event Listeners
easyBtn.addEventListener('click', () => startGame(CONFIG.EASY_CPU_SPEED));
intermediateBtn.addEventListener('click', () => startGame(CONFIG.INTERMEDIATE_CPU_SPEED));
hardBtn.addEventListener('click', () => startGame(CONFIG.HARD_CPU_SPEED));
restartBtn.addEventListener('click', () => {
    if (gameState.difficulty) startGame(gameState.difficulty);
});
menuBtn.addEventListener('click', showMenu);

// Game Loop
function gameLoop() {
    // Update
    const speed = gameState.difficulty || 0;
    player.update(ball, speed);
    cpu.update(ball, speed);
    
    const scored = ball.update();
    if (scored) {
        // Check win condition
        if (gameState.playerScore >= CONFIG.WINNING_SCORE || gameState.cpuScore >= CONFIG.WINNING_SCORE) {
            gameOver();
        }
    }
    
    // Draw
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // Draw center line
    ctx.strokeStyle = '#333';
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(CONFIG.CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT);
    ctx.stroke();
    
    // Draw paddles and ball
    player.draw(ctx);
    cpu.draw(ctx);
    ball.draw(ctx);
    
    // Draw score
    if (!gameState.gameOver && gameState.screen === 'game') {
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameState.playerScore, CONFIG.CANVAS_WIDTH / 4, 60);
        ctx.fillText(gameState.cpuScore, CONFIG.CANVAS_WIDTH * 3 / 4, 60);
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize
showMenu();
gameState.screen = 'menu';
gameLoop();
