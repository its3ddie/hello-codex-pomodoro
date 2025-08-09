// Smoke tests for the Pomodoro timer (browser, Mocha + Chai)
describe('Pomodoro Timer', function () {
  this.timeout(4000);

  // Keep state clean between tests
  beforeEach(function () { reset(); });
  afterEach(function () { reset(); });

  // Helper: "m:ss" -> total seconds
  function secs(text) { const [m, s] = text.split(':').map(Number); return m * 60 + s; }

  it('Timer counts down after pressing Start', function (done) {
    focusEl.value = 10;       // Follow real app flow
    reset();                  // sync display with new minutes
    const startSecs = secs(display.textContent);
    start();
    const t0 = performance.now();
    function check() {
      if (performance.now() - t0 >= 1100) {
        try { expect(secs(display.textContent)).to.be.below(startSecs); done(); }
        catch (e) { done(e); }
      } else {
        requestAnimationFrame(check);
      }
    }
    requestAnimationFrame(check);
  });

  it('Pause stops countdown', function (done) {
    focusEl.value = 1;   // Shorter timer for quick check
    reset();
    start();
    setTimeout(function () {
      pause();
      const paused = display.textContent;
      const t0 = performance.now();
      function check() {
        if (performance.now() - t0 >= 300) {
          try { expect(display.textContent).to.equal(paused); done(); }
          catch (e) { done(e); }
        } else {
          // Fail early if the display changes while paused
          if (display.textContent !== paused) done(new Error('timer changed while paused'));
          else requestAnimationFrame(check);
        }
      }
      requestAnimationFrame(check);
    }, 100);
  });

  it('Reset sets display to Focus minutes', function () {
    focusEl.value = 10;
    reset();
    expect(display.textContent).to.equal('10:00');
  });

  it('Dark/Light toggle switches theme class', function () {
    const wasLight = document.body.classList.contains('light');
    themeBtn.click();
    expect(document.body.classList.contains('light')).to.equal(!wasLight);
  });

  it('Beep is invoked at phase change', function () {
    const RealAC = window.AudioContext;
    const RealWAC = window.webkitAudioContext;
    class FakeOsc { constructor(){ this.frequency={value:0}; this.type=''; } connect(){} start(){} stop(){} }
    class FakeGain { constructor(){ this.gain={value:0, exponentialRampToValueAtTime(){}}; } connect(){} }
    class FakeCtx {
      createOscillator(){ return new FakeOsc(); }
      createGain(){ return new FakeGain(); }
      get destination(){ return {}; }
      get currentTime(){ return 0; }
    }
    window.AudioContext = window.webkitAudioContext = FakeCtx;

    const realBeep = window.beep;
    let called = 0;
    window.beep = function(){ called++; realBeep(); };

    // Force a phase switch without calling start()
    state.endAt = performance.now() - 1; // already expired
    state.ticking = true;
    update(); // triggers nextPhase() and beep()

    try { expect(called).to.be.greaterThan(0); }
    finally {
      window.beep = realBeep;
      window.AudioContext = RealAC;
      window.webkitAudioContext = RealWAC;
      reset();
    }
  });
});
