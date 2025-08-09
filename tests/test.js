// Smoke tests for the Pomodoro timer
describe('Pomodoro Timer', function() {
  this.timeout(5000);
  // Reset the app before and after each test to keep state clean
  beforeEach(function() {
    reset();
  });
  afterEach(function() {
    reset();
  });

  // Helper: convert "m:ss" to total seconds
  function secs(text) {
    const [m, s] = text.split(':').map(Number);
    return m * 60 + s;
  }

  it('Timer counts down after pressing Start', function(done) {
    state.remaining = 5000;
    update();
    const startTime = secs(display.textContent);
    start();
    setTimeout(function() {
      const later = secs(display.textContent);
      try {
        expect(later).to.be.below(startTime);
        done();
      } catch (e) {
        done(e);
      }
    }, 1200);
  });

  it('Pause stops countdown', function(done) {
    state.remaining = 5000;
    update();
    start();
    setTimeout(function() {
      pause();
      const paused = display.textContent;
      setTimeout(function() {
        try {
          expect(display.textContent).to.equal(paused);
          done();
        } catch (e) {
          done(e);
        }
      }, 1200);
    }, 100);
  });

  it('Reset sets the display to the current Focus minutes value', function() {
    focusEl.value = 10;
    reset();
    expect(display.textContent).to.equal('10:00');
  });

  it('Dark/Light toggle switches theme class', function() {
    const had = document.body.classList.contains('light');
    themeBtn.click();
    expect(document.body.classList.contains('light')).to.equal(!had);
  });

  it('Beep function is called at phase change', function(done) {
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
    state.remaining = 50;
    update();
    start();
    setTimeout(function(){
      try {
        expect(called).to.be.above(0);
        done();
      } catch(e){
        done(e);
      } finally {
        window.beep = realBeep;
        window.AudioContext = RealAC;
        window.webkitAudioContext = RealWAC;
        reset();
      }
    }, 200);
  });
});
