/**
 * CuteSounds — Procedural cute sound effects using the Web Audio API.
 * No audio files needed! Each sound type gets its own adorable tone.
 */
class CuteSounds {
  constructor() {
    this.ctx = null;        // lazy-init to satisfy browser autoplay policy
    this.enabled = true;
  }

  /** Initialize AudioContext on first user gesture */
  _init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Play a cute "blip" for number keys.
   * @param {number} pitch — 0-9, mapped to ascending pitch
   */
  playNumber(pitch = 5) {
    this._init();
    const freq = 600 + pitch * 40;   // C5-ish range
    this._playTone(freq, 'sine', 0.12, 0.25);
    // add a tiny harmonic sparkle
    this._playTone(freq * 2, 'sine', 0.06, 0.06);
  }

  /** Play a soft "pop" for operator keys */
  playOperator() {
    this._init();
    this._playTone(880, 'triangle', 0.12, 0.18);
    this._playTone(1100, 'sine', 0.06, 0.08);
  }

  /** Play a cheerful chime for equals */
  playEquals() {
    this._init();
    const now = this.ctx.currentTime;
    // Two-note ascending chime
    this._playToneAt(784, 'sine', 0.14, 0.18, now);
    this._playToneAt(1047, 'sine', 0.14, 0.22, now + 0.08);
    this._playToneAt(1319, 'sine', 0.10, 0.18, now + 0.16);
  }

  /** Play a soft "woosh" for clear */
  playClear() {
    this._init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  /** Play a small click for backspace */
  playBackspace() {
    this._init();
    this._playTone(520, 'square', 0.06, 0.08);
  }

  /** Play a short blip for decimal / percent */
  playSpecial() {
    this._init();
    this._playTone(740, 'sine', 0.10, 0.12);
  }

  /* ---- internal helpers ---- */

  _playTone(freq, type, volume, duration) {
    this._playToneAt(freq, type, volume, duration, this.ctx.currentTime);
  }

  _playToneAt(freq, type, volume, duration, startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }
}

// Expose globally
window.cuteSounds = new CuteSounds();
