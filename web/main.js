import { SKILLS, SKILL_KEYS, PHYSICALS, MENTALS, MENTAL_KEYS } from '../src/constants.js';
import { rollCompleteBuild, formatHeight, clamp } from '../src/roll.js';
import { titleFor } from '../src/archetypes.js';
import { traitsFor } from '../src/traits.js';
import { writeVerdict } from '../src/verdict.js';
import { potentialGrade, positionFor, buildRarityTier } from '../src/overall.js';
import {
  draftNight, newPro, playSeason, freeAgencyOffers, signWith, acceptTrade, retire,
  proActions, doProAction, proMoney, careerLine, contractCeiling, supermaxEligible,
  LOAD_POLICIES, GAMES_THRESHOLD, resolveTrouble, resolveMedia,
} from '../src/pro.js';
import { REP_METERS, postCareerFor, CALENDAR, stateTaxFor } from '../src/league.js';
import { defaultRng } from '../src/rng.js';
import { randomName, randomTeam, randomOpponent } from '../src/names.js';
import { Progress } from '../src/progress.js';
import { ROLES, teamChemistry, coachTrust, personById } from '../src/people.js';
import {
  CATEGORIES, availableActions, actionsForPerson, doAction, blockedReason,
  focusActions, previewGain, sessionsLeft, strainWarning,
} from '../src/actions.js';
import { resolveChoice, rollGameDay, resolveGame, GAMES_PER_SEASON } from '../src/events.js';
import {
  newLife, advanceYear, overallNow, starRating, heightAt, gradeName,
  commit, declare, returnToSchool, proBuildFrom, draftProjection, projectedMinutes,
} from '../src/life.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const money = (n) => `$${Math.round(n).toLocaleString()}`;
const LABELS = {
  ...Object.fromEntries(Object.entries(SKILLS).map(([k, v]) => [k, v.label])),
  ...Object.fromEntries(Object.entries(PHYSICALS).map(([k, v]) => [k, v.label])),
  ...Object.fromEntries(Object.entries(MENTALS).map(([k, v]) => [k, v.label])),
};

const S = { life: null, prog: Progress.load(), career: null, verdict: null, wonBadges: null, sheet: null, sheetActions: [] };

// ---------------------------------------------------------------------------
// New life / resume
// ---------------------------------------------------------------------------
function startLife(name) {
  const rng = defaultRng;
  // The roll engine still runs in full — it is now describing genetics: the
  // height he finishes at and the ceiling on every attribute.
  const build = rollCompleteBuild(rng);
  S.life = newLife(build, (name || '').trim() || randomName(rng), rng);
  S.career = null;
  S.verdict = null;
  S.wonBadges = null;
  Progress.saveLife(S.life);
  closeSheet();
  render(true);
}

