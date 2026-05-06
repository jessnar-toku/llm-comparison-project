// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Input Handler
// ============================================================

class InputHandler {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.mouseX = 0;
    this.mouseY = 0;
    this.gridX = 0;
    this.gridY = 0;
    this.keys = {};
    this.callbacks = {
      click: null,
      rightClick: null,
      hover: null,
      drag: null
    };

    this.setupListeners();
  }

  setupListeners() {
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    this.canvas.addEventListener('keydown', (e) => this.onKeyDown(e));
    this.canvas.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Focus the canvas for keyboard events
    this.canvas.setAttribute('tabindex', '0');
    this.canvas.focus();
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
    this.gridX = Math.floor(this.mouseX / TILE_SIZE);
    this.gridY = Math.floor(this.mouseY / TILE_SIZE);

    if (this.callbacks.hover) {
      this.callbacks.hover(this.gridX, this.gridY);
    }
  }

  onMouseDown(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gx = Math.floor(x / TILE_SIZE);
    const gy = Math.floor(y / TILE_SIZE);

    if (e.button === 0) {
      // Left click
      if (this.callbacks.click) {
        this.callbacks.click(gx, gy);
      }
    } else if (e.button === 2) {
      // Right click
      if (this.callbacks.rightClick) {
        this.callbacks.rightClick(gx, gy);
      }
    }
  }

  onKeyDown(e) {
    this.keys[e.key] = true;

    // Handle pause toggle
    if (e.key === 'Escape' || e.key === 'p') {
      if (this.game.state.getState() === STATE_PLAYING) {
        this.game.state.setState(STATE_PAUSED);
      } else if (this.game.state.getState() === STATE_PAUSED) {
        this.game.state.setState(STATE_PLAYING);
      }
    }

    // Handle ability shortcuts
    if (this.game.state.getState() === STATE_PLAYING) {
      if (e.key === '1' && this.game.abilitySystem) {
        this.game.abilitySystem.selectAbility(ABILITY_AIRSTRIKE);
      }
      if (e.key === '2' && this.game.abilitySystem) {
        this.game.abilitySystem.selectAbility(ABILITY_FREEZE);
      }
      if (e.key === '3' && this.game.abilitySystem) {
        this.game.abilitySystem.selectAbility(ABILITY_OVERCLOCK);
      }
    }
  }

  onKeyUp(e) {
    this.keys[e.key] = false;
  }

  isKeyDown(key) {
    return !!this.keys[key];
  }

  onClick(callback) {
    this.callbacks.click = callback;
  }

  onRightClick(callback) {
    this.callbacks.rightClick = callback;
  }

  onHover(callback) {
    this.callbacks.hover = callback;
  }

  getMousePos() {
    return { x: this.mouseX, y: this.mouseY };
  }

  getGridPos() {
    return { x: this.gridX, y: this.gridY };
  }
}
