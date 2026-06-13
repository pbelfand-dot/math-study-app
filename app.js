// ===== Pre-Calc Final Prep — App =====

// ---------- Persistence ----------
const STORE_KEY = "precalc-prep-v1";

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrupted store, start fresh */ }
  return { perQuestion: {}, missed: [], tests: [], bestStreak: 0 };
}
function saveStore() { localStorage.setItem(STORE_KEY, JSON.stringify(store)); }
let store = loadStore();

function recordResult(qid, correct) {
  const s = store.perQuestion[qid] || { right: 0, wrong: 0 };
  if (correct) s.right++; else s.wrong++;
  store.perQuestion[qid] = s;
  const i = store.missed.indexOf(qid);
  if (correct) { if (i !== -1) store.missed.splice(i, 1); }
  else { if (i === -1) store.missed.push(qid); }
  saveStore();
}

// ---------- Math rendering ----------
function renderMath(el) {
  if (window.renderMathInElement) {
    try {
      renderMathInElement(el, {
        delimiters: [
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
      });
    } catch (e) { /* leave plain text */ }
  }
}
function setMath(el, html) { el.innerHTML = html; renderMath(el); }

// ---------- Answer checking (type-in) ----------
function parseNumeric(s) {
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = parseFloat(frac[2]);
    if (d === 0) return null;
    return parseFloat(frac[1]) / d;
  }
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return parseFloat(s);
  return null;
}
function checkInputAnswer(user, accepted) {
  const norm = (x) => String(x).trim().toLowerCase().replace(/\s+/g, "").replace(/^\+/, "").replace(/^\$/, "").replace(/,/g, "");
  const u = norm(user);
  if (!u) return false;
  if (accepted.some((a) => norm(a) === u)) return true;
  const un = parseNumeric(u);
  if (un === null) return false;
  return accepted.some((a) => {
    const an = parseNumeric(norm(a));
    return an !== null && Math.abs(an - un) < 0.011;
  });
}

// ---------- Utils ----------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const $ = (id) => document.getElementById(id);
const LETTERS = ["A", "B", "C", "D"];
const QBYID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

// ---------- Navigation ----------
const SCREENS = ["home", "practice-setup", "test-setup", "quiz", "test-review", "results", "reference"];
function show(name) {
  SCREENS.forEach((s) => $("screen-" + s).classList.toggle("hidden", s !== name));
  window.scrollTo(0, 0);
  if (name === "home") renderHome();
}
document.querySelectorAll("[data-nav]").forEach((b) =>
  b.addEventListener("click", () => {
    if (session && !session.finished && !confirmLeave()) return;
    show(b.dataset.nav);
  })
);
function confirmLeave() {
  const ok = confirm("Leave this session? Your progress on this quiz/test will be lost.");
  if (ok) { stopTimer(); session = null; }
  return ok;
}

// ---------- Home ----------
function renderHome() {
  $("streak-badge").textContent = "🔥 " + (store.bestStreak || 0);
  const n = store.missed.length;
  $("missed-count-sub").textContent = n
    ? `Redo the ${n} question${n === 1 ? "" : "s"} you've missed`
    : "No missed questions yet — nice!";

  // Topic progress
  const tp = $("topic-progress");
  tp.innerHTML = "";
  Object.entries(TOPICS).forEach(([key, label]) => {
    const qs = QUESTIONS.filter((q) => q.topic === key);
    let right = 0, attempted = 0;
    qs.forEach((q) => {
      const s = store.perQuestion[q.id];
      if (s && s.right + s.wrong > 0) {
        attempted++;
        if (s.right > s.wrong || (s.right > 0 && s.wrong === 0)) right++;
      }
    });
    const seenPct = Math.round((attempted / qs.length) * 100);
    const acc = attempted ? Math.round((right / attempted) * 100) : 0;
    const row = document.createElement("div");
    row.className = "topic-row";
    row.innerHTML = `
      <span class="topic-name">${label}</span>
      <span class="topic-stat">${attempted}/${qs.length} tried${attempted ? ` · ${acc}% solid` : ""}</span>
      <div class="bar"><div class="bar-fill ${attempted && acc >= 80 ? "good" : acc < 50 && attempted ? "bad" : ""}" style="width:${seenPct}%"></div></div>`;
    tp.appendChild(row);
  });

  // Test history
  const th = $("test-history");
  if (!store.tests.length) {
    th.innerHTML = `<span class="muted">No tests taken yet — go take one!</span>`;
  } else {
    th.innerHTML = "";
    store.tests.slice(-6).reverse().forEach((t) => {
      const row = document.createElement("div");
      row.className = "history-row";
      row.innerHTML = `<span>${t.label}</span><span class="muted">${t.date}</span><span class="history-score">${t.score}/${t.total} (${Math.round((100 * t.score) / t.total)}%)</span>`;
      th.appendChild(row);
    });
  }
}