// Pick a life back up where it was left. A career that already finished is not
// resumable — there is nothing left to decide — so that one starts fresh.
function resumeOrStart() {
  const saved = Progress.loadLife();
  if (!saved || saved.stage === 'pro') { startLife(); return; }
  S.life = saved;
  // If the save had to be repaired on the way in, say so in the year's log
  // rather than silently changing a number the player was looking at.
  if (saved.healed) {
    saved.yearLog.push({
      kind: 'note',
      text: `A bug had corrupted your ${saved.healed.join(', ')}. It has been reset to something sensible.`,
    });
    delete saved.healed;
    Progress.saveLife(saved);
  }
  render(true);
  // A life saved mid-question re-asks it. Otherwise the answer would be lost
  // and the year would move on having quietly skipped a decision.
  if (S.life.games?.length) openGameDay();
  else if (S.life.choices?.length) openChoice();
  else if (S.life.pending) openDecision();
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
function idcardHtml() {
  const L = S.life;
  const college = L.stage === 'college';
  const stars = starRating(L);
  const where = college ? esc(L.program.school) : esc(L.school || L.background.name);
  const line2 = college
    ? (() => { const p = draftProjection(L); return `<span class="proj ${p.tone}">${esc(p.label)}</span>`; })()
    : `<span class="stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span>`;

  return `
    <div>
      <div class="nm">${esc(L.name)}</div>
      <div class="sub">${gradeName(L.age, L.stage)} &middot; ${formatHeight(heightAt(L))}
        &middot; OVR ${overallNow(L)} &middot; ${esc(L.teamRole)}</div>
      <div class="sub">${line2} &middot; ${where}</div>
    </div>
    <div class="stack">
      ${ppgHtml(L)}
      <div class="cash"><b>${money(L.money)}</b><span>Bank balance</span></div>
    </div>`;
}

// Scoring is the number the whole recruiting apparatus reacts to, so it belongs
// on the front screen rather than buried in the season log. Last season big,
// career average underneath, because "what am I averaging" and "what have I
// averaged" are different questions and both get asked.
function ppgHtml(L) {
  const seasons = L.log.filter((y) => y.stats);
  if (!seasons.length) return '<div class="cash ppg"><b>&mdash;</b><span>PPG</span></div>';
  // The last season that actually produced a box score, not the last season
  // full stop — a year lost to a cut or a redshirt should not blank out an
  // average you spent three years building.
  const last = seasons[seasons.length - 1].stats.ppg;
  const career = seasons.reduce((a, y) => a + y.stats.ppg, 0) / seasons.length;
  return `<div class="cash ppg">
    <b>${last.toFixed(1)}</b>
    <span>PPG &middot; ${career.toFixed(1)} career</span>
  </div>`;
}

const BARS = [
  ['happiness', 'Happiness', 'var(--happy)'],
  ['health', 'Health', 'var(--health)'],
  ['smarts', 'Smarts', 'var(--smarts)'],
];

function barsHtml() {
  const L = S.life;
  if (S.pro) {
    const P = S.pro;
    // Reputation is five separate audiences. One number told you nothing —
    // whether the front office likes you and whether the fans do are different
    // questions with different consequences.
    const COLS = { fans: 'var(--hype)', teammates: 'var(--chem)', frontOffice: 'var(--accent)',
      media: 'var(--warn)', leagueOffice: 'var(--rep)' };
    const rows = [
      [clamp(Math.round(100 - P.injuryHistory * 22), 0, 100), 'Body', 'var(--health)'],
      ...REP_METERS.map(([k, label]) => [Math.round(P.rep?.[k] ?? 50), label, COLS[k]]),
    ];
    return rows.map(([v, label, col]) => `<div class="row ${v < 25 ? 'low' : ''} ${v >= 88 ? 'full' : ''}">
      <div class="k">${label}</div>
      <div class="track"><div class="fill" style="width:${clamp(v, 0, 100)}%;background:${col}"></div><span class="v">${v}%</span></div>
    </div>`).join('');
  }
  const rows = [
    ...BARS.map(([k, label, col]) => [Math.round(L.stats[k]), label, col]),
    [Math.round(L.meters.rep), 'Reputation', 'var(--rep)'],
  ];
  return rows
    .map(([v, label, col]) => `<div class="row ${v < 25 ? 'low' : ''} ${v >= 88 ? 'full' : ''}">
      <div class="k">${label}</div>
      <div class="track"><div class="fill" style="width:${clamp(v, 0, 100)}%;background:${col}"></div><span class="v">${v}%</span></div>
    </div>`)
    .join('');
}

// ---------------------------------------------------------------------------
// The feed — oldest at the top, this year at the bottom, the way a life reads
// ---------------------------------------------------------------------------
function yearHtml(e) {
  const stats = e.stats
    ? `<div class="box">${esc(e.role)} &middot; ${e.stats.ppg} pts, ${e.stats.rpg} reb, ${e.stats.apg} ast in ${e.stats.mpg} min</div>`
    : `<div class="box">${esc(e.role)} &mdash; no stats this year</div>`;
  return `<article class="yr">
    <h3>${esc(e.grade)} year${e.school ? ` &middot; ${esc(e.school)}` : ''}
      <span class="meta">${formatHeight(e.height)} &middot; OVR ${e.ovr}${
        e.stage === 'college' ? '' : ` &middot; ${'★'.repeat(e.stars)}`
      }</span></h3>
    ${stats}
    ${e.events.map((v) => `<div class="line ${v.kind}">${esc(v.text)}</div>`).join('')}
  </article>`;
}

function feedHtml() {
  const L = S.life;
  if (S.pro) return proFeedHtml();
  if (S.career) return careerHtml();
  const past = L.log.map(yearHtml).join('');
  const now = `<article class="yr now">
    <h3>${esc(gradeName(L.age, L.stage))} year <span class="meta">in progress</span></h3>
    ${
      L.yearLog.length
        ? L.yearLog.map((v) => `<div class="line ${v.kind}">${esc(v.text)}</div>`).join('')
        : '<div class="empty">Nothing yet. Tap the buttons below, then press + Age.</div>'
    }
  </article>`;
  return past + now;
}

// ---------------------------------------------------------------------------
// The sheet — one component, several contents
// ---------------------------------------------------------------------------
function openSheet(kind, arg) {
  S.sheet = { kind, arg };
  drawSheet();
  $('sheet').classList.remove('hidden');
  $('scrim').classList.remove('hidden');
}
function closeSheet() {
  S.sheet = null;
  S.sheetActions = [];
  $('sheet').classList.add('hidden');
  $('scrim').classList.add('hidden');
  // Emptied, not just hidden. A hidden sheet full of last screen's buttons is
  // still in the accessibility tree and still matches a query, so it can be
  // acted on by something that has no business finding it.
  $('sheetBody').innerHTML = '';
}

// What a session is worth, per attribute, computed live — so an option that
// would move nothing says so before you spend a year on it rather than after.
function trainTags(a) {
  if (!a.trains) return '';
  return Object.entries(a.trains)
    .map(([k, w]) => [k, previewGain(S.life, k, w, a.mult ?? 1)])
    .sort((x, y) => y[1] - x[1])
    .map(([k, g]) => `<span class="tag ${g < 0.4 ? 'dim' : 'gain'}">${esc(LABELS[k])} ${g < 0.05 ? '—' : `+${g.toFixed(1)}`}</span>`)
    .join('');
}

function tagsFor(a, blocked) {
  const t = [];
  if (a.price) t.push(`<span class="tag spend">${money(a.price)}</span>`);
  t.push(trainTags(a));
  const wear = strainWarning(S.life, a);
  if (wear) t.push(`<span class="tag wear">${esc(wear)}</span>`);
  if (blocked) t.push(`<span class="tag no">${esc(blocked)}</span>`);
  const joined = t.filter(Boolean).join('');
  return joined ? `<span class="tags">${joined}</span>` : '';
}

function optRow(a, idx) {
  const blocked = blockedReason(S.life, a);
  return `<button class="opt" data-act="${idx}" type="button" ${blocked ? 'disabled' : ''}>
    <span>
      <span class="t">${esc(a.name)}</span>
      ${a.blurb ? `<span class="d">${esc(a.blurb)}</span>` : ''}
      ${tagsFor(a, blocked)}
    </span>
    <span class="go">&rsaquo;</span>
  </button>`;
}

// One attribute, worked on its own. The row carries the whole picture: where it
// is, how far your genetics let it go, what this session adds, and how many
// more are worth taking this year.
function focusRow(a, idx) {
  const spent = a.gain < 0.05;
  // The rolled ceiling is a marker on the bar, not the end of it. Once you are
  // past it the row says so, because "at your genetic ceiling" was a lie the
  // moment the cap stopped being a wall.
  const past = a.over > 0.5;
  return `<button class="opt focus" data-act="${idx}" type="button" ${spent ? 'disabled' : ''}>
    <span>
      <span class="t">${esc(a.name)} <b class="num">${a.now}${
        past ? `<i class="over">+${a.over.toFixed(0)}</i>` : ''
      }</b></span>
      <span class="bar"><span class="now ${past ? 'past' : ''}" style="width:${clamp(a.now, 0, 100)}%"></span>
        <span class="cap" style="left:${clamp(a.cap, 0, 99)}%"></span></span>
      <span class="tags">
        ${
          spent
            ? '<span class="tag dim">Nothing left in it this year</span>'
            : `<span class="tag gain">+${a.gain.toFixed(1)} this session</span>
               <span class="tag ${a.left <= 1 ? 'wear' : ''}">${a.left} more worth taking</span>`
        }
        ${past ? '<span class="tag past">Past what you were dealt</span>' : ''}
      </span>
    </span>
    <span class="go">&rsaquo;</span>
  </button>`;
}

const AVATAR = {
  father: '👨', mother: '👩', sibling: '🧒', coach: '📋', teammate: '🏀',
  trainer: '🏋️', friend: '🙂', partner: '💛', agent: '📞',
};
const relColour = (v) => (v >= 66 ? 'var(--good)' : v >= 38 ? 'var(--warn)' : 'var(--bad)');

function peopleListHtml() {
  const L = S.life;
  const order = ['coach', 'teammate', 'trainer', 'agent', 'mother', 'father', 'sibling', 'partner', 'friend'];
  const sorted = [...L.people].filter((p) => p.alive)
    .sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  let lastGroup = null;
  return sorted.map((p) => {
    const g = ROLES[p.role]?.group || 'Other';
    const head = g === lastGroup ? '' : `<div class="grp">${esc(g)}</div>`;
    lastGroup = g;
    return `${head}<button class="who" data-person="${p.id}" type="button">
      <span class="av">${AVATAR[p.role] || '🙂'}</span>
      <span>
        <span class="t">${esc(p.name)}</span>
        <span class="d">${esc(ROLES[p.role]?.label || p.role)}</span>
        <span class="relbar"><i style="width:${p.rel}%;background:${relColour(p.rel)}"></i></span>
      </span>
      <span class="go">&rsaquo;</span>
    </button>`;
  }).join('');
}

function drawSheet() {
  if (!S.sheet) return;
  const L = S.life;
  const { kind, arg } = S.sheet;
  const title = $('sheetTitle');
  const hint = $('sheetHint');
  const body = $('sheetBody');
  $('sheetBack').classList.toggle('off', kind !== 'person' && kind !== 'focus');

  if (kind === 'people') {
    title.textContent = 'People';
    hint.textContent = 'Your coach decides your minutes. Your teammates decide whether you get the ball.';
    body.innerHTML = peopleListHtml();
  } else if (kind === 'person') {
    const p = personById(L, arg);
    if (!p) { openSheet('people'); return; }
    const acts = actionsForPerson(L, p);
    S.sheetActions = acts;
    title.textContent = p.name;
    hint.textContent = `${ROLES[p.role]?.label || p.role} · relationship ${p.rel}%`;
    body.innerHTML = acts.map(optRow).join('');
  } else if (kind === 'stats') {
    title.textContent = 'You';
    hint.textContent = 'The bar is where you are. The notch is what you were dealt — you can train past it, and it costs years.';
    body.innerHTML = statsSheetHtml();
  } else if (kind === 'vault') {
    title.textContent = 'Vault';
    hint.textContent = 'Every finished career, and a backup you can carry off this device.';
    body.innerHTML = vaultHtml();
    wireBackup();
    return;
  } else if (kind === 'badges') {
    title.textContent = 'Achievements';
    hint.textContent = '';
    body.innerHTML = badgesHtml();
  } else if (kind === 'train' && S.pro) {
    const acts = proActions(S.pro);
    S.sheetActions = acts;
    title.textContent = 'Offseason';
    hint.textContent = 'April to September. Money is the constraint now, not time.';
    const P = S.pro;
    const row = (a, i) => {
      const broke = (a.cost || 0) > P.earnings;
      return `<button class="opt" data-pro="${i}" type="button" ${broke ? 'disabled' : ''}>
        <span><span class="t">${esc(a.name)}</span><span class="d">${esc(a.blurb)}</span>
        <span class="tags">${a.cost ? `<span class="tag spend">${proMoney(a.cost)}</span>` : '<span class="tag gain">free</span>'}
        ${broke ? '<span class="tag no">Cannot afford it</span>' : ''}</span></span>
        <span class="go">&rsaquo;</span></button>`;
    };
    // The offseason reads as a calendar rather than one long list: same actions,
    // sorted into the month they would actually happen in.
    // Months with nothing to decide still appear: draft night and the opening
    // of free agency happen to you whether or not you have a button for them,
    // and leaving them out would make the summer look like a list again.
    const months = CALENDAR.map((m) => {
      const rows = acts.map((a, i) => [a, i]).filter(([a]) => monthFor(a) === m.id);
      return `<div class="month${rows.length ? '' : ' quiet'}"><h4>${m.month} &middot; ${esc(m.label)}</h4>
        <p class="note">${esc(m.blurb)}</p>
        ${rows.map(([a, i]) => row(a, i)).join('')}</div>`;
    }).join('');
    body.innerHTML = acts.length ? months : '<p class="note">Nothing left to do but play.</p>';
    for (const el of body.querySelectorAll('[data-pro]')) {
      el.onclick = () => {
        const a = S.sheetActions[Number(el.dataset.pro)];
        if (a.media) { openMedia(a.media); return; }
        doProAction(S.pro, a, defaultRng);
        render(true);
        drawSheet();
      };
    }
    return;
  } else if (kind === 'focus') {
    const acts = focusActions(L);
    S.sheetActions = acts;
    title.textContent = 'Work one thing';
    hint.textContent = 'A second session on the same number is worth half, a third a fifth, a fourth nothing.';
    body.innerHTML = acts.map(focusRow).join('');
  } else {
    const cat = CATEGORIES.find((c) => c.id === kind);
    if (!cat) return;
    const acts = availableActions(L, kind);
    S.sheetActions = acts;
    title.textContent = cat.name;
    hint.textContent = cat.hint;
    const focusEntry = kind === 'train'
      ? `<button class="opt" data-focus="1" type="button">
           <span><span class="t">Work one thing</span>
           <span class="d">Pick a single attribute and grind it. Repeatable, up to a point.</span></span>
           <span class="go">&rsaquo;</span></button>`
      : '';
    body.innerHTML = focusEntry + (acts.length
      ? acts.map(optRow).join('')
      : (focusEntry ? '' : '<p class="note">Nothing here for you right now. That changes as your situation does.</p>'));
  }
  wireSheet();
}

// Which month of the offseason an action belongs to. Derived from the id so
// the catalogue in pro.js stays a catalogue and does not have to know about
// the calendar at all.
function monthFor(a) {
  const id = a.id;
  if (id === 'trade demand') return 'exit';
  if (id.startsWith('load:') || id.startsWith('media:')) return 'mediaday';
  if (id.startsWith('buy:') || id.startsWith('inv:') || id.startsWith('adv:')) return 'summer';
  if (id === 'entourage' || id === 'cutloose' || id === 'endorse' || id === 'community') return 'summer';
  return 'training';
}

function wireSheet() {
  const body = $('sheetBody');
  for (const el of body.querySelectorAll('[data-act]')) {
    el.onclick = () => {
      const a = S.sheetActions[Number(el.dataset.act)];
      if (!a) return;
      doAction(S.life, a, defaultRng);
      Progress.saveLife(S.life);
      render(true);
      drawSheet(); // gains and conditions have moved — redraw in place
    };
  }
  for (const el of body.querySelectorAll('[data-person]')) {
    el.onclick = () => openSheet('person', el.dataset.person);
  }
  const f = body.querySelector('[data-focus]');
  if (f) f.onclick = () => openSheet('focus');
}

// ---------------------------------------------------------------------------
// Game day
//
// Five games, one sheet, one tap each. Shown before the season resolves,
// because the season reads the form they produce.
// ---------------------------------------------------------------------------
function openGameDay() {
  const L = S.pro || S.life;
  const g = L.games?.[0];
  if (!g) { (S.pro ? finishSeason : finishYear)(); return; }
  S.sheet = { kind: 'gameday' };
  $('sheetBack').classList.add('off');
  $('sheetTitle').textContent = `Game ${g.no} of ${GAMES_PER_SEASON}`;
  $('sheetHint').textContent = `vs ${g.opponent}`;
  const form = L.gameForm ?? 0;
  $('sheetBody').innerHTML = `
    ${L.gameLog?.length ? `<div class="formline ${form > 0.08 ? 'good' : form < -0.08 ? 'bad' : ''}">
      ${L.gameLog.map((r) => `<i class="${r.made ? 'hit' : 'miss'}"></i>`).join('')}
      <span>${form > 0.25 ? 'Rolling' : form > 0.08 ? 'Going well' : form < -0.25 ? 'Nightmare season' : form < -0.08 ? 'Struggling' : 'Even'}</span>
    </div>` : ''}
    <p class="choice-text">${esc(g.text)}</p>
    ${g.options.map((label, i) => `<button class="btn choice" data-game="${i}" type="button">${esc(label)}</button>`).join('')}`;
  $('sheet').classList.remove('hidden');
  $('scrim').classList.remove('hidden');
  for (const el of $('sheetBody').querySelectorAll('[data-game]')) {
    el.onclick = () => {
      // A pro's possessions resolve against the same attributes, read off the
      // life's attribute block, so the maths is identical either way.
      const r = resolveGame(S.pro ? { ...S.life, gameForm: L.gameForm } : L, g.id, Number(el.dataset.game), defaultRng);
      if (S.pro) S.pro.gameForm = clamp((S.pro.gameForm ?? 0) + (r?.made ? 0.18 : -0.18), -1, 1);
      L.gameLog = L.gameLog || [];
      L.gameLog.push({ made: !!r?.made, text: r?.text || '', kind: r?.kind || 'note', opponent: g.opponent });
      L.games.shift();
      if (!S.pro) Progress.saveLife(L);
      if (L.games.length) openGameDay();
      else if (S.pro) finishSeason();
      else finishYear();
    };
  }
}

// A pro season resolves the same way: games first, then the year is written.
function finishSeason() {
  const P = S.pro;
  const played = P.gameLog || [];
  playSeason(P, defaultRng);
  if (played.length && P.seasons.length) {
    P.seasons[P.seasons.length - 1].events.unshift(
      ...played.map((r) => ({ kind: r.kind, text: `vs ${r.opponent} — ${r.text}` })),
    );
  }
  P.gameLog = [];
  P.games = [];
  P.log = [];
  closeSheet();
  render(true);
  afterSeason();
}

// Everything the game wants to show you between seasons, in the order it has
// to happen: the money first, because the first one only lands once.
function afterSeason() {
  const P = S.pro;
  if (P.firstCheck && !P.firstCheckSeen) { openPaycheck(); return; }
  if (P.trouble || P.pending) openProDecision();
}

// The first cheque. Nobody is ever ready for the difference between the number
// on the contract and the number in the account, and the city you signed in is
// a visible line in it.
function openPaycheck() {
  const P = S.pro;
  const c = P.firstCheck;
  S.sheet = { kind: 'paycheck' };
  $('sheetBack').classList.add('off');
  $('sheetTitle').textContent = 'Your first cheque';
  $('sheetHint').textContent = `${P.team} — one year of it.`;
  $('sheetBody').innerHTML = `
    <div class="attrs">
      ${c.rows.map(([k, v]) => {
        const n = Math.round(v);
        return `<div class="attr"><span class="k">${esc(k)}</span>
        <span class="v" style="color:${n < 0 ? 'var(--bad)' : n > 0 ? 'var(--good)' : 'var(--muted)'}">${
          n < 0 ? `−${proMoney(-n)}` : n > 0 ? proMoney(n) : '—'}</span></div>`;
      }).join('')}
      <div class="attr"><span class="k"><b>What you actually keep</b></span>
        <span class="v"><b>${proMoney(c.net)}</b></span></div>
    </div>
    <p class="note">${(c.rate * 100).toFixed(0)}% of it never reaches you. ${
      stateTaxFor(P.team) > 0
        ? 'The same contract in a state with no income tax would have left you with more, which is why free agency is never only about the number.'
        : 'You signed in a state with no income tax, which is worth more than most people realise.'}</p>
    <button class="btn primary" id="checkOk" type="button">Right</button>`;
  $('sheet').classList.remove('hidden');
  $('scrim').classList.remove('hidden');
  $('checkOk').onclick = () => {
    P.firstCheckSeen = true;
    closeSheet();
    render(true);
    afterSeason();
  };
}

// The season resolves once the games are played, so form is already set.
function finishYear() {
  const L = S.life;
  const played = L.gameLog || [];
  advanceYear(L, defaultRng);
  // The games belong in the season they were played in, at the top of it.
  if (played.length && L.log.length) {
    L.log[L.log.length - 1].events.unshift(
      ...played.map((r) => ({ kind: r.kind, text: `vs ${r.opponent} — ${r.text}` })),
    );
  }
  L.gameLog = [];
  L.games = [];
  Progress.saveLife(L);
  closeSheet();
  render(true);
  if (L.choices?.length) openChoice();
  else if (L.pending) openDecision();
}

// ---------------------------------------------------------------------------
// A question the year asks you
//
// Shown after the season resolves and before anything else, because the branch
// you pick lands in the same year's log. There is no dismiss: closing it would
// be a free re-roll on a decision that is supposed to cost something.
// ---------------------------------------------------------------------------
function openChoice() {
  const L = S.life;
  const c = L.choices?.[0];
  if (!c) { if (L.pending) openDecision(); return; }
  S.sheet = { kind: 'choice' };
  $('sheetBack').classList.add('off');
  $('sheetTitle').textContent = c.title;
  $('sheetHint').textContent = c.kind === 'play' ? 'One possession.' : '';
  $('sheetBody').innerHTML = `
    <p class="choice-text">${esc(c.text)}</p>
    ${c.options.map((label, i) => `<button class="btn choice" data-opt="${i}" type="button">${esc(label)}</button>`).join('')}
    ${L.choices.length > 1 ? `<p class="note" style="text-align:center;margin-top:6px">${L.choices.length - 1} more to come</p>` : ''}`;
  $('sheet').classList.remove('hidden');
  $('scrim').classList.remove('hidden');
  for (const el of $('sheetBody').querySelectorAll('[data-opt]')) {
    el.onclick = () => {
      const line = resolveChoice(L, c.kind, c.id, Number(el.dataset.opt), defaultRng);
      // The outcome belongs to the year that asked, so it goes on that entry
      // rather than opening the next one with a consequence of the last.
      if (line && L.log.length) L.log[L.log.length - 1].events.push(line);
      L.choices.shift();
      Progress.saveLife(L);
      closeSheet();
      render(true);
      if (L.choices.length) openChoice();
      else if (L.pending) openDecision();
    };
  }
}

// ---------------------------------------------------------------------------
// Decisions — offers, transfers, and whether to declare
// ---------------------------------------------------------------------------
function offersHtml(transfer) {
  const L = S.life;
  const stars = starRating(L);
  return `<p class="note" style="margin-bottom:10px">${
    transfer
      ? 'You put your name in the portal. Here is what came back.'
      : `Four years of high school are done — you graduate a ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} recruit.`
  }</p>
  ${L.offers.map((o, i) => `
    <div class="offer${o.pro ? ' risky' : ''}">
      <div class="tier">${esc(o.tier)}</div>
      <h4>${esc(o.school)}</h4>
      <p>${esc(o.note)}</p>
      ${
        o.pro ? ''
        : `<p class="note">Development ${'▮'.repeat(Math.round(o.development * 3))} &middot;
             minutes are ${o.minutesBar >= 52 ? 'hard to come by' : o.minutesBar >= 46 ? 'earned' : 'there for you'}
             &middot; ${o.exposure >= 1.2 ? 'on television every week' : o.exposure >= 0.8 ? 'seen enough' : 'nobody is watching'}</p>`
      }
      <button class="btn primary" data-offer="${i}" type="button">${o.pro ? 'Declare' : 'Commit'}</button>
    </div>`).join('')}`;
}

