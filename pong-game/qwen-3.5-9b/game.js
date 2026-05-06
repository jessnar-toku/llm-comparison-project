// Pong Game - Qwen 3.5-9b Edition

class PongGame {
    constructor() {
        this.canvas = document.getElementById('pongCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game objects
        this.playerPaddle = { x: 10, y: 0, width: 15, height: 100 };
        this.cpuPaddle = { x: 765, y: 0, width: 15, height: 100 };
        this.ball = { x: 400, y: 250, radius: 10, speedX: 0, speedY: 0 };
        
        // Game state
        this.isGameRunning = false;
        this.score = { player: 0, cpu: 0 };
        this.difficulty = null;
        this.selectedDifficultyBtn = null;
        this.animationId = null;
        
        // Difficulty settings
        this.difficultySettings = {
            easy: { errorRate: 0.3, maxSpeed: 4, tracking: false },
            intermediate: { errorRate: 0.15, maxSpeed: 7, tracking: true },
            hard: { errorRate: 0.05, maxSpeed: 12, tracking: true }
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        // Mouse movement for paddle control
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseY = e.clientY - rect.top;
            this.playerPaddle.y = Math.max(0, Math.min(this.canvas.height - this.playerPaddle.height, mouseY - this.playerPaddle.height / 2));
        });

        // Keyboard controls (W/S or Up/Down)
        document.addEventListener('keydown', (e) => {
            const speed = 8;
            
            if (!this.isGameRunning) return;
            
            switch(e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.playerPaddle.y = Math.max(0, this.playerPaddle.y - speed);
                    break;
                case 's':
                case 'arrowdown':
                    this.playerPaddle.y = Math.min(this.canvas.height - this.playerPaddle.height, this.playerPaddle.y + speed);
                    break;
            }
        });

        // Button events
        document.getElementById('easyBtn').addEventListener('click', () => this.selectDifficulty('easy'));
        document.getElementById('intermediateBtn').addEventListener('click', () => this.selectDifficulty('intermediate'));
        document.getElementById('hardBtn').addEventListener('click', () => this.selectDifficulty('hard'));
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
    }

    selectDifficulty(level) {
        this.difficulty = level;
        const settings = this.difficultySettings[level];
        
        // Update button styles
        if (this.selectedDifficultyBtn) {
            this.selectedDifficultyBtn.classList.remove('selected-difficulty');
        }
        this.selectedDifficultyBtn = document.getElementById(`${level}Btn`);
        this.selectedDifficultyBtn.classList.add('selected-difficulty');

        document.getElementById('gameMessage').textContent = 
            `Ready! ${level.charAt(0).toUpperCase() + level.slice(1)} mode selected.`;
    }

    startGame() {
        if (this.difficulty === null) {
            document.getElementById('gameMessage').textContent = 'Please select a difficulty first!';
            return;
        }

        this.isGameRunning = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('resetBtn').disabled = false;
        document.querySelectorAll('.btn-easy, .btn-intermediate, .btn-hard').forEach(btn => btn.disabled = true);
        
        // Initialize ball with horizontal velocity
        this.ball.speedX = 2; // Start ball moving right - SLOWED DOWN
        this.ball.speedY = (Math.random() * 4 + 3) * Math.sign(Math.random());
        
        this.gameLoop();
    }

    stopGame() {
        this.isGameRunning = false;
        cancelAnimationFrame(this.animationId);
        document.getElementById('gameMessage').textContent = '';
    }

    resetBall(winner) {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        
        const direction = winner === 'player' ? 1 : -1;
        // Use slow starting speed (consistent with initial game start)
        this.ball.speedX = direction * 2; 
        this.ball.speedY = (Math.random() * 4 + 3) * Math.sign(Math.random());
    }

    resetGame() {
        this.stopGame();
        
        this.score.player = 0;
        this.score.cpu = 0;
        this.updateScore();
        
        this.resetBall('player');
        document.getElementById('gameMessage').textContent = '';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('resetBtn').disabled = true;
        document.querySelectorAll('.btn-easy, .btn-intermediate, .btn-hard').forEach(btn => btn.disabled = false);
        
        if (this.selectedDifficultyBtn) {
            this.selectedDifficultyBtn.classList.add('selected-difficulty');
        }
    }

    update() {
        // Move the ball
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;

        // Wall collision (top and bottom)
        if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.canvas.height) {
            this.ball.speedY = -this.ball.speedY;
        }

        // Check for scoring
        if (this.ball.x - this.ball.radius < 0) {
            // CPU scores
            this.score.cpu++;
            this.updateScore();
            this.checkWinCondition();
            this.resetBall('cpu');
        } else if (this.ball.x + this.ball.radius > this.canvas.width) {
            // Player scores
            this.score.player++;
            this.updateScore();
            this.checkWinCondition();
            this.resetBall('player');
        }

        // Paddle collision - Player paddle (left side)
        if (this.ball.speedX < 0 && 
            this.ball.x + this.ball.radius > this.playerPaddle.x &&
            this.ball.y - this.ball.radius <= this.playerPaddle.y + this.playerPaddle.height &&
            this.ball.y + this.ball.radius >= this.playerPaddle.y) {
            
            this.handlePaddleCollision(true);
        }

        // Paddle collision - CPU paddle (right side)
        if (this.ball.speedX > 0 && 
            this.ball.x - this.ball.radius < this.cpuPaddle.x + this.cpuPaddle.width &&
            this.ball.y - this.ball.radius <= this.cpuPaddle.y + this.cpuPaddle.height &&
            this.ball.y + this.ball.radius >= this.cpuPaddle.y) {
            
            this.handlePaddleCollision(false);
        }

