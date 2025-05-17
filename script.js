const keys = document.querySelectorAll(".key");
const audioMap = {};

keys.forEach((key) => {
  let rawNote = key.dataset.note;
  if (!rawNote) return; // note가 없으면 건너뜀

  let note = rawNote.replace("#", "s");
  const audio = new Audio(`${note}.wav`);
  audioMap[note] = audio;
});

keys.forEach((key) => {
  key.addEventListener("click", () => {
    let rawNote = key.dataset.note;
    if (!rawNote) return;

    let note = rawNote.replace("#", "s");

    const sound = audioMap[note]?.cloneNode();
    if (sound) sound.play();
  });
});
