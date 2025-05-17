const keys = document.querySelectorAll(".key");

keys.forEach((key) => {
  key.addEventListener("click", () => {
    let note = key.dataset.note;

    // 샵 표기 변경: # → s
    note = note.replace("#", "s");

    const audio = new Audio(`${note}.wav`);
    audio.play();
  });
});