        // CPU AI movement
        if (this.difficulty !== null) {
            this.updateCPU();
        }
    }

    handlePaddleCollision(playerPaddle) {
        const paddle = playerPaddle ? this.playerPaddle : this.cpuPaddle;
        
        // Calculate where the ball hit the paddle
        const collisionPoint = this.ball.y - (paddle.y + paddle.height / 2);
        const normalizedPos = collisionPoint / (paddle.height / 2);
        
        // Reflect ball with angle based on collision point
        const angleRad = normalizedPos * (Math.PI / 3);
        
        const speed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2);
        const newSpeed = Math.min(speed + 0.05, 12); // Very small increment (was: +0.3)
        
        this.ball.speedX = newSpeed * Math.sin(angleRad);
        this.ball.speedY = newSpeed * Math.cos(angleRad);
        
        // Push ball out of paddle to prevent sticking
        this.ball.x += this.ball.speedX * 10;

        // Increase CPU difficulty with score (up to hard level)
        if (!playerPaddle && !this.difficulty) {
            const cpuLevel = Math.min(this.score.cpu / 5, 2);
            this.setDifficulty(cpuLevel === 0 ? 'easy' : cpuLevel === 1 ? 'intermediate' : 'hard');
        }
    }

    updateCPU() {
        const settings = this.difficultySettings[this.difficulty];
        
        // Add some randomness/error to the AI based on difficulty
        const errorMargin = settings.errorRate * (this.canvas.height / 2);
        
        const targetY = this.ball.y - (this.cpuPaddle.height / 2) + (Math.random() - 0.5) * errorMargin;
        
        // Move CPU paddle towards ball with difficulty-based constraints
        let speed = 0;
        
        if (targetY < this.cpuPaddle.y) {
            speed = settings.tracking ? 
                Math.min(this.canvas.height / this.canvas.width * (settings.maxSpeed / 2), settings.maxSpeed) :
                1.5 + Math.random() * 3;
            this.cpuPaddle.y -= speed;
        } else if (targetY > this.cpuPaddle.y) {
            speed = settings.tracking ? 
                Math.min(this.canvas.height / this.canvas.width * (settings.maxSpeed / 2), settings.maxSpeed) :
                1.5 + Math.random() * 3;
            this.cpuPaddle.y += speed;
        }

        // Keep paddle in bounds
        this.cpuPaddle.y = Math.max(0, Math.min(this.canvas.height - this.cpuPaddle.height, this.cpuPaddle.y));
    }

    checkWinCondition() {
        const winningScore = 11;
        
        if (this.score.player >= winningScore) {
            this.stopGame();
            document.getElementById('gameMessage').textContent = '🎉 YOU WIN! 🎉';
            document.getElementById('gameMessage').classList.add('winner');
            document.getElementById('startBtn').disabled = false;
            document.getElementById('resetBtn').disabled = true;
            document.querySelectorAll('.btn-easy, .btn-intermediate, .btn-hard').forEach(btn => btn.disabled = false);
        } else if (this.score.cpu >= winningScore) {
            this.stopGame();
            document.getElementById('gameMessage').textContent = '😔 GAME OVER - CPU WINS!';
            document.getElementById('gameMessage').classList.add('loser');
            document.getElementById('startBtn').disabled = false;
            document.getElementById('resetBtn').disabled = true;
            document.querySelectorAll('.btn-easy, .btn-intermediate, .btn-hard').forEach(btn => btn.disabled = false);
        }
    }

    updateScore() {
        document.getElementById('playerScore').textContent = this.score.player;
        document.getElementById('cpuScore').textContent = this.score.cpu;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([20, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw player paddle
        this.ctx.fillStyle = '#00d4ff';
        this.ctx.shadowColor = '#00d4ff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(this.playerPaddle.x, this.playerPaddle.y, 
                          this.playerPaddle.width, this.playerPaddle.height);

        // Draw CPU paddle
        this.ctx.fillStyle = '#f44336';
        this.ctx.shadowColor = '#f44336';
        this.ctx.fillRect(this.cpuPaddle.x, this.cpuPaddle.y, 
                          this.cpuPaddle.width, this.cpuPaddle.height);

        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.shadowColor = '#FFD700';
        this.ctx.fill();
        this.ctx.closePath();

        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    gameLoop() {
        if (!this.isGameRunning) return;

        this.update();
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    setDifficulty(level) {
        this.difficulty = level;
        
        const buttons = document.querySelectorAll('.btn-easy, .btn-intermediate, .btn-hard');
        if (level === 'easy') {
            this.selectedDifficultyBtn = document.getElementById('easyBtn');
            this.selectedDifficultyBtn.classList.add('selected-difficulty');
            buttons[1].disabled = true;
            buttons[2].disabled = true;
        } else if (level === 'intermediate') {
            this.selectedDifficultyBtn = document.getElementById('intermediateBtn');
            this.selectedDifficultyBtn.classList.add('selected-difficulty');
            buttons[0].disabled = true;
            buttons[2].disabled = true;
        } else if (level === 'hard') {
            this.selectedDifficultyBtn = document.getElementById('hardBtn');
            this.selectedDifficultyBtn.classList.add('selected-difficulty');
            buttons[0].disabled = true;
            buttons[1].disabled = true;
        }
    }

    render() {
        this.draw();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PongGame();
});