function declareHtml() {
  const L = S.life;
  const proj = draftProjection(L);
  const forced = L.pending === 'forced';
  return `<div class="proj-banner ${proj.tone}">${esc(proj.label)}</div>
    ${gapsHtml(proj)}
    <p class="note" style="margin:10px 0">${
      forced
        ? 'Four years of college are done. There is nothing left to go back to.'
        : 'Leave now and you sell the years of development you have not had yet. Stay and you bank the ability, but you are that much closer to finished when they draft you.'
    }</p>
    <p class="note" style="margin-bottom:12px">That is a projection, not a promise. Nobody knows what you top out at — including the people writing it.</p>
    <button class="btn primary" id="doDeclare" type="button">Declare for the draft</button>
    ${forced ? '' : '<button class="btn" id="doStay" type="button" style="margin-top:8px">Go back to school</button>'}`;
}

// What is actually standing between you and a draft pick. Shown wherever the
// projection is, because a verdict without a reason is not information.
function gapsHtml(proj) {
  if (!proj.gaps?.length) {
    return '<p class="note" style="margin-top:8px">Nothing is holding you back.</p>';
  }
  return `<div class="gaps">
    <h4>What is holding you back</h4>
    ${proj.gaps.map((g) => `<div class="gap"><b>${esc(g.k)}</b><span>${esc(g.why)}</span></div>`).join('')}
  </div>`;
}

