// Grab DOM elements
const display = document.getElementById('display');
const modeEl  = document.getElementById('mode');
const focusEl = document.getElementById('focus');
const breakEl = document.getElementById('break');
const startBtn= document.getElementById('start');
const pauseBtn= document.getElementById('pause');
const resetBtn= document.getElementById('reset');
const themeBtn= document.getElementById('theme');

// Timer state
let state = { mode: 'focus', endAt: null, remaining: 25*60*1000, ticking: false, rafId: null };

// Helper: milliseconds left
function msLeft() {
  return Math.max(0, state.endAt - performance.now());
}
// Helper: format ms as m:ss
function fmt(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}
// Update the timer display
function update() {
  const left = state.ticking ? msLeft() : state.remaining;
  display.textContent = fmt(left);
  if (state.ticking && left <= 0) nextPhase();
  else state.rafId = requestAnimationFrame(update);
}
// Switch between Focus and Break
function nextPhase() {
  beep();
  state.mode = state.mode === 'focus' ? 'break' : 'focus';
  modeEl.textContent = state.mode === 'focus' ? 'Focus' : 'Break';
  const mins = state.mode === 'focus' ? +focusEl.value : +breakEl.value;
  state.remaining = mins * 60 * 1000;
  start(); // auto-start the next phase
}
// Start the timer
function start() {
  if (state.ticking) return;
  state.ticking = true;
  state.endAt = performance.now() + state.remaining;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  state.rafId && cancelAnimationFrame(state.rafId);
  update();
}
// Pause the timer
function pause() {
  if (!state.ticking) return;
  state.ticking = false;
  state.remaining = msLeft();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}
// Reset to initial Focus state
function reset() {
  state.ticking = false;
  state.mode = 'focus';
  modeEl.textContent = 'Focus';
  state.remaining = (+focusEl.value) * 60 * 1000;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  state.rafId && cancelAnimationFrame(state.rafId);
  update();
}
// Short beep using WebAudio
function beep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.001;
  o.start(); g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.25);
  o.stop(ctx.currentTime + 0.26);
}
// Toggle between dark and light themes
function toggleTheme() {
  document.body.classList.toggle('light');
  themeBtn.textContent = document.body.classList.contains('light') ? 'Dark Mode' : 'Light Mode';
}

// Wire up buttons
startBtn.onclick = start;
pauseBtn.onclick = pause;
resetBtn.onclick = reset;
themeBtn.onclick = toggleTheme;

// Initialize timer
reset();
