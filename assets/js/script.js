const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const bufferMap = {};
const notes = [
  "A0",
  "As0",
  "B0",
  "C1",
  "Cs1",
  "D1",
  "Ds1",
  "E1",
  "F1",
  "Fs1",
  "G1",
  "Gs1",
  "A1",
  "As1",
  "B1",
  "C2",
  "Cs2",
  "D2",
  "Ds2",
  "E2",
  "F2",
  "Fs2",
  "G2",
  "Gs2",
  "A2",
  "As2",
  "B2",
  "C3",
  "Cs3",
  "D3",
  "Ds3",
  "E3",
  "F3",
  "Fs3",
  "G3",
  "Gs3",
  "A3",
  "As3",
  "B3",
  "C4",
  "Cs4",
  "D4",
  "Ds4",
  "E4",
  "F4",
  "Fs4",
  "G4",
  "Gs4",
  "A4",
  "As4",
  "B4",
  "C5",
  "Cs5",
  "D5",
  "Ds5",
  "E5",
  "F5",
  "Fs5",
  "G5",
  "Gs5",
  "A5",
  "As5",
  "B5",
  "C6",
  "Cs6",
  "D6",
  "Ds6",
  "E6",
  "F6",
  "Fs6",
  "G6",
  "Gs6",
  "A6",
  "As6",
  "B6",
  "C7",
  "Cs7",
  "D7",
  "Ds7",
  "E7",
  "F7",
  "Fs7",
  "G7",
  "Gs7",
  "A7",
  "As7",
  "B7",
  "C8",
];

// 모든 mp3 파일을 메모리에 로딩합니다.
notes.forEach((note) => {
  fetch(`assets/audio/mp3/${note}.mp3`)
    .then((res) => {
      if (!res.ok) throw new Error(`음원 로딩 실패: ${note}`);
      return res.arrayBuffer();
    })
    .then((data) => audioContext.decodeAudioData(data))
    .then((buffer) => (bufferMap[note] = buffer))
    .catch(console.error);
});

function playNote(note) {
  if (audioContext.state === "suspended") audioContext.resume().catch(console.error);
  const buffer = bufferMap[note.replace("#", "s")];
  if (!buffer) return;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(audioContext.destination);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
  source.start();
  return { source, gain };
}

const pianoKeys = new Map();
document.querySelectorAll(".key[data-note]").forEach((key) => {
  pianoKeys.set(key.dataset.note, key);
  key.addEventListener("click", () => playNote(key.dataset.note));
});

// 물리 키 위치를 사용해 한/영 입력과 Shift 상태에 관계없이 연주합니다.
const keyboardRows = [
  ["Backquote", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus"],
  ["Tab", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft"],
  ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", "Enter"],
  ["ShiftLeft", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "ShiftRight"],
];
const semitones = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const keyboardNotes = new Map();
keyboardRows.forEach((row, index) => {
  row.forEach((code, step) => keyboardNotes.set(code, `${semitones[step]}${index + 3}`));
});
const pressedKeys = new Map();

document.addEventListener("keydown", (event) => {
  const note = keyboardNotes.get(event.code);
  if (!note || event.ctrlKey || event.metaKey || event.altKey ||
      event.target.closest("input, textarea, select, button, a, [contenteditable]:not([contenteditable='false'])")) return;
  event.preventDefault();
  if (event.repeat || pressedKeys.has(event.code)) return;
  const voice = playNote(note);
  if (!voice) return;
  pressedKeys.set(event.code, { ...voice, note });
  pianoKeys.get(note).classList.add("active");
});

function releaseKey(code) {
  const voice = pressedKeys.get(code);
  if (!voice) return;
  const time = audioContext.currentTime;
  voice.gain.gain.setTargetAtTime(0, time, 0.01);
  voice.source.stop(time + 0.05);
  pianoKeys.get(voice.note).classList.remove("active");
  pressedKeys.delete(code);
}

document.addEventListener("keyup", (event) => releaseKey(event.code));
window.addEventListener("blur", () => pressedKeys.forEach((_, code) => releaseKey(code)));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pressedKeys.forEach((_, code) => releaseKey(code));
});