function openDecision() {
  const L = S.life;
  const transfer = L.pending === 'transfer';
  S.sheet = { kind: 'decision' };
  $('sheetBack').classList.add('off');
  $('sheetTitle').textContent =
    L.pending === 'decision' ? 'Where do you go?' : transfer ? 'Where to?' : 'Declare?';
  $('sheetHint').textContent = '';
  $('sheetBody').innerHTML =
    L.pending === 'decision' || transfer ? offersHtml(transfer) : declareHtml();
  $('sheet').classList.remove('hidden');
  $('scrim').classList.remove('hidden');

  for (const el of $('sheetBody').querySelectorAll('[data-offer]')) {
    el.onclick = () => {
      const offer = L.offers[Number(el.dataset.offer)];
      if (offer.pro) { runCareer(); return; }
      commit(L, offer, defaultRng);
      Progress.saveLife(L);
      closeSheet();
      render(true);
    };
  }
  const dec = $('doDeclare');
  if (dec) dec.onclick = () => runCareer();
  const stay = $('doStay');
  if (stay) {
    stay.onclick = () => { returnToSchool(L); Progress.saveLife(L); closeSheet(); render(); };
  }
}

// ---------------------------------------------------------------------------
// The pro career
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Draft night
// ---------------------------------------------------------------------------
function runCareer() {
  const L = S.life;
  declare(L);
  const b = proBuildFrom(L);
  S.draft = draftNight(b, L, defaultRng);
  S.proBuild = b;
  openDraftBoard();
}

function openDraftBoard() {
  const d = S.draft;
  S.sheet = { kind: 'draft' };
  $('sheetBack').classList.add('off');
  $('sheetTitle').textContent = 'Draft night';
  $('sheetHint').textContent = d.drafted
    ? `${S.life.name} — pick ${d.pick} to the ${d.team}`
    : d.signed ? 'Undrafted. Somebody is giving you a camp invite.' : 'Undrafted. Nobody called.';

  // Show your neighbourhood of the board rather than all sixty rows: the picks
  // either side of you are the ones that mean anything.
  const mine = d.board.findIndex((r) => r.you);
  const from = mine < 0 ? 0 : Math.max(0, mine - 6);
  const rows = d.board.slice(from, from + 14);
  $('sheetBody').innerHTML = `
    ${d.drafted
      ? `<div class="proj-banner good">Pick ${d.pick} &mdash; ${esc(d.team)}</div>`
      : `<div class="proj-banner ${d.signed ? 'note' : 'bad'}">Undrafted</div>`}
    <div class="board">
      ${rows.map((r) => `<div class="brow ${r.you ? 'you' : ''}">
        <span class="pk">${r.pick}</span>
        <span class="bnm">${esc(r.name)}</span>
        <span class="btm">${esc(r.team)}</span>
      </div>`).join('')}
    </div>
    <button class="btn primary" id="toLeague" type="button" style="margin-top:12px">
      ${d.drafted || d.signed ? 'Report to camp' : 'Try to catch on anyway'}
    </button>`;
  $('sheet').classList.remove('hidden');
  $('scrim').classList.remove('hidden');
  $('toLeague').onclick = () => {
    if (!d.drafted && !d.signed) { endCareer(null); return; }
    S.pro = newPro(S.proBuild, S.life, d, defaultRng);
    Progress.saveLife(null);
    closeSheet();
    render(true);
  };
}

