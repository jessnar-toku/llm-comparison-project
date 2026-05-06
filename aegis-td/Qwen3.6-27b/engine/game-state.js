// ============================================================
// AEGIS GRID: ADAPTIVE DEFENSE — Game State Management
// ============================================================

class GameState {
  constructor() {
    this.currentState = STATE_MENU;
    this.transitions = {};
    this.listeners = [];
  }

  setState(newState) {
    const oldState = this.currentState;
    if (oldState === newState) return;

    // Fire exit callback for old state
    if (this.transitions[oldState] && this.transitions[oldState].onExit) {
      this.transitions[oldState].onExit();
    }

    this.currentState = newState;

    // Fire enter callback for new state
    if (this.transitions[newState] && this.transitions[newState].onEnter) {
      this.transitions[newState].onEnter();
    }

    // Notify listeners
    this.listeners.forEach(cb => cb(oldState, newState));
  }

  getState() {
    return this.currentState;
  }

  registerTransition(state, callbacks = {}) {
    this.transitions[state] = callbacks;
  }

  onStateChange(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
}
