/**
 * Pong Game - Three CPU Difficulty Levels
 * 
 * A classic arcade-style pong game featuring three distinct AI difficulty levels:
 * - Easy: Slow, sloppy movement with high error rate (casual play)
 * - Intermediate: Moderate speed with occasional mistakes (balanced challenge)
 * - Hard: Fast reaction time with near-perfect tracking (skilled players only)
 */

const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 450,
    PADDLE_WIDTH: 12,
    PADDLE_HEIGHT: 90,
    PADDLE_OFFSET: 10,
    BALL_RADIUS: 8,
    INITIAL_SPEED: 5,
    MAX_BALL_SPEED: 16,
    SPEED_INCREASE_PER_HIT: 0.4,
    WINNING_SCORE: 5,
    MAX_BOUNCE_ANGLE: Math.PI / 3,
    DIFFICULTY_LEVELS: {
        easy: {
            cpuMaxSpeed: 4.5,
            errorMargin: 45,
            reactionDelay: 16,
            trackingEnabled: false,
            name: 'Easy',
            description: 'Slow and sloppy - perfect for beginners!'
        },
        medium: {
            cpuMaxSpeed: 7.5,
            errorMargin: 18,
            reactionDelay: 8,
            trackingEnabled: true,
            name: 'Intermediate',
            description: 'Responsive but makes occasional errors'
        },
        hard: {
            cpuMaxSpeed: 14,
            errorMargin: 5,
            reactionDelay: 2,
            trackingEnabled: true,
            name: 'Hard',
            description: 'Lightning fast with near-perfect accuracy'
        }
    },
    COLORS: {
        background: '#0a0a12',
        paddlePlayer: '#4ade80',
        paddleCpu: '#f87171',
        ball: '#ffffff',
        text: '#e5e5e5',
        centerLine: '#3f3f46'
    },
    KEYS: {
        UP: ['ArrowUp', 'KeyW'],
        DOWN: ['ArrowDown', 'KeyS']
    }
};