// ---------------------------------------------------------------------------
// The pro career
// ---------------------------------------------------------------------------
function proHeaderHtml() {
  const P = S.pro;
  const last = P.seasons[P.seasons.length - 1];
  const a = P.totals.games
    ? `${(P.totals.points / P.totals.games).toFixed(1)}`
    : '—';
  // Once he is retired the contract and the 65-game counter are meaningless,
  // and leaving them up made a finished career look like it was still running.
  const line2 = P.retired
    ? `<div class="sub"><b style="color:var(--accent)">${esc(P.team)}</b>
        &middot; ${P.seasons.length} season${P.seasons.length === 1 ? '' : 's'}
        &middot; ${P.hof ? 'Hall of Fame' : 'retired'}</div>`
    : `<div class="sub"><b style="color:var(--accent)">${esc(P.team)}</b>
        &middot; ${proMoney(P.contract.salary)}/yr, ${P.contractLeft} left</div>`;
  return `
    <div>
      <div class="nm">${esc(P.name)}</div>
      <div class="sub">Age ${P.age} &middot; ${esc(P.pos)} &middot; ${
        P.retired ? `peak OVR ${Math.round(P.peak)}` : `OVR ${Math.round(P.rating)}`}
        &middot; ${P.drafted ? `pick ${P.pick}` : 'undrafted'}</div>
      ${line2}
    </div>
    <div class="stack">
      <div class="cash ppg"><b>${P.retired ? a : last ? last.ppg.toFixed(1) : a}</b>
        <span>PPG &middot; ${P.retired ? 'career' : `${a} career`}</span></div>
      <div class="cash"><b>${proMoney(P.earnings)}</b><span>Career earnings</span></div>
    </div>
    ${P.retired ? '' : gamesBarHtml(P)}`;
}

// The 65-game counter, and what it is currently costing you. This is the whole
// health-into-money loop made visible — without it, sitting out is a free
// decision whose price arrives silently at the next contract.
function gamesBarHtml(P) {
  const last = P.seasons[P.seasons.length - 1];
  const plan = LOAD_POLICIES[P.loadPolicy] || LOAD_POLICIES.balanced;
  const projected = Math.round(82 * plan.games);
  const shown = last ? last.games : projected;
  const ok = shown >= GAMES_THRESHOLD;
  const ceiling = contractCeiling(P);
  return `<div class="gamesbar ${ok ? '' : 'risk'}">
    <span class="k">${last ? 'Games last season' : 'Games planned'}</span>
    <span class="track"><span class="fill" style="width:${clamp((shown / 82) * 100, 0, 100)}%"></span>
      <span class="mark" style="left:${(GAMES_THRESHOLD / 82) * 100}%"></span></span>
    <span class="v">${shown}/82</span>
    <span class="tag ${ok ? 'gain' : 'no'}">${ok ? 'Award eligible' : `Under ${GAMES_THRESHOLD} — not eligible`}</span>
    <span class="tag">${ceiling.label}${ceiling.bumped ? ' — unlocked' : ''}</span>
    ${supermaxEligible(P) ? '<span class="tag past">Supermax available, your team only</span>' : ''}
  </div>`;
}

function proSeasonHtml(s) {
  const badges = [
    s.mvp ? 'MVP' : null, s.allStar ? 'All-Star' : null, s.ring ? 'CHAMPION' : null,
  ].filter(Boolean);
  return `<article class="yr">
    <h3>Season ${s.year} &middot; ${esc(s.team)}
      <span class="meta">age ${s.age} &middot; OVR ${s.rating} &middot; ${s.wins}-${82 - s.wins}${
        s.playoffs ? ' &middot; playoffs' : ''
      }</span></h3>
    ${badges.length ? `<div class="hardware">${badges.map((x) => `<span>${x}</span>`).join('')}</div>` : ''}
    <div class="box">${s.ppg} pts, ${s.rpg} reb, ${s.apg} ast in ${s.mpg} min &middot; ${s.games} games${
      s.eligible === false ? ' <b style="color:var(--bad)">&middot; award ineligible</b>' : ''
    }</div>
    ${s.events.map((v) => `<div class="line ${v.kind}">${esc(v.text)}</div>`).join('')}
  </article>`;
}

function proFeedHtml() {
  const P = S.pro;
  if (P.retired) return P.seasons.map(proSeasonHtml).join('') + retiredHtml();
  const past = P.seasons.map(proSeasonHtml).join('');
  const now = `<article class="yr now">
    <h3>Season ${P.year + 1} <span class="meta">in progress &middot; ${esc(P.team)}</span></h3>
    ${P.log.length
      ? P.log.map((v) => `<div class="line ${v.kind}">${esc(v.text)}</div>`).join('')
      : '<div class="empty">Offseason. Use the buttons below, then play the season.</div>'}
  </article>`;
  return past + leagueHtml() + now;
}

// The league goes on without you: one player whose career runs alongside yours
// and gets compared to it forever, and a handful of things that happened
// somewhere else this week.
function leagueHtml() {
  const P = S.pro;
  if (!P.rival && !P.news?.length) return '';
  const r = P.rival;
  const rivalRow = r
    ? `<div class="box">${esc(r.name)} &middot; ${esc(r.team)} &middot; OVR ${Math.round(r.rating)}
        &middot; ${r.awards.mvps} MVP, ${r.awards.allStars} All-Star, ${r.awards.rings} ring${
          r.awards.rings === 1 ? '' : 's'}
        <b style="color:${r.rating > P.rating ? 'var(--bad)' : 'var(--good)'}">
          &middot; ${r.rating > P.rating ? 'ahead of you' : 'behind you'}</b></div>`
    : '';
  return `<article class="yr">
    <h3>Around the league${r ? ` <span class="meta">your draft class</span>` : ''}</h3>
    ${rivalRow}
    ${(P.news || []).map((t) => `<div class="line note">${esc(t)}</div>`).join('')}
  </article>`;
}

