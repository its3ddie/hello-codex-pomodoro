// Simple tests for the Pomodoro timer
// Uses Node's vm module with a tiny DOM stub
const assert = require('assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// Create minimal DOM elements needed by the timer
function createElement() {
  return {
    textContent: '',
    value: '',
    disabled: false,
    onclick: null,
    oninput: null,
    classList: { toggle() {}, contains() { return false; } },
    click() { this.onclick && this.onclick(); }
  };
}

function setup() {
  const elements = {
    display: createElement(),
    mode: createElement(),
    focus: Object.assign(createElement(), { value: '25' }),
    break: Object.assign(createElement(), { value: '5' }),
    start: createElement(),
    pause: createElement(),
    reset: createElement(),
    theme: createElement()
  };
  const document = {
    body: createElement(),
    getElementById(id) { return elements[id]; }
  };
  const context = {
    document,
    performance: { now: () => Date.now() },
    requestAnimationFrame: (cb) => setTimeout(() => cb(), 0),
    cancelAnimationFrame: (id) => clearTimeout(id)
  };
  context.window = context; // script expects a window global
  vm.createContext(context);
  const code = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
  vm.runInContext(code, context); // loads timer into context
  return { context, elements };
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Test changing Focus minutes before starting
async function testFocusStart() {
  const { context, elements } = setup();
  elements.focus.value = '10';
  elements.focus.oninput();
  assert.strictEqual(elements.display.textContent, '10:00');
  elements.start.click();
  await delay(5);
  assert(elements.display.textContent.startsWith('10:'), 'Focus should start from edited value');
  context.pause();
  return { context, elements };
}

// Test changing Break minutes while idle in Break mode
async function testBreakStart(env) {
  const { context, elements } = env;
  // Manually move to Break mode and keep timer idle
  vm.runInContext('state.mode="break"; modeEl.textContent="Break"; state.ticking=false; startBtn.disabled=false; pauseBtn.disabled=true; state.remaining=(+breakEl.value)*60*1000; update();', context);
  elements.break.value = '3';
  elements.break.oninput();
  assert.strictEqual(elements.display.textContent, '3:00');
  elements.start.click();
  await delay(5);
  assert(elements.display.textContent.startsWith('3:'), 'Break should start from edited value');
}

(async () => {
  const env = await testFocusStart();
  await testBreakStart(env);
  console.log('All tests passed');
  process.exit(0);
})();

