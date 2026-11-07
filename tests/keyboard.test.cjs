const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
  const documentEvents = {};
  const windowEvents = {};
  const sources = [];
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const keys = [...html.matchAll(/data-note="([^"]+)"/g)].map((match) => ({
    dataset: { note: match[1] },
    classList: new Set(),
    addEventListener(type, handler) { this[type] = handler; },
  }));
  keys.forEach((key) => { key.classList.remove = key.classList.delete; });
  const elements = {
    'white-keys-only': {
      checked: false,
      addEventListener(type, handler) { this[type] = handler; },
    },
    'chromatic-guide': {},
    'white-keys-guide': {},
  };
  class AudioContext {
    state = 'suspended';
    currentTime = 0;
    resume() { this.state = 'running'; return Promise.resolve(); }
    createBufferSource() {
      const source = { connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
      sources.push(source);
      return source;
    }
    createGain() { return { connect() {}, disconnect() {}, gain: { setTargetAtTime() {} } }; }
  }
  const document = {
    hidden: false,
    getElementById: (id) => elements[id],
    querySelectorAll: () => keys,
    addEventListener: (type, handler) => { documentEvents[type] = handler; },
  };
  const context = vm.createContext({
    window: { AudioContext, addEventListener: (type, handler) => { windowEvents[type] = handler; } },
    document, console,
    fetch: (url) => {
      assert.ok(fs.existsSync(path.join(__dirname, '..', url)), `Missing sample: ${url}`);
      return new Promise(() => {});
    },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js/script.js'), 'utf8'), context);
  vm.runInContext('notes.forEach(note => bufferMap[note] = note)', context);
  const down = (code, options = {}) => {
    const event = { code, target: { closest: () => false }, preventDefault() { this.prevented = true; }, ...options };
    documentEvents.keydown(event);
    return event;
  };
  return { context, down, elements, keys, sources, document, documentEvents, windowEvents };
}

const rows = [
  ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'],
  ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
  ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
];
const notes = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];

test('all 48 physical keys play C3–B6 and release; every sample exists', () => {
  const app = setup();
  rows.forEach((row, index) => row.forEach((code, step) => {
    const note = `${notes[step]}${index + 3}`;
    assert.ok(fs.existsSync(path.join(__dirname, '../assets/audio/mp3', `${note}.mp3`)));
    assert.equal(app.down(code, { key: '한', shiftKey: code !== 'Tab' }).prevented, true);
    const source = app.sources.at(-1);
    assert.equal(source.buffer, note);
    assert.equal(source.started, true);
    const key = app.keys.find(key => key.dataset.note === note.replace('s', '#'));
    assert.ok(key.classList.has('active'));
    app.documentEvents.keyup({ code, metaKey: true });
    assert.equal(source.stopped, true);
    assert.ok(!key.classList.has('active'));
  }));
  assert.equal(app.sources.length, 48);
});

test('chords, repeat suppression, and focus loss cleanup', () => {
  const app = setup();
  ['ShiftLeft', 'ShiftRight', 'Tab', 'Enter'].forEach(code => app.down(code));
  app.down('Tab', { repeat: true });
  app.down('Tab');
  assert.equal(app.sources.length, 4);
  app.windowEvents.blur();
  assert.ok(app.sources.every(source => source.stopped));
  assert.ok(app.keys.every(key => !key.classList.has('active')));
  app.down('Tab');
  app.document.hidden = true;
  app.documentEvents.visibilitychange();
  assert.equal(app.sources.at(-1).stopped, true);
});

test('the switch maps exactly 28 keys to white notes and releases held notes on a change', () => {
  const app = setup();
  const toggle = app.elements['white-keys-only'];
  const chromaticGuide = app.elements['chromatic-guide'];
  const whiteKeysGuide = app.elements['white-keys-guide'];
  assert.equal(chromaticGuide.hidden, false);
  assert.equal(whiteKeysGuide.hidden, true);
  app.down('Digit1');
  const chromaticVoice = app.sources.at(-1);
  assert.equal(chromaticVoice.buffer, 'Cs3');
  toggle.checked = true;
  toggle.change();
  assert.equal(chromaticVoice.stopped, true);
  assert.ok(app.keys.every(key => !key.classList.has('active')));
  assert.equal(chromaticGuide.hidden, true);
  assert.equal(whiteKeysGuide.hidden, false);
  assert.equal(app.down('Digit1', { repeat: true }).prevented, true);
  assert.equal(app.sources.length, 1);

  const whiteRows = [
    [...'1234567'].map(key => `Digit${key}`),
    ...['QWERTYU', 'ASDFGHJ', 'ZXCVBNM'].map(row => [...row].map(key => `Key${key}`)),
  ];
  rows.forEach((row, octave) => row.forEach((code) => {
    const step = whiteRows[octave].indexOf(code);
    const event = app.down(code, { target: toggle });
    if (step === -1) {
      assert.equal(event.prevented, undefined, code);
      return;
    }
    assert.equal(event.prevented, true, code);
    assert.equal(app.sources.at(-1).buffer, `${'CDEFGAB'[step]}${octave + 3}`);
    app.documentEvents.keyup({ code });
  }));
  assert.equal(app.sources.length, 29);

  toggle.checked = false;
  toggle.change();
  assert.equal(chromaticGuide.hidden, false);
  assert.equal(whiteKeysGuide.hidden, true);
  assert.equal(app.down('Tab', { target: toggle }).prevented, undefined);
  assert.equal(app.down('Tab', { shiftKey: true }).prevented, undefined);
  assert.equal(app.down('Space', { target: toggle }).prevented, undefined);
  app.down('Digit1', { target: toggle });
  assert.equal(app.sources.at(-1).buffer, 'Cs3');
});

test('shortcuts, editable fields and unrelated keys retain default behavior', () => {
  const app = setup();
  for (const options of [{ metaKey: true }, { ctrlKey: true }, { altKey: true }, { target: { closest: () => true } }]) {
    assert.equal(app.down('KeyA', options).prevented, undefined);
  }
  assert.equal(app.down('Space').prevented, undefined);
  assert.equal(app.sources.length, 0);
});

test('click playback and missing-buffer recovery', () => {
  const app = setup();
  app.keys.find(key => key.dataset.note === 'C4').click();
  assert.equal(app.sources.at(-1).buffer, 'C4');
  vm.runInContext('delete bufferMap.C4', app.context);
  app.down('Tab');
  assert.equal(app.sources.length, 1);
  vm.runInContext('bufferMap.C4 = "C4"', app.context);
  app.down('Tab');
  assert.equal(app.sources.length, 2);
});