$("btn-reset").addEventListener("click", () => {
  if (confirm("Really wipe ALL progress (stats, streaks, test history)?")) {
    store = { perQuestion: {}, missed: [], tests: [], bestStreak: 0 };
    saveStore();
    renderHome();
  }
});

$("btn-review-missed").addEventListener("click", () => {
  if (!store.missed.length) { alert("Nothing to fix — you haven't missed any questions yet. Go practice!"); return; }
  const qs = shuffle(store.missed.map((id) => QBYID[id]).filter(Boolean));
  startSession({ mode: "practice", label: "Fixing mistakes", questions: qs });
});

// ---------- Practice setup ----------
const selectedTopics = new Set(Object.keys(TOPICS).filter((k) => !NON_FINAL_TOPICS.includes(k)));
function renderTopicChips() {
  const wrap = $("topic-chips");
  wrap.innerHTML = "";
  Object.entries(TOPICS).forEach(([key, label]) => {
    const b = document.createElement("button");
    b.className = "chip" + (selectedTopics.has(key) ? " selected" : "");
    b.textContent = NON_FINAL_TOPICS.includes(key) ? label + " (not on your final)" : label;
    b.addEventListener("click", () => {
      if (selectedTopics.has(key)) selectedTopics.delete(key); else selectedTopics.add(key);
      b.classList.toggle("selected");
    });
    wrap.appendChild(b);
  });
}
renderTopicChips();
$("chips-all").addEventListener("click", () => { Object.keys(TOPICS).forEach((k) => selectedTopics.add(k)); renderTopicChips(); });
$("chips-none").addEventListener("click", () => { selectedTopics.clear(); renderTopicChips(); });

function singleSelect(containerId, attr) {
  $(containerId).querySelectorAll(".chip").forEach((b) =>
    b.addEventListener("click", () => {
      $(containerId).querySelectorAll(".chip").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    })
  );
}
singleSelect("calc-chips");
singleSelect("count-chips");

$("btn-start-practice").addEventListener("click", () => {
  if (!selectedTopics.size) { alert("Pick at least one topic!"); return; }
  const calcMode = $("calc-chips").querySelector(".selected").dataset.calc;
  const countSel = $("count-chips").querySelector(".selected").dataset.count;
  let pool = QUESTIONS.filter((q) => selectedTopics.has(q.topic));
  if (calcMode === "no") pool = pool.filter((q) => !q.calc);
  if (calcMode === "yes") pool = pool.filter((q) => q.calc);
  if (!pool.length) { alert("No questions match those filters — try widening them."); return; }
  let qs = shuffle(pool);
  if (countSel !== "all") qs = qs.slice(0, parseInt(countSel, 10));
  startSession({ mode: "practice", label: "Practice", questions: qs });
});

// ---------- Test setup ----------
const TEST_CONFIG = {
  no: { label: "No-Calculator Section", count: 20, minutes: 35 },
  yes: { label: "Calculator Section", count: 15, minutes: 35 },
};
document.querySelectorAll("[data-test]").forEach((b) =>
  b.addEventListener("click", () => startTest(b.dataset.test))
);
function startTest(kind) {
  const cfg = TEST_CONFIG[kind];
  // Tests mirror the real Math 4H final: only topics from the review packets.
  const finalPool = QUESTIONS.filter((q) => !NON_FINAL_TOPICS.includes(q.topic));
  // Calculator section: prefer calc questions, top up with no-calc ones
  // (the real calculator section also includes problems doable by hand).
  let pool, extra;
  if (kind === "yes") {
    pool = shuffle(finalPool.filter((q) => q.calc));
    extra = shuffle(finalPool.filter((q) => !q.calc));
  } else {
    pool = shuffle(finalPool.filter((q) => !q.calc));
    extra = [];
  }
  const qs = pool.concat(extra).slice(0, cfg.count);
  startSession({
    mode: "test", kind, label: cfg.label, questions: qs,
    secondsLeft: cfg.minutes * 60,
  });
}

// ---------- Session engine ----------
let session = null;
let timerHandle = null;

