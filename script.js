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

// 1. 모든 mp3 파일 비동기 로딩 → AudioBuffer 저장
notes.forEach((note) => {
  fetch(`${note}.mp3`)
    .then((res) => res.arrayBuffer())
    .then((data) => audioContext.decodeAudioData(data))
    .then((buffer) => (bufferMap[note] = buffer));
});

// 2. 키 클릭 시 즉시 메모리에서 재생
document.querySelectorAll(".key").forEach((key) => {
  key.addEventListener("click", () => {
    let note = key.dataset.note.replace("#", "s");
    const buffer = bufferMap[note];
    if (buffer) {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    }
  });
});