function retiredHtml() {
  const P = S.pro;
  const a = P.awards;
  const line = (k, v) => `<div class="attr"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  return `<article class="yr">
    <h3>${P.hof ? 'Hall of Fame' : 'Retired'} <span class="meta">age ${P.age}</span></h3>
    <div class="box">${P.seasons.length} seasons &middot; ${careerLine(P)}</div>
    <div class="attrs" style="margin-top:8px">
      ${line('Peak rating', Math.round(P.peak))}
      ${line('All-Star selections', a.allStars)}
      ${line('All-League', a.allLeague)}
      ${line('MVPs', a.mvps)}
      ${line('Championships', a.rings)}
      ${line('Rookie of the Year', a.roty ? 'Yes' : '—')}
      ${line('Career earnings', proMoney(P.earnings))}
      ${line('Hall of Fame', P.hof ? 'Inducted' : 'Not inducted')}
      ${P.postCareer ? line('Afterwards', P.postCareer.name) : ''}
    </div>
  </article>
  ${cardHtml()}
  ${(S.wonBadges || []).length
    ? `<article class="yr"><h3>Unlocked</h3><div class="badges">${S.wonBadges
        .map((x) => `<div class="badge on"><b>${esc(x.name)}</b><span>${esc(x.hint)}</span></div>`).join('')}</div></article>`
    : ''}
  <article class="yr">
    <h3>What you could not see</h3>
    <div class="attrs">
      ${MENTAL_KEYS.map((k) => `<div class="attr"><span class="k">${LABELS[k]}</span><span class="v">${S.life.mentals[k]}</span></div>`).join('')}
      <div class="attr"><span class="k">Talent</span><span class="v">${S.life.talent ?? '—'}</span></div>
    </div>
  </article>`;
}

// One screenshot. Everything a person would want to show somebody else about
// this career, on a single card, in the order they would read it out.
function cardHtml() {
  const P = S.pro;
  const L = S.life;
  const a = P.careerAverages;
  const hw = [
    P.awards.rings ? `${P.awards.rings}× champion` : null,
    P.awards.mvps ? `${P.awards.mvps}× MVP` : null,
    P.awards.allStars ? `${P.awards.allStars}× All-Star` : null,
    P.awards.allLeague ? `${P.awards.allLeague}× All-League` : null,
    P.awards.roty ? 'Rookie of the Year' : null,
    P.hof ? 'Hall of Fame' : null,
  ].filter(Boolean);
  const stat = (v, k) => `<div class="cstat"><b>${v}</b><span>${k}</span></div>`;
  return `<article class="yr card" id="careerCard">
    <div class="chead">
      <h3>${esc(L.name)}</h3>
      <p>${positionFor(P.build.height).short} &middot; ${formatHeight(P.build.height)} &middot; ${
        S.draft.drafted ? `pick #${S.draft.pick}` : 'undrafted'} &middot; ${P.seasons.length} season${
        P.seasons.length === 1 ? '' : 's'}</p>
    </div>
    <div class="cstats">
      ${stat(a.ppg, 'PPG')}${stat(a.rpg, 'RPG')}${stat(a.apg, 'APG')}
      ${stat(Math.round(P.peak), 'PEAK')}${stat(Math.round(P.totals.points).toLocaleString(), 'POINTS')}
    </div>
    ${hw.length ? `<div class="hardware">${hw.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
    <p class="cline">${esc(titleFor(P.build).title)} &middot; last stop ${esc(P.team)}${
      S.verdict ? ` &mdash; ${esc(S.verdict.body.split('. ')[0])}.` : ''}</p>
    <p class="cfoot">${proMoney(P.earnings)} earned &middot; ${esc(P.postCareer?.name || 'no plans')} &middot; Hoop Life</p>
  </article>`;
}

// Trouble. No way out but answering, and the branches are severe on purpose.
function openTrouble() {
  const P = S.pro;
  const t = P.trouble;
  S.sheet = { kind: 'trouble' };
  $('sheetBack').classList.add('off');
  $('sheetTitle').textContent = t.title;
  $('sheetHint').textContent = '';
  $('sheetBody').innerHTML = `
    <p class="choice-text">${esc(t.text)}</p>
    ${t.options.map((l, i) => `<button class="btn choice" data-tr="${i}" type="button">${esc(l)}</button>`).join('')}`;
  $('sheet').classList.remove('hidden');
  $('scrim').classList.remove('hidden');
  for (const el of $('sheetBody').querySelectorAll('[data-tr]')) {
    el.onclick = () => {
      const line = resolveTrouble(P, t.id, Number(el.dataset.tr), defaultRng);
      if (line && P.seasons.length) P.seasons[P.seasons.length - 1].events.push(line);
      closeSheet();
      render(true);
      if (P.pending) openProDecision();
    };
  }
}

// Saying something is two steps: the appearance, then what you actually say.
function openMedia(m) {
  S.sheet = { kind: 'media' };
  $('sheetBack').classList.add('off');
  $('sheetTitle').textContent = m.name;
  $('sheetHint').textContent = m.blurb;
  $('sheetBody').innerHTML = m.options
    .map((o, i) => `<button class="btn choice" data-md="${i}" type="button">${esc(o.label)}</button>`).join('');
  $('sheet').classList.remove('hidden');
  $('scrim').classList.remove('hidden');
  for (const el of $('sheetBody').querySelectorAll('[data-md]')) {
    el.onclick = () => {
      const line = resolveMedia(S.pro, m.id, Number(el.dataset.md), defaultRng);
      if (line) S.pro.log.push(line);
      closeSheet();
      render(true);
    };
  }
}

// Everything the pro career is waiting on, in one place.
function openProDecision() {
  const P = S.pro;
  if (P.trouble) { openTrouble(); return; }
  S.sheet = { kind: 'prodecision' };
  $('sheetBack').classList.add('off');
  $('scrim').classList.remove('hidden');
  $('sheet').classList.remove('hidden');

  if (P.pending === 'retire') {
    $('sheetTitle').textContent = 'The end of it';
    $('sheetHint').textContent = '';
    $('sheetBody').innerHTML = `
      <p class="choice-text">Nobody is offering you a roster spot worth taking. ${
        P.seasons.length >= 12 ? 'It has been a long time.' : 'It went quickly.'
      }</p>
      <button class="btn primary" id="doRetire" type="button">Retire</button>`;
    $('doRetire').onclick = () => endCareer(P);
    return;
  }
  if (P.pending === 'trade') {
    $('sheetTitle').textContent = 'Traded';
    $('sheetHint').textContent = '';
    $('sheetBody').innerHTML = `
      <p class="choice-text">You found out from a phone alert, like everybody else.</p>
      <button class="btn primary" id="doTrade" type="button">Pack</button>`;
    $('doTrade').onclick = () => {
      acceptTrade(P, defaultRng);
      P.log.push({ kind: 'note', text: `Traded to the ${P.team}.` });
      closeSheet(); render(true);
    };
    return;
  }
  // Free agency.
  P.offers = P.offers?.length ? P.offers : freeAgencyOffers(P, defaultRng);
  $('sheetTitle').textContent = 'Free agency';
  $('sheetHint').textContent = 'Money, or a chance at something. Rarely both.';
  $('sheetBody').innerHTML = P.offers.map((o, i) => `
    <div class="offer">
      <div class="tier">${proMoney(o.salary)} a year &middot; ${o.years} years</div>
      <h4>${esc(o.team)}${o.stay ? ' — stay' : ''}</h4>
      <p>${esc(o.note)}</p>
      <p class="note">Roster ${o.strength >= 62 ? 'contender' : o.strength >= 46 ? 'playoff side' : 'rebuilding'}
        &middot; total ${proMoney(o.salary * o.years)}</p>
      <button class="btn primary" data-fa="${i}" type="button">Sign</button>
    </div>`).join('');
  for (const el of $('sheetBody').querySelectorAll('[data-fa]')) {
    el.onclick = () => {
      const o = P.offers[Number(el.dataset.fa)];
      signWith(P, o);
      P.offers = [];
      P.log.push({ kind: 'good', text: `Signed with the ${o.team} — ${proMoney(o.salary)} a year for ${o.years}.` });
      closeSheet(); render(true);
    };
  }
}

function endCareer(P) {
  if (P) retire(P);
  // What you do with the rest of it, and the doors that are open depend on who
  // you were to people rather than on what you averaged.
  if (P && P.seasons.length) { openPostCareer(P); return; }
  finalizeCareer(P);
}

function openPostCareer(P) {
  const paths = postCareerFor(P);
  S.sheet = { kind: 'postcareer' };
  $('sheetBack').classList.add('off');
  $('sheetTitle').textContent = 'The rest of it';
  $('sheetHint').textContent = 'Some of these were only ever open to the person you were off the floor.';
  $('sheetBody').innerHTML = paths.map((p, i) => `
    <button class="opt" data-post="${i}" type="button">
      <span><span class="t">${esc(p.name)}</span><span class="d">${esc(p.blurb)}</span>
      <span class="tags">${p.pay ? `<span class="tag gain">${proMoney(p.pay)} a year</span>`
        : '<span class="tag">no income</span>'}</span></span>
      <span class="go">&rsaquo;</span></button>`).join('');
  $('sheet').classList.remove('hidden');
  $('scrim').classList.remove('hidden');
  for (const el of $('sheetBody').querySelectorAll('[data-post]')) {
    el.onclick = () => {
      P.postCareer = paths[Number(el.dataset.post)];
      finalizeCareer(P);
    };
  }
}

function finalizeCareer(P) {
  const b = S.proBuild;
  // The vault and the achievements speak the one-shot engine's shape, so the
  // stepped career is translated into it rather than given a second format.
  const asCareer = {
    drafted: S.draft.drafted, pick: S.draft.pick, madeLeague: !!P && P.seasons.length > 0,
    draftOvr: S.draft.draftOvr, potential: S.draft.potential,
    peakRating: P ? Math.round(P.peak) : S.draft.draftOvr,
    seasons: P ? P.seasons : [],
    awards: P ? P.awards : { allStars: 0, allLeague: 0, mvps: 0, rings: 0 },
    hof: !!P?.hof,
    teams: P ? [P.team] : [],
    rarity: buildRarityTier(b),
    title: titleFor(b),
    traits: traitsFor(b),
    // The stepped engine does not track these, and the verdict reads them, so
    // they are filled from what it does track rather than left undefined.
    overall: S.draft.draftOvr,
    hype: S.draft.hype ?? S.draft.draftOvr,
    fit: 0,
    dependence: 0,
    bust: !!P && S.draft.drafted && S.draft.pick <= 14 && Math.round(P.peak) < S.draft.draftOvr + 3,
    peakAge: P ? P.peakAge ?? 27 : 27,
    seasonsLostToInjury: P ? P.seasons.filter((s) => s.games < 20).length : 0,
    guaranteedByArchetype: false,
    careerAverages: P ? { ppg: P.careerAverages.ppg, rpg: P.careerAverages.rpg, apg: P.careerAverages.apg, points: Math.round(P.totals.points) } : { ppg: 0, rpg: 0, apg: 0, points: 0 },
  };
  S.career = asCareer;
  // Written once, here, so the end-of-career screen always has one. Without it
  // an undrafted career reached a screen that read a field nobody had set.
  S.verdict = writeVerdict(asCareer, b, defaultRng);
  S.pro = P || S.pro;
  Progress.record(S.prog, asCareer, b, {
    name: S.life.name, pos: positionFor(b.height).short, height: b.height,
    title: 'Pro', grade: potentialGrade(b), daily: false,
  });
  S.wonBadges = Progress.checkAchievements(S.prog, asCareer, b);
  Progress.save(S.prog);
  Progress.saveLife(null);
  closeSheet();
  render(true);
}

function careerHtml() {
  const L = S.life;
  const c = S.career;
  const a = c.careerAverages;
  const line = (k, v) => `<div class="attr"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  return `${L.log.map(yearHtml).join('')}
  <article class="yr">
    <h3>The draft <span class="meta">age ${L.age}</span></h3>
    <div class="box">${c.drafted ? `Pick #${c.pick}` : 'Undrafted'} &mdash; ${esc(c.teams[0] || 'nobody')}</div>
    <div class="line">${esc(S.verdict.headline)}</div>
    <div class="attrs" style="margin-top:8px">
      ${c.madeLeague ? line('Draft OVR → peak', `${c.draftOvr} → ${c.peakRating}`) : ''}
      ${line('Seasons', c.seasons.length)}
      ${c.madeLeague ? line('Career averages', `${a.ppg} / ${a.rpg} / ${a.apg}`) : ''}
      ${line('All-stars', c.awards.allStars)}
      ${line('MVPs', c.awards.mvps)}
      ${line('Championships', c.awards.rings)}
      ${line('Hall of fame', c.hof ? 'Inducted' : '—')}
    </div>
    <p class="note" style="margin-top:10px">${esc(S.verdict.body)}</p>
  </article>
  ${
    (S.wonBadges || []).length
      ? `<article class="yr"><h3>Unlocked</h3><div class="badges">${S.wonBadges
          .map((b) => `<div class="badge on"><b>${esc(b.name)}</b><span>${esc(b.hint)}</span></div>`).join('')}</div></article>`
      : ''
  }
  <article class="yr">
    <h3>What you could not see</h3>
    <p class="note" style="margin-bottom:8px">These were driving everything and none of them were ever on screen.</p>
    <div class="attrs">
      ${MENTAL_KEYS.map((k) => `<div class="attr"><span class="k">${LABELS[k]}</span><span class="v">${L.mentals[k]}</span></div>`).join('')}
      <div class="attr"><span class="k">Talent</span><span class="v">${L.talent ?? '—'}</span></div>
    </div>
    <p class="note" style="margin-top:8px">Talent multiplied every hour you ever put in. Two players who
    made identical decisions for eight years do not arrive in the same place, and this is why.</p>
  </article>`;
}

// ---------------------------------------------------------------------------
// Sheet contents that are not actions
// ---------------------------------------------------------------------------
function statsSheetHtml() {
  const L = S.life;
  const t = titleFor(L.build);
  const mini = (k, v, col) => `<div class="attr"><span class="k">${k}</span><span class="v">${v}</span>
    <span class="bar"><span class="now" style="width:${clamp(v, 0, 100)}%;background:${col}"></span></span></div>`;
  const proj = draftProjection(L);
  return `<h3 class="sec">Draft stock</h3>
    <div class="proj-banner ${proj.tone}" style="font-size:14px">${esc(proj.label)}</div>
    ${gapsHtml(proj)}
    <h3 class="sec">Basketball standing</h3>
    <div class="attrs">
      ${mini('Hype', Math.round(L.meters.hype), 'var(--hype)')}
      ${mini('Grades', Math.round(L.meters.grades), 'var(--grades)')}
      ${mini('Coach trust', Math.round(coachTrust(L)), 'var(--chem)')}
      ${mini('Team chemistry', Math.round(teamChemistry(L)), 'var(--good)')}
    </div>
    <h3 class="sec">Attributes — now vs your ceiling</h3>
    <div class="attrs">
      ${SKILL_KEYS.map((k) => {
        const now = Math.round(L.attrs[k]);
        const cap = L.build.skills[k];
        const past = now > cap;
        return `<div class="attr">
          <span class="k">${LABELS[k]}</span><span class="v">${now}${past ? ` <i class="over">+${now - cap}</i>` : ''}</span>
          <span class="bar"><span class="now ${past ? 'past' : ''}" style="width:${now}%"></span>
            <span class="cap" style="left:${clamp(cap, 0, 99)}%"></span></span></div>`;
      }).join('')}
    </div>
    <h3 class="sec">Body</h3>
    <div class="attrs">
      ${Object.keys(PHYSICALS).map((k) => `<div class="attr"><span class="k">${LABELS[k]}</span><span class="v">${L.physicals[k]}</span></div>`).join('')}
    </div>
    <h3 class="sec">Profile</h3>
    <p class="note">${esc(t.title)} &mdash; ${esc(t.flavor || '')}<br />
      Mentality ${L.build.mentality} &middot; ${
        L.build.mentality >= 62 ? 'score-first' : L.build.mentality <= 38 ? 'pass-first' : 'balanced'
      }${L.build.freakGene ? ` &middot; freak gene: ${LABELS[L.build.freakGene]}` : ''}</p>`;
}

function vaultHtml() {
  const p = S.prog;
  const best = Progress.bestCareers(p, 25);
  return `${
    best.length
      ? `<div class="scroll-x"><table>
          <thead><tr><th>#</th><th>Player</th><th>Pick</th><th>Peak</th><th>Yrs</th><th>AS</th><th>Rings</th><th>Score</th></tr></thead>
          <tbody>${best.map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.name)}</td><td>${e.pick ?? '—'}</td>
            <td>${e.peak}</td><td>${e.seasons}</td><td>${e.allStars}</td><td>${e.rings}</td><td>${e.score}</td></tr>`).join('')}
          </tbody></table></div>`
      : '<p class="note">Nothing yet. Finish a life and it lands here.</p>'
  }
  <h3 class="sec">Back up your progress</h3>
  <p class="note">No account, no server. Copy this somewhere safe.</p>
  <textarea id="backupBox" class="backup" readonly rows="3">${esc(Progress.exportProgress(p))}</textarea>
  <div class="row2" style="margin-top:8px">
    <button class="btn" id="copyBackup" type="button">Copy backup</button>
    <button class="btn" id="pasteBackup" type="button">Restore</button>
  </div>
  <div id="restoreSlot"></div>`;
}

