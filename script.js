document.addEventListener("DOMContentLoaded", () => {
  const el = {
    duration: document.getElementById('duration'),
    wordset: document.getElementById('wordset'),
    startBtn: document.getElementById('startBtn'),
    resetBtn: document.getElementById('resetBtn'),
    time: document.getElementById('time'),
    wpm: document.getElementById('wpm'),
    acc: document.getElementById('acc'),
    high: document.getElementById('high'),
    board: document.getElementById('words'),
    caret: document.getElementById('caret'),
    input: document.getElementById('hiddenInput'),
    results: document.getElementById('results')
  };

  const wordSets = {
    common: ["time", "world", "hello", "keyboard", "speed", "game", "javascript", "open", "innovation", "typing"],
    code: ["function", "variable", "const", "loop", "array", "object", "string", "class", "async", "await"],
    ph: ["bahay", "araw", "gabi", "aso", "pusa", "kain", "inom", "bata", "salamat", "mahal"]
  };

  let words = [], current = 0, correctChars = 0, typedChars = 0;
  let timer = null, timeLeft = 60, started = false;

  function generateWords() {
    const set = wordSets[el.wordset.value];
    words = Array.from({ length: 100 }, () => set[Math.floor(Math.random() * set.length)]);
    el.board.innerHTML = words.map((w, i) => `<span class="word${i === 0 ? ' active' : ''}">${w}</span>`).join(" ");
    current = 0;
    moveCaret();
  }

  function moveCaret() {
    const active = el.board.querySelector('.word.active');
    if (!active) return;
    const rect = active.getBoundingClientRect();
    const parent = el.board.getBoundingClientRect();
    el.caret.style.top = (rect.top - parent.top + 2) + "px";
    el.caret.style.left = (rect.left - parent.left) + "px";
  }

  function startGame() {
    if (started) return;
    started = true;
    timeLeft = parseInt(el.duration.value, 10);
    el.time.textContent = timeLeft;
    el.results.textContent = "";
    correctChars = 0;
    typedChars = 0;
    generateWords();
    el.input.focus();

    timer = setInterval(() => {
      timeLeft--;
      el.time.textContent = timeLeft;
      if (timeLeft <= 0) endGame();
    }, 1000);
  }

  function endGame() {
    clearInterval(timer);
    started = false;
    const wpm = Math.round((correctChars / 5) / (parseInt(el.duration.value, 10) / 60));
    const acc = typedChars ? Math.round((correctChars / typedChars) * 100) : 0;

    el.wpm.textContent = wpm;
    el.acc.textContent = acc + "%";
    el.results.innerHTML = `<h2>Results</h2><p>WPM: ${wpm}</p><p>Accuracy: ${acc}%</p>`;

    let high = parseInt(localStorage.getItem("typingHigh") || "0", 10);
    if (wpm > high) {
      high = wpm;
      localStorage.setItem("typingHigh", high);
    }
    el.high.textContent = high;
  }

  el.input.addEventListener("input", () => {
    const active = el.board.querySelector(".word.active");
    if (!active) return;

    const val = el.input.value.trim();
    const target = active.textContent;
    typedChars++;

    if (val === target && el.input.value.endsWith(" ")) {
      active.classList.remove("active");
      active.classList.add("correct");
      correctChars += target.length;
      el.input.value = "";
      current++;
      const next = el.board.querySelectorAll(".word")[current];
      if (next) next.classList.add("active");
      moveCaret();
    } else {
      if (target.startsWith(val)) {
        active.classList.remove("incorrect");
      } else {
        active.classList.add("incorrect");
      }
    }
  });

  el.startBtn.addEventListener("click", startGame);
  el.resetBtn.addEventListener("click", generateWords);

  document.addEventListener("keydown", e => {
    if (e.key === "Enter") startGame();
  });

  el.board.addEventListener("click", () => el.input.focus());

  
  el.high.textContent = localStorage.getItem("typingHigh") || "—";

  
  generateWords();
});
