// ---------- Word banks ----------
const WORDS = {
  common: (
    `time year people way day man thing woman life child world school state family student group country problem hand part place case week company system program question work government number night point home water room mother area money story fact month lot right study book eye job word business issue side kind head house service friend father power hour game line end member law car city community name president team minute idea kid body information back parent face others level office door health person art war history party result change morning reason research girl guy moment air teacher force education foot boy age policy everything process music market sense service area activity road behavior paper special space`.split(/\s+/)
  ),
  code: (
    `array object string boolean number null undefined scope closure promise async await fetch render state hook event module export import package json npm yarn vite bundler compiler virtual dom function class method variable constant pointer reference stack heap thread worker debounce throttle`.split(/\s+/)
  ),
  ph: (
    `bahay kaibigan tubig mahangin ulan araw ilaw lamesa silya kumusta salamat pasensya po pagkain kanin ulam kape gatas asukal tinapay trabaho palengke jeep lrt bayan bundok dagat isda manok baboy prito adobo sinigang pancit halo-halo masarap maanghang malamig mainit bilis mabagal`.split(/\s+/)
  )
};

// ---------- DOM refs ----------
const el = {
  duration: document.getElementById('duration'),
  wordset: document.getElementById('wordset'),
  startBtn: document.getElementById('startBtn'),
  resetBtn: document.getElementById('resetBtn'),
  time: document.getElementById('time'),
  wpm: document.getElementById('wpm'),
  acc: document.getElementById('acc'),
  high: document.getElementById('high'),
  words: document.getElementById('words'),
  caret: document.getElementById('caret'),
  input: document.getElementById('hiddenInput'),
  results: document.getElementById('results'),
  board: document.querySelector('.board')
};

// ---------- State ----------
const state = {
  running: false,
  startedAt: 0,
  timerId: null,
  duration: parseInt(el.duration.value, 10),
  words: [],
  wordIndex: 0,
  charIndex: 0,
  typed: 0,
  correct: 0,
  incorrect: 0,
};

// ---------- Utilities ----------
function sampleWords(set, count = 180) {
  const pool = WORDS[set];
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return arr;
}

function renderWords() {
  el.words.innerHTML = '';
  state.words.forEach((word, wi) => {
    const w = document.createElement('span');
    w.className = 'word' + (wi === state.wordIndex ? ' current' : '');
    for (let i = 0; i < word.length; i++) {
      const c = document.createElement('span');
      c.className = 'char pending';
      c.textContent = word[i];
      w.appendChild(c);
    }

    const spacer = document.createElement('span');
    spacer.textContent = ' ';
    w.appendChild(spacer);
    el.words.appendChild(w);
  });
  moveCaretToCurrent();
}

function moveCaretToCurrent() {
  const currentWord = el.words.children[state.wordIndex];
  if (!currentWord) return;
  const charEl = currentWord.querySelectorAll('.char')[state.charIndex];
  const target = charEl || currentWord.lastChild;
  const rect = target.getBoundingClientRect();
  const parentRect = el.words.getBoundingClientRect();
  const caretX = rect.left - parentRect.left + (charEl ? 0 : 2) + 18;
  const caretY = rect.top - parentRect.top + 20;
  el.caret.style.left = caretX + 'px';
  el.caret.style.top = caretY + 'px';
}

function updateHUD() {
  const elapsed = (Date.now() - state.startedAt) / 60000;
  const wpm = elapsed > 0 ? Math.round((state.correct / 5) / elapsed) : 0;
  const acc = state.typed > 0 ? Math.max(0, Math.round((state.correct / state.typed) * 100)) : 100;
  el.wpm.textContent = String(wpm);
  el.acc.textContent = acc + '%';
}

function tick() {
  const left = state.duration - Math.floor((Date.now() - state.startedAt) / 1000);
  el.time.textContent = Math.max(0, left);
  updateHUD();
  if (left <= 0) finish();
}

function start() {
  if (state.running) return;
  reset(true);
  state.duration = parseInt(el.duration.value, 10);
  el.time.textContent = state.duration;
  state.words = sampleWords(el.wordset.value);
  renderWords();
  state.running = true;
  state.startedAt = Date.now();
  state.timerId = setInterval(tick, 100);
  el.input.focus();
  el.results.innerHTML = '';
}

function finish() {
  if (!state.running) return;
  clearInterval(state.timerId);
  state.running = false;
  updateHUD();
  el.time.textContent = '0';
  el.input.blur();
  const wpm = parseInt(el.wpm.textContent, 10) || 0;
  const acc = parseInt((el.acc.textContent || '0').replace('%', ''), 10) || 0;
  const best = JSON.parse(localStorage.getItem('tsg_high') || 'null');
  const record = { wpm, acc, date: new Date().toISOString() };
  if (!best || wpm > best.wpm || (wpm === best.wpm && acc > best.acc)) {
    localStorage.setItem('tsg_high', JSON.stringify(record));
    showResults(record, true);
    updateHigh();
  } else {
    showResults(record, false);
  }
}

function reset(soft = false) {
  clearInterval(state.timerId);
  state.running = false;
  state.startedAt = 0;
  state.timerId = null;
  state.wordIndex = 0;
  state.charIndex = 0;
  state.typed = 0;
  state.correct = 0;
  state.incorrect = 0;
  if (!soft) {
    state.words = sampleWords(el.wordset.value);
    renderWords();
    el.time.textContent = el.duration.value;
    el.wpm.textContent = '0';
    el.acc.textContent = '100%';
    el.results.innerHTML = '';
  }
  moveCaretToCurrent();
  el.input.value = '';
}

