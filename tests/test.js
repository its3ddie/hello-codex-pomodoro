// Smoke tests for the Pomodoro timer (browser, Mocha + Chai)
describe('Pomodoro Timer', function () {
  this.timeout(6000);

  // Keep state clean between tests
  beforeEach(function () { reset(); });
  afterEach(function () { reset(); });

  // Helper: "m:ss" -> total seconds
  function secs(text) { const [m, s] = text.split(':').map(Number); return m * 60 + s; }

  it('Timer counts down after pressing Start', function (done) {
    state.remaining = 3000; // 3s
    update();
    const startTime = secs(display.textContent);
    start();
    setTimeout(function () {
      try { expect(secs(display.textContent)).to.be.below(startTime); done(); }
      catch (e) { done(e); }
    }, 1200);
  });

  it('Pause stops countdown', function (done) {
    state.remaining = 3000; update(); start();
    setTimeout(function () {
      pause();
      const paused = display.textContent;
      setTimeout(function () {
        try { expect(display.textContent).to.equal(paused); done(); }
        catch (e) { done(e); }
      }, 1200);
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

  it('Beep is invoked at phase change', function (done) {
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

    state.remaining = 50; update(); start();
    setTimeout(function () {
      try { expect(called).to.be.greaterThan(0); done(); }
      catch (e) { done(e); }
      finally {
        window.beep = realBeep;
        window.AudioContext = RealAC;
        window.webkitAudioContext = RealWAC;
        reset();
      }
    }, 300);
  });
});