function badgesHtml() {
  const p = S.prog;
  const got = Object.keys(p.achievements).length;
  return `<p class="note">${got} of ${Progress.ACHIEVEMENTS.length} unlocked.</p>
    <div class="badges" style="margin-top:8px">${Progress.ACHIEVEMENTS.map((a) => {
      const on = !!p.achievements[a.id];
      return `<div class="badge ${on ? 'on' : ''}"><b>${esc(a.name)}</b><span>${esc(a.hint)}</span></div>`;
    }).join('')}</div>`;
}

function wireBackup() {
  $('copyBackup').onclick = async () => {
    const box = $('backupBox');
    try {
      await navigator.clipboard.writeText(box.value);
      $('copyBackup').textContent = 'Copied';
    } catch {
      box.removeAttribute('readonly');
      box.select();
      box.setSelectionRange(0, box.value.length);
      $('copyBackup').textContent = 'Selected — hold to copy';
    }
    setTimeout(() => ($('copyBackup').textContent = 'Copy backup'), 2200);
  };
  $('pasteBackup').onclick = () => {
    $('restoreSlot').innerHTML = `
      <p class="note" style="margin-top:12px">Paste a backup, then press Restore. This replaces what is on this device.</p>
      <textarea id="restoreBox" class="backup" rows="3" placeholder="Paste backup text"></textarea>
      <button class="btn primary" id="doRestore" type="button" style="margin-top:8px">Restore</button>
      <div id="restoreMsg" class="note"></div>`;
    $('doRestore').onclick = () => {
      const r = Progress.importProgress($('restoreBox').value);
      if (!r.ok) { $('restoreMsg').innerHTML = `<span style="color:var(--bad)">${esc(r.error)}</span>`; return; }
      S.prog = r.progress;
      Progress.save(S.prog);
      drawSheet();
    };
  };
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function render(scrollToEnd = false) {
  const L = S.life;
  if (!L) return;
  const over = !!S.career;

  $('idcard').innerHTML = S.pro ? proHeaderHtml() : idcardHtml();
  $('bars').innerHTML = barsHtml();
  $('feed').innerHTML = feedHtml();

  // The + changes job depending on what the game is waiting for: play the year,
  // answer a decision, or start again once it is all over.
  const age = $('ageBtn');
  const P = S.pro;
  const waiting = P
    ? !!P.pending || !!P.games?.length || (P.retired && !over)
    : !!L.pending || !!L.choices?.length || !!L.games?.length;
  const playing = P ? !!P.games?.length : !!L.games?.length;
  age.classList.toggle('decide', waiting || over);
  age.querySelector('.lb').textContent =
    over ? 'New' : playing ? 'Play' : waiting ? 'Decide' : P ? 'Season' : 'Age';
  age.querySelector('.plus').textContent = over ? '↻' : playing ? '▶' : waiting ? '?' : '+';

  for (const el of document.querySelectorAll('[data-cat]')) {
    el.disabled = over || waiting;
    // In the league the four buttons collapse to one: the offseason. Basketball
    // is the only category left that means anything, and pretending otherwise
    // would be four screens where three of them are empty.
    if (P) {
      el.classList.toggle('hidden', el.dataset.cat !== 'train');
      if (el.dataset.cat === 'train') el.querySelector('.lb').textContent = 'Offseason';
    } else {
      el.classList.remove('hidden');
      if (el.dataset.cat === 'train') el.querySelector('.lb').textContent = 'Train';
    }
    // A category holding something urgent says so, rather than making you find
    // out by opening all four.
    const cat = el.dataset.cat;
    const alert =
      (cat === 'school' && L.meters.grades < 40) ||
      (cat === 'train' && L.injured) ||
      (cat === 'people' && (coachTrust(L) < 28 || teamChemistry(L) < 30));
    el.dataset.alert = String(!over && !L.pending && !L.choices?.length && !!alert);
  }

  if (scrollToEnd) requestAnimationFrame(() => { $('feed').scrollTop = $('feed').scrollHeight; });
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
for (const el of document.querySelectorAll('[data-cat]')) {
  el.onclick = () => openSheet(el.dataset.cat);
}
$('ageBtn').onclick = () => {
  const L = S.life;
  if (S.career) { openNewLife(); return; }
  const P = S.pro;
  if (P) {
    // Retired but the career is not written up yet: the only thing left is
    // choosing what comes after. Without this the button plays another season
    // for a man who has already retired.
    if (P.retired) { openPostCareer(P); return; }
    if (P.pending) { openProDecision(); return; }
    if (P.games?.length) { openGameDay(); return; }
    P.gameForm = 0;
    P.gameLog = [];
    // A pro plays unless he is not on a roster at all, so game day is keyed to
    // the minutes his rating earns rather than a school's rotation.
    P.games = P.rating >= 58 ? rollGameDay(S.life, defaultRng, 30) : [];
    for (const g of P.games) g.opponent = randomOpponent('pro', defaultRng);
    if (P.games.length) { openGameDay(); return; }
    finishSeason();
    return;
  }
  if (L.games?.length) { openGameDay(); return; }
  if (L.choices?.length) { openChoice(); return; }
  if (L.pending) { openDecision(); return; }
  // If he is going to be on the floor at all, he plays his five games before
  // the season is written. projectedMinutes is the same function the season
  // uses, so the two can never disagree about whether he played.
  L.gameForm = 0;
  L.gameLog = [];
  const mins = projectedMinutes(L);
  L.games = mins >= 8 ? rollGameDay(L, defaultRng, mins) : [];
  // Keyed to the stage. The pro league only ever shows up once you are in it —
  // this pulled from it regardless, so a fifteen-year-old played the Wranglers.
  for (const g of L.games) g.opponent = randomOpponent(L.stage, defaultRng);
  if (L.games.length) { openGameDay(); return; }
  finishYear();
};
$('sheetClose').onclick = () => {
  if (S.sheet?.kind === 'choice' || S.sheet?.kind === 'gameday') return; // playing it is the only way out
  closeSheet();
};
$('scrim').onclick = () => {
  if (!['decision', 'choice', 'gameday'].includes(S.sheet?.kind)) closeSheet();
};
$('sheetBack').onclick = () => openSheet(S.sheet?.kind === 'focus' ? 'train' : 'people');

// The menu holds everything that is not a decision about this year.
$('menuBtn').onclick = () => {
  S.sheet = { kind: 'menu' };
  $('sheetBack').classList.add('off');
  $('sheetTitle').textContent = 'Hoop Life';
  $('sheetHint').textContent = '';
  $('sheetBody').innerHTML = `
    <button class="opt" id="mStats" type="button"><span><span class="t">You</span>
      <span class="d">Attributes, standing, and how far your genetics go.</span></span><span class="go">&rsaquo;</span></button>
    <button class="opt" id="mVault" type="button"><span><span class="t">Vault</span>
      <span class="d">Finished careers, and your backup.</span></span><span class="go">&rsaquo;</span></button>
    <button class="opt" id="mBadges" type="button"><span><span class="t">Achievements</span>
      <span class="d">What you have and have not done.</span></span><span class="go">&rsaquo;</span></button>
    <button class="opt" id="mNew" type="button"><span><span class="t">Start a new life</span>
      <span class="d">This one ends here. It is not saved.</span></span><span class="go">&rsaquo;</span></button>`;
  $('sheet').classList.remove('hidden');
  $('scrim').classList.remove('hidden');
  $('mStats').onclick = () => openSheet('stats');
  $('mVault').onclick = () => openSheet('vault');
  $('mBadges').onclick = () => openSheet('badges');
  $('mNew').onclick = openNewLife;
};

// Name him yourself, or take the one the game offers. The field is pre-filled
// so it is never a blank box you have to solve before you can play.
function openNewLife() {
  const suggested = randomName(defaultRng);
  S.sheet = { kind: 'newlife' };
  $('sheetBack').classList.add('off');
  $('sheetTitle').textContent = 'A new life';
  $('sheetHint').textContent = 'Fourteen years old. Everything else is already decided and none of it is visible.';
  $('sheetBody').innerHTML = `
    <label class="field">
      <span>Name</span>
      <input id="nameBox" type="text" maxlength="28" value="${esc(suggested)}"
        autocomplete="off" autocapitalize="words" spellcheck="false" />
    </label>
    <button class="btn" id="reroll" type="button">Give me another one</button>
    <button class="btn primary" id="beginLife" type="button" style="margin-top:8px">Start</button>`;
  $('sheet').classList.remove('hidden');
  $('scrim').classList.remove('hidden');
  $('reroll').onclick = () => { $('nameBox').value = randomName(defaultRng); };
  $('beginLife').onclick = () => startLife($('nameBox').value);
  $('nameBox').onkeydown = (e) => { if (e.key === 'Enter') startLife($('nameBox').value); };
}

resumeOrStart();