function startSession(opts) {
  session = {
    mode: opts.mode,               // "practice" | "test"
    kind: opts.kind || null,
    label: opts.label,
    questions: opts.questions,
    idx: 0,
    // practice state
    streak: 0,
    answeredCount: 0,
    correctCount: 0,
    checked: false,
    // test state
    responses: new Array(opts.questions.length).fill(null), // mc: index, input: string
    flags: new Array(opts.questions.length).fill(false),
    secondsLeft: opts.secondsLeft || 0,
    finished: false,
  };
  $("quiz-mode-label").textContent = session.label;
  const isTest = session.mode === "test";
  $("quiz-timer").classList.toggle("hidden", !isTest);
  $("quiz-streak").classList.toggle("hidden", isTest);
  $("btn-flag").classList.toggle("hidden", !isTest);
  $("btn-back").classList.toggle("hidden", !isTest);
  $("btn-to-review").classList.toggle("hidden", !isTest);
  $("palette").classList.toggle("hidden", !isTest);
  if (isTest) startTimer();
  show("quiz");
  renderQuestion();
}

function startTimer() {
  stopTimer();
  updateTimerLabel();
  timerHandle = setInterval(() => {
    session.secondsLeft--;
    updateTimerLabel();
    if (session.secondsLeft <= 0) {
      stopTimer();
      alert("⏰ Time's up! Submitting your test.");
      finishTest();
    }
  }, 1000);
}
function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }
function updateTimerLabel() {
  const t = Math.max(0, session.secondsLeft);
  const m = Math.floor(t / 60), s = t % 60;
  const el = $("quiz-timer");
  el.textContent = `${m}:${String(s).padStart(2, "0")}`;
  el.classList.toggle("low", t <= 300);
}

function currentQ() { return session.questions[session.idx]; }

function renderQuestion() {
  const q = currentQ();
  const isTest = session.mode === "test";
  $("quiz-progress").textContent = `Question ${session.idx + 1} of ${session.questions.length}`;
  $("q-topic").textContent = TOPICS[q.topic];
  $("q-calc").textContent = q.calc ? "🧮 Calculator OK" : "🚫 No calculator";
  setMath($("q-text"), q.q);

  const choicesEl = $("choices");
  const inputArea = $("input-area");
  const fb = $("feedback");
  fb.classList.add("hidden");
  session.checked = false;

  if (q.type === "mc") {
    inputArea.classList.add("hidden");
    choicesEl.innerHTML = "";
    q.choices.forEach((c, i) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.innerHTML = `<span class="letter">${LETTERS[i]}</span><span class="choice-body">${c}</span>`;
      renderMath(b);
      if (isTest && session.responses[session.idx] === i) b.classList.add("selected");
      b.addEventListener("click", () => onChoose(i));
      choicesEl.appendChild(b);
    });
  } else {
    choicesEl.innerHTML = "";
    inputArea.classList.remove("hidden");
    const inp = $("input-answer");
    inp.value = isTest && session.responses[session.idx] != null ? session.responses[session.idx] : "";
    inp.className = "";
    inp.disabled = false;
    $("input-hint").textContent = q.hint || "Type your answer — fractions like 3/4 or decimals are fine:";
    setTimeout(() => inp.focus(), 0);
  }

  if (isTest) {
    $("btn-check").classList.add("hidden");
    $("btn-next").classList.remove("hidden");
    $("btn-next").textContent = session.idx === session.questions.length - 1 ? "To review screen →" : "Next →";
    $("btn-back").disabled = session.idx === 0;
    $("btn-flag").classList.toggle("flagged", session.flags[session.idx]);
    $("btn-flag").textContent = session.flags[session.idx] ? "🚩 Flagged" : "🚩 Flag for review";
    renderPalette();
  } else {
    $("btn-check").classList.remove("hidden");
    $("btn-check").disabled = false;
    $("btn-next").classList.add("hidden");
    $("quiz-streak").textContent = "🔥 " + session.streak;
  }
}

let practiceSelection = null;

function onChoose(i) {
  const q = currentQ();
  if (session.mode === "test") {
    session.responses[session.idx] = i;
    renderQuestion();
  } else {
    if (session.checked) return;
    practiceSelection = i;
    $("choices").querySelectorAll(".choice").forEach((b, j) => b.classList.toggle("selected", j === i));
  }
}