function updateHigh() {
  const best = JSON.parse(localStorage.getItem('tsg_high') || 'null');
  el.high.textContent = best ? `${best.wpm} WPM` : '—';
}

function showResults(record, isHigh) {
  const wordsTyped = state.wordIndex + (state.charIndex > 0 ? 1 : 0);
  const totalChars = state.correct + state.incorrect;
  el.results.innerHTML = `
    <div class="card">
      <div class="label">Results</div>
      <div class="value" style="font-size: 28px;">${record.wpm} WPM • ${record.acc}% accuracy</div>
      <div class="high">${isHigh ? '🎉 New high score saved locally!' : 'High score unchanged.'}</div>
      <div style="margin-top:8px;color:var(--muted);font-size:14px;">
        Words typed: <b>${wordsTyped}</b> • Correct chars: <b>${state.correct}</b> • Incorrect chars: <b>${state.incorrect}</b> • Total chars: <b>${totalChars}</b>
      </div>
    </div>`;
}

// ---------- Typing Logic ----------
function handleKey(e) {
  if (!state.running) {
    if (e.key === 'Enter') start();
    return;
  }

  const currentWord = state.words[state.wordIndex];
  const currentWordEl = el.words.children[state.wordIndex];
  const chars = currentWordEl.querySelectorAll('.char');

  if (e.key === ' ') {
    e.preventDefault();
    for (let i = state.charIndex; i < currentWord.length; i++) {
      chars[i].classList.remove('pending');
      chars[i].classList.add('incorrect');
      state.incorrect++; state.typed++;
    }
    state.wordIndex++;
    state.charIndex = 0;
    el.words.querySelectorAll('.word').forEach((w, i) => {
      w.classList.toggle('current', i === state.wordIndex);
    });
    moveCaretToCurrent();
    return;
  }

  if (e.key === 'Backspace') {
    e.preventDefault();
    if (state.charIndex > 0) {
      state.charIndex--;
      const cEl = chars[state.charIndex];
      if (cEl.classList.contains('incorrect')) {
        state.incorrect--; state.typed--;
      } else if (cEl.classList.contains('correct')) {
        state.correct--; state.typed--;
      }
      cEl.classList.remove('correct', 'incorrect');
      cEl.classList.add('pending');
      moveCaretToCurrent();
    } else if (state.wordIndex > 0) {
      state.wordIndex--;
      const prevWord = el.words.children[state.wordIndex];
      const prevChars = prevWord.querySelectorAll('.char');
      let backTo = prevChars.length;
      while (backTo > 0 && prevChars[backTo - 1].classList.contains('pending')) backTo--;
      state.charIndex = backTo;
      el.words.querySelectorAll('.word').forEach((w, i) => {
        w.classList.toggle('current', i === state.wordIndex);
      });
      moveCaretToCurrent();
    }
    return;
  }

  if (e.key.length === 1) {
    const expected = currentWord[state.charIndex];
    const cEl = chars[state.charIndex];
    if (!expected) return;
    if (e.key === expected) {
      cEl.classList.remove('pending', 'incorrect');
      cEl.classList.add('correct');
      state.correct++; state.typed++;
    } else {
      cEl.classList.remove('pending', 'correct');
      cEl.classList.add('incorrect');
      state.incorrect++; state.typed++;
    }
    state.charIndex++;
    moveCaretToCurrent();
  }

  updateHUD();
}

// ---------- Focus handling ----------
el.board.addEventListener('click', () => el.input.focus());
el.board.addEventListener('touchstart', () => el.input.focus());


function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

if (!isMobile()) {
  
  el.input.addEventListener('keydown', handleKey);
} else {
  
  el.input.addEventListener('input', (e) => {
    const value = e.target.value;

   
    if (value.endsWith(' ')) {
      handleKey({ key: ' ', preventDefault: () => e.preventDefault() });
      e.target.value = '';
      return;
    }

   
    if (value.length < state.charIndex) {
      handleKey({ key: 'Backspace', preventDefault: () => e.preventDefault() });
      return;
    }

    
    const newChar = value[value.length - 1];
    if (newChar) {
      handleKey({ key: newChar, preventDefault: () => e.preventDefault() });
    }
  });
}

// Buttons
el.startBtn.addEventListener('click', start);
el.resetBtn.addEventListener('click', () => reset());
el.resetHighBtn = document.getElementById('resetHighBtn');
el.resetHighBtn.addEventListener('click', () => {
  localStorage.removeItem('tsg_high');
  el.high.textContent = '—';
  el.results.innerHTML = `
    <div class="card">
      <div class="label">High Score</div>
      <div class="value" style="font-size: 20px;">Reset to default</div>
    </div>`;
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !state.running) start();
});

function init() {
  updateHigh();
  state.words = sampleWords(el.wordset.value);
  renderWords();
  el.time.textContent = el.duration.value;
  moveCaretToCurrent();
}

el.wordset.addEventListener('change', () => {
  if (!state.running) {
    state.words = sampleWords(el.wordset.value);
    renderWords();
  }
});

el.duration.addEventListener('change', () => {
  if (!state.running) {
    el.time.textContent = el.duration.value;
  }
});

el.input.addEventListener('focus', () => {
  el.board.scrollIntoView({ block: 'center', behavior: 'auto' });
});

window.addEventListener('resize', moveCaretToCurrent);

init();