class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.difficultyButtons = document.querySelectorAll('.btn-difficulty');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.playerScoreEl = document.getElementById('playerScore');
        this.cpuScoreEl = document.getElementById('cpuScore');
        this.statusMessage = document.getElementById('statusMessage');
        
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        
        this.selectedDifficulty = null;
        this.isGameRunning = false;
        this.animationFrameId = null;
        
        this.resetGameState();
        this.bindEvents();
        this.render();
    }
    
    resetGameState() {
        this.playerPaddle = {
            x: CONFIG.PADDLE_OFFSET,
            y: CONFIG.CANVAS_HEIGHT / 2 - CONFIG.PADDLE_HEIGHT / 2,
            width: CONFIG.PADDLE_WIDTH,
            height: CONFIG.PADDLE_HEIGHT
        };
        
        this.cpuPaddle = {
            x: CONFIG.CANVAS_WIDTH - CONFIG.PADDLE_OFFSET - CONFIG.PADDLE_WIDTH,
            y: CONFIG.CANVAS_HEIGHT / 2 - CONFIG.PADDLE_HEIGHT / 2,
            width: CONFIG.PADDLE_WIDTH,
            height: CONFIG.PADDLE_HEIGHT
        };
        
        this.ball = {
            x: CONFIG.CANVAS_WIDTH / 2,
            y: CONFIG.CANVAS_HEIGHT / 2,
            radius: CONFIG.BALL_RADIUS,
            speedX: 0,
            speedY: 0
        };
        
        this.scores = { player: 0, cpu: 0 };
    }
    
    bindEvents() {
        this.canvas.addEventListener('mousemove', (event) => {
            if (!this.isGameRunning) return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseY = event.clientY - rect.top;
            this.playerPaddle.y = Math.max(0, Math.min(CONFIG.CANVAS_HEIGHT - CONFIG.PADDLE_HEIGHT, mouseY - CONFIG.PADDLE_HEIGHT / 2));
        });
        
        document.addEventListener('keydown', (event) => {
            if (!this.isGameRunning) return;
            const moveSpeed = 12;
            if (CONFIG.KEYS.UP.includes(event.code)) {
                this.playerPaddle.y = Math.max(0, this.playerPaddle.y - moveSpeed);
            } else if (CONFIG.KEYS.DOWN.includes(event.code)) {
                this.playerPaddle.y = Math.min(CONFIG.CANVAS_HEIGHT - CONFIG.PADDLE_HEIGHT, this.playerPaddle.y + moveSpeed);
            }
        });
        
        this.difficultyButtons.forEach((button) => {
            button.addEventListener('click', () => this.selectDifficulty(button.dataset.difficulty));
        });
        
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
    }
    
    selectDifficulty(difficulty) {
        if (!CONFIG.DIFFICULTY_LEVELS.hasOwnProperty(difficulty)) return;
        
        this.selectedDifficulty = difficulty;
        const settings = CONFIG.DIFFICULTY_LEVELS[difficulty];
        
        this.difficultyButtons.forEach((btn) => {
            btn.classList.remove('selected');
            if (btn.dataset.difficulty === difficulty) btn.classList.add('selected');
        });
        
        this.setStatusMessage(`🎯 Ready for ${settings.name} mode!\n${settings.description}`, 'ready');
        this.startBtn.disabled = false;
    }
    
    startGame() {
        if (!this.selectedDifficulty) {
            this.setStatusMessage('⚠️ Please select a difficulty first!', 'warning');
            return;
        }
        
        this.ball.speedX = CONFIG.INITIAL_SPEED;
        this.ball.speedY = (Math.random() * 4 - 2);
        
        this.isGameRunning = true;
        this.startBtn.disabled = true;
        this.resetBtn.disabled = false;
        this.difficultyButtons.forEach((btn) => btn.disabled = true);
        
        this.setStatusMessage('', '');
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isGameRunning) return;
        this.update();
        this.render();
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;
        
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.y = this.ball.radius;
            this.ball.speedY = Math.abs(this.ball.speedY);
        } else if (this.ball.y + this.ball.radius > CONFIG.CANVAS_HEIGHT) {
            this.ball.y = CONFIG.CANVAS_HEIGHT - this.ball.radius;
            this.ball.speedY = -Math.abs(this.ball.speedY);
        }
        
        this.checkPaddleCollisions();
        
        if (this.ball.x < 0) {
            this.handleScore('cpu');
        } else if (this.ball.x > CONFIG.CANVAS_WIDTH) {
            this.handleScore('player');
        }
        
        if (this.selectedDifficulty && this.isGameRunning) {
            this.updateCpuPaddle();
        }
    }
    
    checkPaddleCollisions() {
        if (this.ball.speedX < 0 && 
            this.ball.x - this.ball.radius <= this.playerPaddle.x + this.playerPaddle.width &&
            this.ball.x - this.ball.radius >= this.playerPaddle.x &&
            this.ball.y + this.ball.radius >= this.playerPaddle.y &&
            this.ball.y - this.ball.radius <= this.playerPaddle.y + this.playerPaddle.height) {
            
            // Push ball out of paddle to prevent sticking
            this.ball.x = this.playerPaddle.x + this.playerPaddle.width + this.ball.radius;
            
            const impactPoint = (this.ball.y - (this.playerPaddle.y + CONFIG.PADDLE_HEIGHT / 2)) / (CONFIG.PADDLE_HEIGHT / 2);
            this.handlePaddleBounce(impactPoint, 1);
        }
        
        if (this.ball.speedX > 0 &&
            this.ball.x + this.ball.radius >= this.cpuPaddle.x &&
            this.ball.x + this.ball.radius <= this.cpuPaddle.x + this.cpuPaddle.width &&
            this.ball.y + this.ball.radius >= this.cpuPaddle.y &&
            this.ball.y - this.ball.radius <= this.cpuPaddle.y + this.cpuPaddle.height) {
            
            // Push ball out of paddle to prevent sticking
            this.ball.x = this.cpuPaddle.x - this.ball.radius;
            
            const impactPoint = (this.ball.y - (this.cpuPaddle.y + CONFIG.PADDLE_HEIGHT / 2)) / (CONFIG.PADDLE_HEIGHT / 2);
            this.handlePaddleBounce(impactPoint, -1);
        }
    }
    
    handlePaddleBounce(impactPoint, direction) {
        // Clamp impact point to [-1, 1] range
        const clampedImpact = Math.max(-1, Math.min(1, impactPoint));
        
        // Calculate bounce angle (0° = straight, max at paddle edges)
        const angle = clampedImpact * CONFIG.MAX_BOUNCE_ANGLE;
        
        // Get current speed and increase it slightly
        const currentSpeed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2);
        const newSpeed = Math.min(currentSpeed + CONFIG.SPEED_INCREASE_PER_HIT, CONFIG.MAX_BALL_SPEED);
        
        // Calculate new velocity with proper angle physics:
        // cos(angle) for X (forward motion at 0°), sin(angle) for Y (side motion)
        this.ball.speedX = newSpeed * Math.cos(angle) * direction;
        this.ball.speedY = newSpeed * Math.sin(angle);
    }
    
    handleScore(scorer) {
        this.scores[scorer]++;
        this.updateScoreDisplay();
        
        if (this.scores.player >= CONFIG.WINNING_SCORE || this.scores.cpu >= CONFIG.WINNING_SCORE) {
            this.handleGameEnd(scorer);
            return;
        }
        
        this.ball.x = CONFIG.CANVAS_WIDTH / 2;
        this.ball.y = CONFIG.CANVAS_HEIGHT / 2;
        const direction = this.scores.player > this.scores.cpu ? -1 : 1;
        this.ball.speedX = CONFIG.INITIAL_SPEED * direction;
        this.ball.speedY = (Math.random() * 4 - 2);
    }
    
    handleGameEnd(winner) {
        this.isGameRunning = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        const winnerText = winner === 'player' ? 'YOU WIN!' : 'CPU WINS!';
        const emoji = winner === 'player' ? '🎉' : '😞';
        
        this.setStatusMessage(
            `${emoji} ${winnerText}\n${this.scores.player} - ${this.scores.cpu}`,
            winner === 'player' ? 'win' : 'lose'
        );
    }
    
    updateCpuPaddle() {
        const settings = CONFIG.DIFFICULTY_LEVELS[this.selectedDifficulty];
        let targetY;
        
        if (settings.trackingEnabled) {
            if (this.ball.speedX > 0) {
                const timeToImpact = (this.cpuPaddle.x - this.ball.x) / Math.abs(this.ball.speedX);
                let predictedY = this.ball.y + this.ball.speedY * timeToImpact;
                
                while (predictedY < 0 || predictedY > CONFIG.CANVAS_HEIGHT) {
                    if (predictedY < 0) predictedY = -predictedY;
                    else predictedY = CONFIG.CANVAS_HEIGHT * 2 - predictedY;
                }
                targetY = predictedY - CONFIG.PADDLE_HEIGHT / 2;
            } else {
                targetY = CONFIG.CANVAS_HEIGHT / 2 - CONFIG.PADDLE_HEIGHT / 2;
            }
        } else {
            if (this.ball.speedX > 0) {
                targetY = this.ball.y - CONFIG.PADDLE_HEIGHT / 2;
            } else {
                targetY = CONFIG.CANVAS_HEIGHT / 2 - CONFIG.PADDLE_HEIGHT / 2;
            }
        }
        
        if (settings.errorMargin > 0) {
            const randomError = (Math.random() * settings.errorMargin * 2) - settings.errorMargin;
            targetY += randomError;
        }
        
        const deltaY = targetY - this.cpuPaddle.y;
        if (Math.abs(deltaY) > 1) {
            this.cpuPaddle.y += Math.max(-settings.cpuMaxSpeed, Math.min(settings.cpuMaxSpeed, deltaY));
        }
        
        this.cpuPaddle.y = Math.max(0, Math.min(CONFIG.CANVAS_HEIGHT - CONFIG.PADDLE_HEIGHT, this.cpuPaddle.y));
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = CONFIG.COLORS.background;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // Draw center line
        this.drawCenterLine();
        
        // Draw player paddle (green)
        this.ctx.fillStyle = CONFIG.COLORS.paddlePlayer;
        this.ctx.fillRect(this.playerPaddle.x, this.playerPaddle.y, 
                         this.playerPaddle.width, this.playerPaddle.height);
        
        // Draw CPU paddle (red)
        this.ctx.fillStyle = CONFIG.COLORS.paddleCpu;
        this.ctx.fillRect(this.cpuPaddle.x, this.cpuPaddle.y,
                         this.cpuPaddle.width, this.cpuPaddle.height);
        
        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = CONFIG.COLORS.ball;
        this.ctx.fill();
        this.ctx.closePath();
    }
    
    drawCenterLine() {
        const lineWidth = 3;
        const lineLength = 15;
        const gap = 12;
        const totalHeight = CONFIG.CANVAS_HEIGHT;
        
        this.ctx.strokeStyle = CONFIG.COLORS.centerLine;
        this.ctx.lineWidth = lineWidth;
        
        for (let y = 0; y < totalHeight; y += lineLength + gap) {
            this.ctx.beginPath();
            this.ctx.moveTo(CONFIG.CANVAS_WIDTH / 2 - lineWidth / 2, y);
            this.ctx.lineTo(CONFIG.CANVAS_WIDTH / 2 + lineWidth / 2, Math.min(y + lineLength, totalHeight));
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }
    
    updateScoreDisplay() {
        this.playerScoreEl.textContent = this.scores.player;
        this.cpuScoreEl.textContent = this.scores.cpu;
    }
    
    setStatusMessage(message, type) {
        this.statusMessage.textContent = message || '';
        this.statusMessage.className = 'status-message';
        if (type) {
            this.statusMessage.classList.add(type);
        }
    }
    
    resetGame() {
        this.isGameRunning = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        this.scores.player = 0;
        this.scores.cpu = 0;
        this.updateScoreDisplay();
        
        this.ball.x = CONFIG.CANVAS_WIDTH / 2;
        this.ball.y = CONFIG.CANVAS_HEIGHT / 2;
        this.ball.speedX = 0;
        this.ball.speedY = 0;
        
        this.playerPaddle.y = CONFIG.CANVAS_HEIGHT / 2 - CONFIG.PADDLE_HEIGHT / 2;
        this.cpuPaddle.y = CONFIG.CANVAS_HEIGHT / 2 - CONFIG.PADDLE_HEIGHT / 2;
        
        this.setStatusMessage('', '');
        this.startBtn.disabled = false;
        this.resetBtn.disabled = true;
        this.difficultyButtons.forEach((btn) => btn.disabled = false);
        
        this.render();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PongGame();
});