// Check answer (practice)
$("btn-check").addEventListener("click", checkPractice);
function checkPractice() {
  if (session.checked) return;
  const q = currentQ();
  let correct;
  if (q.type === "mc") {
    if (practiceSelection == null) { alert("Pick an answer first!"); return; }
    correct = practiceSelection === q.answer;
    $("choices").querySelectorAll(".choice").forEach((b, j) => {
      b.disabled = true;
      if (j === q.answer) b.classList.add("correct");
      else if (j === practiceSelection && !correct) b.classList.add("wrong");
    });
  } else {
    const val = $("input-answer").value;
    if (!val.trim()) { alert("Type an answer first!"); return; }
    correct = checkInputAnswer(val, q.answer);
    const inp = $("input-answer");
    inp.disabled = true;
    inp.classList.add(correct ? "correct" : "wrong");
  }

  session.checked = true;
  session.answeredCount++;
  if (correct) { session.correctCount++; session.streak++; } else { session.streak = 0; }
  if (session.streak > (store.bestStreak || 0)) { store.bestStreak = session.streak; saveStore(); }
  recordResult(q.id, correct);
  $("quiz-streak").textContent = "🔥 " + session.streak;

  const fb = $("feedback");
  const praise = ["Nailed it! 🎯", "Correct! 💪", "Yes! Keep it rolling 🔥", "That's it! ✅", "Boom. 🚀"];
  const encourage = ["Not quite — but now you'll never miss it again.", "Close! Read the explanation, it's a classic trap.", "This one's tricky. Here's the idea:"];
  let html = `<div class="verdict">${correct ? praise[Math.floor(Math.random() * praise.length)] : encourage[Math.floor(Math.random() * encourage.length)]}</div>`;
  if (!correct && q.type === "mc") html += `<div><strong>Correct answer: ${LETTERS[q.answer]}.</strong> ${q.choices[q.answer]}</div>`;
  if (!correct && q.type === "input") html += `<div><strong>Correct answer:</strong> ${q.answer[0]}</div>`;
  const simpleLine = q.simple || SIMPLE[q.id];
  if (simpleLine) html += `<div class="simple-box"><span class="simple-label">💡 In plain English</span>${simpleLine}</div>`;
  html += `<div class="expl-detail">${q.expl}</div>`;
  fb.className = "feedback " + (correct ? "good" : "bad");
  setMath(fb, html);
  fb.classList.remove("hidden");

  $("btn-check").classList.add("hidden");
  const next = $("btn-next");
  next.classList.remove("hidden");
  next.textContent = session.idx === session.questions.length - 1 ? "See my results →" : "Next →";
  practiceSelection = null;
  next.focus();
}

$("btn-next").addEventListener("click", () => {
  if (session.mode === "test") {
    if ($("input-area").classList.contains("hidden") === false) saveInputResponse();
    if (session.idx === session.questions.length - 1) { showTestReview(); return; }
    session.idx++;
    renderQuestion();
  } else {
    if (session.idx === session.questions.length - 1) { finishPractice(); return; }
    session.idx++;
    renderQuestion();
  }
});

$("btn-back").addEventListener("click", () => {
  if (session.mode !== "test" || session.idx === 0) return;
  saveInputResponse();
  session.idx--;
  renderQuestion();
});

$("btn-flag").addEventListener("click", () => {
  session.flags[session.idx] = !session.flags[session.idx];
  renderQuestion();
});

$("btn-quit").addEventListener("click", () => {
  if (confirmLeave()) show("home");
});

$("btn-to-review").addEventListener("click", () => { saveInputResponse(); showTestReview(); });

function saveInputResponse() {
  if (session.mode !== "test") return;
  const q = currentQ();
  if (q.type === "input") {
    const v = $("input-answer").value.trim();
    session.responses[session.idx] = v || null;
  }
}

// Enter key handling
$("input-answer").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  if (session.mode === "practice" && !session.checked) checkPractice();
  else $("btn-next").click();
});

// Fraction / quick-input keypad: insert symbols at the cursor
document.querySelectorAll(".keypad .key").forEach((btn) => {
  btn.addEventListener("click", () => {
    const inp = $("input-answer");
    if (inp.disabled) return;
    if (btn.dataset.clear) {
      inp.value = "";
    } else {
      const ins = btn.dataset.ins;
      const start = inp.selectionStart ?? inp.value.length;
      const end = inp.selectionEnd ?? inp.value.length;
      inp.value = inp.value.slice(0, start) + ins + inp.value.slice(end);
      const pos = start + ins.length;
      inp.setSelectionRange(pos, pos);
    }
    inp.focus();
  });
});

// ---------- Test palette & review ----------
function renderPalette() {
  const p = $("palette");
  p.innerHTML = "";
  session.questions.forEach((q, i) => {
    const b = document.createElement("button");
    b.className = "palette-btn";
    if (session.responses[i] != null && session.responses[i] !== "") b.classList.add("answered");
    if (session.flags[i]) b.classList.add("flagged");
    if (i === session.idx) b.classList.add("current");
    b.textContent = i + 1;
    b.addEventListener("click", () => { saveInputResponse(); session.idx = i; renderQuestion(); });
    p.appendChild(b);
  });
}

function showTestReview() {
  const grid = $("review-grid");
  grid.innerHTML = "";
  session.questions.forEach((q, i) => {
    const cell = document.createElement("button");
    cell.className = "review-cell";
    const answered = session.responses[i] != null && session.responses[i] !== "";
    if (answered) cell.classList.add("answered");
    if (session.flags[i]) cell.classList.add("flagged");
    cell.innerHTML = `Q${i + 1} ${session.flags[i] ? "🚩" : ""}<span class="status">${answered ? "answered" : "⚠️ unanswered"}</span>`;
    cell.addEventListener("click", () => { session.idx = i; show("quiz"); renderQuestion(); });
    grid.appendChild(cell);
  });
  show("test-review");
}
$("btn-review-back").addEventListener("click", () => { show("quiz"); renderQuestion(); });
$("btn-submit-test").addEventListener("click", () => {
  const blank = session.responses.filter((r) => r == null || r === "").length;
  if (blank && !confirm(`You have ${blank} unanswered question${blank === 1 ? "" : "s"}. Submit anyway?`)) return;
  finishTest();
});

// ---------- Finishing ----------
function gradeResponse(q, resp) {
  if (resp == null || resp === "") return false;
  return q.type === "mc" ? resp === q.answer : checkInputAnswer(resp, q.answer);
}

function finishTest() {
  stopTimer();
  saveInputResponse();
  session.finished = true;
  const results = session.questions.map((q, i) => {
    const correct = gradeResponse(q, session.responses[i]);
    recordResult(q.id, correct);
    return { q, resp: session.responses[i], correct };
  });
  const score = results.filter((r) => r.correct).length;
  store.tests.push({
    label: session.label, score, total: results.length,
    date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
  });
  saveStore();
  renderResults(results, score, true);
}

function finishPractice() {
  session.finished = true;
  const score = session.correctCount, total = session.answeredCount;
  renderResults(null, score, false, total);
}

function scoreMessage(pct) {
  if (pct >= 90) return "Outstanding. You're walking into that final ready. 🏆";
  if (pct >= 80) return "Strong! Polish the few you missed and you're golden. ✨";
  if (pct >= 70) return "Solid base — drill your weak topics and retake. 📈";
  if (pct >= 50) return "Good effort. Read every explanation below, then go again. 💪";
  return "This is exactly why you're practicing early. Review, then rematch. 🔁";
}

function renderResults(results, score, isTest, totalOverride) {
  const total = isTest ? results.length : totalOverride;
  const pct = total ? Math.round((100 * score) / total) : 0;
  $("results-summary").innerHTML = `
    <div class="score-big">${score}/${total}</div>
    <div class="muted">${pct}%</div>
    <div class="score-msg">${scoreMessage(pct)}</div>`;

  // Topic breakdown (tests only)
  const bd = $("results-breakdown");
  bd.innerHTML = "";
  if (isTest) {
    const byTopic = {};
    results.forEach((r) => {
      const t = r.q.topic;
      byTopic[t] = byTopic[t] || { right: 0, total: 0 };
      byTopic[t].total++;
      if (r.correct) byTopic[t].right++;
    });
    const wrap = document.createElement("div");
    wrap.className = "topic-progress";
    Object.entries(byTopic).forEach(([t, s]) => {
      const p = Math.round((100 * s.right) / s.total);
      const row = document.createElement("div");
      row.className = "topic-row";
      row.innerHTML = `
        <span class="topic-name">${TOPICS[t]}</span>
        <span class="topic-stat">${s.right}/${s.total}</span>
        <div class="bar"><div class="bar-fill ${p >= 80 ? "good" : p < 50 ? "bad" : ""}" style="width:${p}%"></div></div>`;
      wrap.appendChild(row);
    });
    bd.appendChild(wrap);
  }

  // Detailed review (tests only — practice already showed feedback live)
  const detail = $("results-detail");
  detail.innerHTML = "";
  if (isTest) {
    results.forEach((r, i) => {
      const div = document.createElement("div");
      div.className = "result-item " + (r.correct ? "right" : "wrong");
      let yourAns = "—";
      if (r.resp != null && r.resp !== "") {
        yourAns = r.q.type === "mc" ? `${LETTERS[r.resp]}. ${r.q.choices[r.resp]}` : String(r.resp);
      }
      const rightAns = r.q.type === "mc" ? `${LETTERS[r.q.answer]}. ${r.q.choices[r.q.answer]}` : r.q.answer[0];
      div.innerHTML = `
        <div class="ri-head">${r.correct ? "✅" : "❌"} Question ${i + 1} · ${TOPICS[r.q.topic]}</div>
        <div class="ri-q">${r.q.q}</div>
        <div class="ri-ans"><strong>Your answer:</strong> ${yourAns}</div>
        ${r.correct ? "" : `<div class="ri-ans"><strong>Correct answer:</strong> ${rightAns}</div>`}
        ${(r.q.simple || SIMPLE[r.q.id]) ? `<div class="simple-box"><span class="simple-label">💡 In plain English</span>${r.q.simple || SIMPLE[r.q.id]}</div>` : ""}
        <div class="ri-expl">${r.q.expl}</div>`;
      renderMath(div);
      detail.appendChild(div);
    });
    detail.previousElementSibling.classList.remove("hidden");
  } else {
    detail.previousElementSibling.classList.add("hidden");
  }

  const lastSession = { mode: session.mode, kind: session.kind };
  $("btn-retake").onclick = () => {
    if (lastSession.mode === "test") startTest(lastSession.kind);
    else show("practice-setup");
  };

  session = null;
  show("results");
}

// ---------- Countdown line ----------
(function () {
  // Final is ~4 days from first use; store the target date once.
  if (!store.examDate) {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    store.examDate = d.toISOString().slice(0, 10);
    saveStore();
  }
  const days = Math.ceil((new Date(store.examDate) - new Date()) / 86400000);
  const el = $("countdown-line");
  if (days > 1) el.textContent = `≈ ${days} days until the final. A little every day beats cramming.`;
  else if (days === 1) el.textContent = "Final is TOMORROW. Review your missed questions and the cheat sheet. You've got this.";
  else if (days === 0) el.textContent = "It's final day! Light review only — trust your prep. 🍀";
  else el.textContent = "You've got this. A little every day beats cramming.";
})();

// ---------- Reference / cheat sheet ----------
const REFERENCE_HTML = `
<div class="ref-card">
  <h2>Derivatives — rules</h2>
  <ul>
    <li><strong>Power:</strong> \\(\\frac{d}{dx}x^n = nx^{n-1}\\) (rewrite \\(\\sqrt{x} = x^{1/2}\\), \\(\\frac{1}{x^2} = x^{-2}\\) first)</li>
    <li><strong>Product:</strong> \\((uv)' = u'v + uv'\\) &nbsp;·&nbsp; <strong>Quotient:</strong> \\(\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}\\) (top order matters!)</li>
    <li><strong>Chain:</strong> \\(\\frac{d}{dx}f(g(x)) = f'(g(x))\\cdot g'(x)\\) — outside derivative, keep the inside, times inside derivative</li>
    <li>\\(\\frac{d}{dx}\\sin x = \\cos x\\); \\(\\frac{d}{dx}\\cos x = -\\sin x\\); \\(\\frac{d}{dx}\\tan x = \\sec^2 x\\); \\(\\frac{d}{dx}e^{kx} = ke^{kx}\\); \\(\\frac{d}{dx}\\ln x = \\frac{1}{x}\\)</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Derivatives — applications (tangent lines &amp; motion)</h2>
  <ul>
    <li><strong>Tangent line at \\(x = a\\):</strong> point \\((a, f(a))\\), slope \\(f'(a)\\), then \\(y - f(a) = f'(a)(x - a)\\)</li>
    <li><strong>Increasing/decreasing:</strong> \\(f\\) increases where \\(f' > 0\\), decreases where \\(f' < 0\\). Make a sign chart of \\(f'\\).</li>
    <li><strong>Relative extrema:</strong> only where \\(f'\\) CHANGES sign. A squared factor like \\((x+3)^2\\) means NO extremum there.</li>
    <li><strong>Particle motion:</strong> velocity \\(v = s'\\), acceleration \\(a = v' = s''\\). Moving left: \\(v < 0\\). At rest: \\(v = 0\\).</li>
    <li><strong>Speed:</strong> increasing when \\(v\\) and \\(a\\) have the SAME sign; decreasing when opposite signs. Always justify with both signs.</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Integrals &amp; Riemann sums</h2>
  <ul>
    <li><strong>Reverse power rule:</strong> \\(\\int x^n dx = \\frac{x^{n+1}}{n+1} + C\\); definite: \\(\\int_a^b f = F(b) - F(a)\\)</li>
    <li>Example: \\(\\int_2^3 x^{-2}dx = \\left[-\\frac{1}{x}\\right]_2^3 = -\\frac{1}{3} + \\frac{1}{2} = \\frac{1}{6}\\)</li>
    <li><strong>Left Riemann sum:</strong> width of each subinterval × LEFT endpoint's height, then add. (Right sum uses right endpoints.)</li>
    <li>Increasing function → left sum underestimates, right sum overestimates.</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Limits &amp; continuity</h2>
  <ul>
    <li>Plug in first. \\(\\frac{0}{0}\\) → factor and cancel, then plug in.</li>
    <li>At \\(\\pm\\infty\\): compare degrees — equal degrees → ratio of leading coefficients; bottom bigger → 0; top bigger → \\(\\pm\\infty\\).</li>
    <li>Two-sided limit exists only if left limit = right limit (otherwise DNE).</li>
    <li><strong>Continuity at \\(a\\):</strong> \\(f(a)\\) defined, \\(\\lim_{x\\to a} f\\) exists, and they're equal. To find \\(k\\): set \\(k = \\lim_{x\\to a} f(x)\\).</li>
    <li><strong>IVT:</strong> if \\(f\\) is continuous on \\([a,b]\\) and \\(N\\) is between \\(f(a)\\) and \\(f(b)\\), then \\(f(c) = N\\) for some \\(c\\) in \\((a,b)\\). Sign change → a zero in between. Cite continuity + the sign change.</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Unit circle — the values to know cold</h2>
  <table>
    <tr><th>\\(\\theta\\)</th><th>\\(0\\)</th><th>\\(\\frac{\\pi}{6}\\) (30°)</th><th>\\(\\frac{\\pi}{4}\\) (45°)</th><th>\\(\\frac{\\pi}{3}\\) (60°)</th><th>\\(\\frac{\\pi}{2}\\) (90°)</th></tr>
    <tr><td>\\(\\sin\\theta\\)</td><td>\\(0\\)</td><td>\\(\\frac{1}{2}\\)</td><td>\\(\\frac{\\sqrt2}{2}\\)</td><td>\\(\\frac{\\sqrt3}{2}\\)</td><td>\\(1\\)</td></tr>
    <tr><td>\\(\\cos\\theta\\)</td><td>\\(1\\)</td><td>\\(\\frac{\\sqrt3}{2}\\)</td><td>\\(\\frac{\\sqrt2}{2}\\)</td><td>\\(\\frac{1}{2}\\)</td><td>\\(0\\)</td></tr>
    <tr><td>\\(\\tan\\theta\\)</td><td>\\(0\\)</td><td>\\(\\frac{\\sqrt3}{3}\\)</td><td>\\(1\\)</td><td>\\(\\sqrt3\\)</td><td>undef.</td></tr>
  </table>
  <ul>
    <li>Memory hook: \\(\\sin\\) of 30/45/60 is \\(\\frac{\\sqrt1}{2}, \\frac{\\sqrt2}{2}, \\frac{\\sqrt3}{2}\\); cosine is the same list backwards.</li>
    <li>Signs by quadrant — <strong>A</strong>ll, <strong>S</strong>ine, <strong>T</strong>angent, <strong>C</strong>osine (ASTC: "All Students Take Calculus").</li>
    <li>Reference angles: QII → \\(\\pi - \\theta\\), QIII → \\(\\theta - \\pi\\), QIV → \\(2\\pi - \\theta\\).</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Trig identities</h2>
  <ul>
    <li><strong>Pythagorean:</strong> \\(\\sin^2\\theta + \\cos^2\\theta = 1\\), \\(1 + \\tan^2\\theta = \\sec^2\\theta\\), \\(1 + \\cot^2\\theta = \\csc^2\\theta\\)</li>
    <li><strong>Double angle:</strong> \\(\\sin 2\\theta = 2\\sin\\theta\\cos\\theta\\); \\(\\cos 2\\theta = \\cos^2\\theta - \\sin^2\\theta = 1 - 2\\sin^2\\theta = 2\\cos^2\\theta - 1\\)</li>
    <li><strong>Sum/difference:</strong> \\(\\sin(A \\pm B) = \\sin A\\cos B \\pm \\cos A\\sin B\\); \\(\\cos(A \\pm B) = \\cos A\\cos B \\mp \\sin A\\sin B\\) (cosine flips the sign!)</li>
    <li><strong>Even/odd:</strong> \\(\\cos(-\\theta) = \\cos\\theta\\) (even); \\(\\sin(-\\theta) = -\\sin\\theta\\), \\(\\tan(-\\theta) = -\\tan\\theta\\) (odd)</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Trig graphs: \\(y = A\\sin(B(x - C)) + D\\)</h2>
  <ul>
    <li>Amplitude \\(= |A|\\) &nbsp;·&nbsp; Period \\(= \\frac{2\\pi}{B}\\) (tangent: \\(\\frac{\\pi}{B}\\)) &nbsp;·&nbsp; Phase shift \\(= C\\) (right if subtracting) &nbsp;·&nbsp; Midline \\(y = D\\)</li>
    <li>Max \\(= D + |A|\\), Min \\(= D - |A|\\)</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Triangles (non-right)</h2>
  <ul>
    <li><strong>Law of Sines:</strong> \\(\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}\\) — use with AAS/ASA/SSA. SSA is ambiguous: compare \\(a\\) with \\(h = b\\sin A\\) (0, 1, or 2 triangles).</li>
    <li><strong>Law of Cosines:</strong> \\(c^2 = a^2 + b^2 - 2ab\\cos C\\) — use with SAS/SSS.</li>
    <li><strong>Area:</strong> \\(\\frac{1}{2}ab\\sin C\\)</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Logs &amp; exponentials</h2>
  <ul>
    <li>\\(\\log_b x = y \\iff b^y = x\\). Domain of \\(\\log\\): input must be \\(> 0\\).</li>
    <li>\\(\\log(MN) = \\log M + \\log N\\); \\(\\log\\frac{M}{N} = \\log M - \\log N\\); \\(\\log M^p = p\\log M\\)</li>
    <li>Change of base: \\(\\log_b x = \\frac{\\ln x}{\\ln b}\\)</li>
    <li>Compound interest: \\(A = P(1 + \\frac{r}{n})^{nt}\\); continuous: \\(A = Pe^{rt}\\)</li>
    <li>Half-life / doubling: \\(y = a\\left(\\frac{1}{2}\\right)^{t/h}\\) or \\(y = a \\cdot 2^{t/d}\\)</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Polynomials &amp; rationals</h2>
  <ul>
    <li><strong>Remainder Thm:</strong> remainder of \\(f(x) \\div (x - c)\\) is \\(f(c)\\). <strong>Factor Thm:</strong> \\(f(c) = 0 \\iff (x - c)\\) is a factor.</li>
    <li>Complex &amp; irrational roots come in conjugate pairs (real/rational coefficients).</li>
    <li>Multiplicity: even → graph bounces; odd → graph crosses.</li>
    <li>Horizontal asymptote: degrees equal → ratio of leading coefficients; top smaller → \\(y = 0\\); top exactly 1 bigger → slant (divide).</li>
    <li>Denominator zero that cancels → hole; doesn't cancel → vertical asymptote.</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Sequences &amp; series</h2>
  <ul>
    <li><strong>Arithmetic:</strong> \\(a_n = a_1 + (n-1)d\\); \\(S_n = \\frac{n(a_1 + a_n)}{2}\\)</li>
    <li><strong>Geometric:</strong> \\(a_n = a_1 r^{n-1}\\); \\(S_n = a_1\\frac{1 - r^n}{1 - r}\\); infinite sum \\(\\frac{a_1}{1 - r}\\) only when \\(|r| < 1\\)</li>
    <li><strong>Binomial:</strong> \\((a + b)^n = \\sum \\binom{n}{k} a^{n-k} b^k\\)</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Conics (center at origin)</h2>
  <ul>
    <li><strong>Circle:</strong> \\((x-h)^2 + (y-k)^2 = r^2\\)</li>
    <li><strong>Ellipse:</strong> \\(\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1\\) with \\(a > b\\); foci: \\(c^2 = a^2 - b^2\\) on the major axis</li>
    <li><strong>Hyperbola:</strong> \\(\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1\\); foci: \\(c^2 = a^2 + b^2\\); asymptotes \\(y = \\pm\\frac{b}{a}x\\) (x-form)</li>
    <li><strong>Parabola:</strong> \\(x^2 = 4py\\) (opens up/down), focus distance \\(p\\) from vertex</li>
    <li>Identify: one square → parabola; same coefficients → circle; different, same sign → ellipse; opposite signs → hyperbola.</li>
  </ul>
</div>

<div class="ref-card">
  <h2>Vectors, polar &amp; parametric</h2>
  <ul>
    <li>\\(\\|\\langle a,b \\rangle\\| = \\sqrt{a^2+b^2}\\); dot product \\(\\langle a,b\\rangle\\cdot\\langle c,d\\rangle = ac + bd\\); perpendicular \\(\\iff\\) dot \\(= 0\\)</li>
    <li>Polar ↔ rectangular: \\(x = r\\cos\\theta\\), \\(y = r\\sin\\theta\\), \\(r^2 = x^2 + y^2\\), \\(\\tan\\theta = \\frac{y}{x}\\) (check the quadrant!)</li>
    <li>\\(r = a\\sin\\theta\\): circle of diameter \\(a\\) on top of the pole; \\(r = a\\cos\\theta\\): same circle, sideways.</li>
    <li><strong>Parametric → rectangular:</strong> solve the simpler equation for \\(t\\), substitute into the other.</li>
    <li><strong>Zeros of a parametric curve:</strong> set \\(y(t) = 0\\), solve for \\(t\\), plug that \\(t\\) into \\(x(t)\\).</li>
    <li><strong>Position on a polar curve:</strong> \\(\\langle r\\cos\\theta,\\ r\\sin\\theta \\rangle\\) — calculator in RADIAN mode.</li>
  </ul>
</div>
`;
setMath($("reference-body"), REFERENCE_HTML);

// ---------- Init ----------
renderHome();
window.addEventListener("load", () => { renderMath(document.body); });
