import { SKILLS, PHYSICALS, MENTALS, MENTAL_KEYS } from '../src/constants.js';
import {
  startBuild, rollArchetypeBeat, rollMentalityBeat, rollSkillBeat, rollPhysicalBeat,
  rollMentals, beatPlan, formatHeight, oddsText,
} from '../src/roll.js';
import { applyGift, titleFor } from '../src/archetypes.js';
import { potentialFor, draftOverallFor, fitFor, positionFor, buildRarityTier } from '../src/overall.js';
import { simulateCareer } from '../src/career.js';
import { writeVerdict } from '../src/verdict.js';
import { defaultRng, seededRng } from '../src/rng.js';
import { randomName } from '../src/names.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const LABELS = {
  ...Object.fromEntries(Object.entries(SKILLS).map(([k, v]) => [k, v.label])),
  ...Object.fromEntries(Object.entries(PHYSICALS).map(([k, v]) => [k, v.label])),
  ...Object.fromEntries(Object.entries(MENTALS).map(([k, v]) => [k, v.label])),
};
const TIER_VAR = { Common: 't0', Uncommon: 't1', Rare: 't2', Elite: 't3', Legendary: 't4', Mythic: 't5' };
const tierColor = (t) => `var(--${TIER_VAR[t.name] || 't0'})`;
const ARCH_COLOR = { Common: 't1', Rare: 't2', Epic: 't3', Legendary: 't4' };
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const STORE = 'hooper.session.v2';
const LB = 'hooper.leaderboard.v1';
const todaySeed = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

const S = {
  b: null, beats: [], idx: 0, rerolls: 3, lastKey: null, busy: false,
  physSectionDrawn: false, done: false, simmed: false,
  quick: false, daily: false, name: '', rng: defaultRng,
  session: load(STORE, { builds: 0, best: 0, legendary: 0 }),
};

// ---------------------------------------------------------------------------
// New build
// ---------------------------------------------------------------------------
function newBuild() {
  S.rng = S.daily ? seededRng(`hooper-${todaySeed()}`) : defaultRng;
  S.b = startBuild(S.rng);
  S.beats = beatPlan(S.b);
  S.idx = 0; S.rerolls = 3; S.lastKey = null;
  S.physSectionDrawn = false; S.done = false; S.simmed = false;
  S.name = randomName(S.rng);
  ['stats', 'ovrSlot', 'car', 'freakSlot'].forEach((i) => ($(i).innerHTML = ''));
  $('stage').className = 'stage';
  $('stage').innerHTML = `
    <div class="stage-lbl">Ready</div>
    <div class="stage-num" style="font-size:32px">&mdash;</div>
    <div class="stage-sub">Height first. Then we find out if you got handed anything.</div>`;
  drawProg(); syncCounters(); updateBtns();
}

const drawProg = () =>
  ($('prog').innerHTML = S.beats
    .map((_, i) => `<div class="pip ${i < S.idx ? 'done' : i === S.idx ? 'now' : ''}"></div>`)
    .join(''));

function syncCounters() {
  $('cnt').textContent = S.session.builds;
  $('best').textContent = S.session.best || '—';
  $('lg').textContent = S.session.legendary;
}

const stage = (html) => ($('stage').innerHTML = html);

// Slot-machine landing. Numbers tumble, then settle.
function land(el, final, then) {
  if (reduceMotion()) { el.textContent = final; then && then(); return; }
  S.busy = true;
  el.classList.add('rolling');
  let t = 0;
  const iv = setInterval(() => {
    el.textContent = Math.floor(Math.random() * 75) + 25;
    if (++t > 9) {
      clearInterval(iv);
      el.classList.remove('rolling');
      el.textContent = final;
      S.busy = false;
      then && then();
      updateBtns();
    }
  }, 42);
  updateBtns();
}

// ---------------------------------------------------------------------------
// One beat
// ---------------------------------------------------------------------------
function doStep(animate = true) {
  const beat = S.beats[S.idx];
  const b = S.b;
  $('stage').className = 'stage';

  if (beat.kind === 'height') {
    stage(`<div class="stage-lbl">Height</div><div class="stage-num" id="sn">&mdash;</div>
      <div class="stage-sub">Everything from here is scored against this number.</div>`);
    if (animate) land($('sn'), formatHeight(b.height));
    else $('sn').textContent = formatHeight(b.height);
    S.lastKey = null;
  } else if (beat.kind === 'body') {
    const d = b.wingspan - b.height;
    stage(`<div class="stage-lbl">Wingspan / Frame</div>
      <div class="stage-num" style="font-size:44px">${formatHeight(b.wingspan)}</div>
      <div class="stage-dev" style="color:${d >= 6 ? 'var(--t4)' : d >= 3 ? 'var(--led)' : 'var(--t0)'}">
        ${d >= 0 ? '+' : ''}${d}" differential</div>
      <div class="stage-exp">FRAME <b>${b.frame}</b></div>`);
    S.lastKey = null;
  } else if (beat.kind === 'archetype') {
    const a = rollArchetypeBeat(b);
    if (!a) {
      stage(`<div class="stage-lbl">Archetype</div>
        <div class="stage-num" style="font-size:36px;color:var(--t0)">NONE</div>
        <div class="stage-sub">No gift. You'll be whatever the rolls make you &mdash;
        and you'll get named for it at the end.</div>`);
    } else {
      const col = `var(--${ARCH_COLOR[a.tier]})`;
      if (a.tier === 'Legendary') {
        S.session.legendary++; save(STORE, S.session); syncCounters();
        $('stage').className = 'stage leg';
      }
      stage(`<div class="arch-tier" style="color:${col}">${a.tier} Archetype</div>
        <div class="arch-name" style="color:${col}">${esc(a.title)}</div>
        <div class="stage-sub">${esc(a.flavor)}</div>
        <div class="gifts">${giftLine(a)}</div>
        ${floorLine(a)}
        ${a.guaranteesDraft ? '<div class="stage-exp" style="margin-top:6px;color:var(--t4)">GUARANTEED DRAFTED</div>' : ''}`);
    }
    S.lastKey = null;
  } else if (beat.kind === 'mentality') {
    const m = rollMentalityBeat(b);
    const desc =
      m >= 78 ? 'Pure scorer. Wants the ball, every time.'
      : m >= 60 ? 'Score-leaning. Looks for his own shot first.'
      : m >= 41 ? 'Balanced. Takes what the defense gives.'
      : m >= 22 ? 'Pass-leaning. Sets up teammates first.'
      : 'Pure facilitator. Would rather have the assist.';
    stage(`<div class="stage-lbl">Mentality</div>
      <div class="stage-num" id="sn" style="font-size:42px;color:${m >= 60 ? 'var(--t4)' : m <= 40 ? 'var(--t2)' : 'var(--hot)'}">&mdash;</div>
      <div class="axis"><div class="axis-bar"><div class="axis-dot" style="left:${m}%"></div></div>
        <div class="axis-lbl"><span>PASS-FIRST</span><span>SCORE-FIRST</span></div></div>
      <div class="stage-sub" style="margin-top:8px">${desc}<br>
        <em>Not good or bad. It decides which stats matter now.</em></div>`);
    if (animate) land($('sn'), m);
    else $('sn').textContent = m;
    S.lastKey = null;
  } else if (beat.kind === 'skill') {
    const k = beat.key;
    const g = applyGift(b.archetype, k);
    const meta = rollSkillBeat(b, k);
    const v = b.skills[k];
    const d = v - meta.expectedNatural;
    const col = tierColor(meta.tier);
    const tag = g.boost > 0
      ? ` <span style="color:var(--${ARCH_COLOR[b.archetype.tier]})">&#9670; GIFTED</span>`
      : g.boost < 0 ? ' <span style="color:var(--bad)">&#9660; TAXED</span>' : '';
    stage(`<div class="stage-lbl">${LABELS[k]}${tag}</div>
      <div class="stage-num" id="sn" style="color:${col}">&mdash;</div>
      <div class="stage-exp">EXPECTED AT ${formatHeight(b.height)} &mdash; <b>${meta.expectedNatural}</b></div>
      <div class="stage-dev" id="sd"></div><div class="stage-tier" id="st"></div>`);
    const settle = () => {
      $('sd').innerHTML = `<span style="color:${d > 0 ? 'var(--led)' : d < 0 ? '#7A5C5C' : 'var(--t0)'}">${d > 0 ? '+' : ''}${d} vs expected</span>`;
      $('st').innerHTML = `<span style="color:${col}">${meta.tier.name}</span> <span style="color:var(--t0);letter-spacing:.1em">&middot; ${oddsText(meta.p)}</span>`;
      addRow(k, v, meta.expectedNatural, col, d, false, g.boost > 0, meta.freak);
    };
    if (animate) land($('sn'), v, settle);
    else { $('sn').textContent = v; settle(); }
    S.lastKey = k;
  } else {
    const k = beat.key;
    const g = applyGift(b.archetype, k);
    const meta = rollPhysicalBeat(b, k);
    const v = b.physicals[k];
    const note = {
      durability: v < 40 ? 'Fragile. This will cost seasons.' : v > 75 ? 'Iron. Barely misses a game.' : 'Normal wear and tear.',
      stamina: v < 40 ? 'Gasses early. Sixth-man minutes.' : v > 75 ? 'Never tires. Heavy starter minutes.' : 'Standard rotation load.',
      longevity: v < 40 ? 'Short shelf life. Falls off fast.' : v > 75 ? 'Ages beautifully. Plays forever.' : 'Typical career arc.',
    }[k];
    const col = v >= 75 ? 'var(--t1)' : v <= 40 ? 'var(--t5)' : 'var(--hot)';
    stage(`<div class="stage-lbl">${LABELS[k]}${g.boost > 0 ? ` <span style="color:var(--${ARCH_COLOR[b.archetype.tier]})">&#9670; GIFTED</span>` : ''}</div>
      <div class="stage-num" id="sn" style="color:${col}">&mdash;</div>
      <div class="stage-exp">EXPECTED &mdash; <b>${meta.expectedNatural}</b></div>
      <div class="stage-sub">${note}</div>`);
    const settle = () => addRow(k, v, meta.expectedNatural, col, v - meta.expectedNatural, true, g.boost > 0, false);
    if (animate) land($('sn'), v, settle);
    else { $('sn').textContent = v; settle(); }
    S.lastKey = null; // physicals are not rerollable
  }

  S.idx++;
  drawProg();
  if (S.idx >= S.beats.length) finish();
  updateBtns();
}

function giftLine(a) {
  const out = [];
  for (const [k, v] of Object.entries(a.boost || {})) out.push(`<b>+${v} ${LABELS[k] || k}</b>`);
  for (const [k, v] of Object.entries(a.cost || {})) out.push(`<i>&minus;${v} ${LABELS[k] || k}</i>`);
  for (const [k, v] of Object.entries(a.sigmaMult || {})) out.push(`${LABELS[k] || k} variance &times;${v}`);
  if (a.costNote) out.push(`<i>${esc(a.costNote)}</i>`);
  return out.join(' &middot; ');
}

function floorLine(a) {
  const f = Object.entries(a.floor || {});
  if (!f.length) return '';
  const parts = f.map(([k, v]) =>
    k === 'ALL'
      ? `every stat no worse than expected${v >= 0 ? '+' : ''}${v}`
      : `${LABELS[k] || k} at expected+${v}`,
  );
  return `<div class="stage-exp" style="margin-top:6px">FLOOR &mdash; ${parts.join(' &middot; ')}</div>`;
}

function addRow(k, v, exp, col, d, isPhys, gifted, freak) {
  const st = $('stats');
  if (isPhys && !S.physSectionDrawn) {
    st.insertAdjacentHTML('beforeend', '<div class="sect">Physical Intangibles</div>');
    S.physSectionDrawn = true;
  }
  st.insertAdjacentHTML(
    'beforeend',
    `<div class="row" data-k="${k}">
      <div class="nm" style="color:${col}">${LABELS[k]}${gifted ? ' <em>&#9670;</em>' : ''}${freak ? ' <em style="color:var(--t5)">&#9888;</em>' : ''}</div>
      <div class="vl" style="color:${col}">${v}</div>
      <div class="bar"><div class="fill" style="width:${v}%;background:${col}"></div>
        <div class="exp-tick" style="left:${Math.max(0, Math.min(99, exp))}%"></div></div>
      <div class="dev ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '+' : ''}${d}</div>
    </div>`,
  );
}

// ---------------------------------------------------------------------------
// Build complete
// ---------------------------------------------------------------------------
function finish() {
  const b = S.b;
  rollMentals(b);
  S.done = true;

  const potential = potentialFor(b);
  const draftOvr = draftOverallFor(b);
  const pos = positionFor(b.height);
  const rarity = buildRarityTier(b);
  const title = titleFor(b);
  const fit = fitFor(b);

  S.session.builds++;
  if (potential > S.session.best) S.session.best = potential;
  save(STORE, S.session);
  syncCounters();

  if (b.freakGene) {
    $('freakSlot').innerHTML =
      `<div class="freak">&#9888; FREAK GENE &mdash; ${LABELS[b.freakGene]} rolled on a curve 2.6&times; wider than normal</div>`;
  }

  const col = b.archetype ? `var(--${ARCH_COLOR[b.archetype.tier]})` : 'var(--line)';
  const sub = b.archetype
    ? `${b.archetype.tier.toUpperCase()} ARCHETYPE &mdash; ROLLED`
    : `DERIVED &mdash; ${String(title.flavor || '').toUpperCase()}`;

  $('ovrSlot').innerHTML = `
    <div class="overall">
      <div><div class="ovr-l">Potential &mdash; his prime</div><div class="ovr-n">${potential}</div></div>
      <div><div class="ovr-l">Draft night</div><div class="ovr-n" style="color:var(--led-dim)">${draftOvr}</div></div>
      <div class="ovr-side">
        ${rarity.name.toUpperCase()} BUILD<br>
        ENTERS AT ${b.draftAge}<br>
        FIT ${fit >= 0 ? '+' : ''}${fit.toFixed(2)} ${fit > 0.15 ? '&mdash; MATCHED' : fit < -0.15 ? '&mdash; MISMATCHED' : ''}
      </div>
      <div class="pos-badge">${pos.short}</div>
    </div>
    <div class="title-bar">
      <div class="tt" style="color:${col}">${esc(title.title)}</div>
      <div class="ts">${sub}</div>
    </div>`;

  stage(`<div class="stage-lbl">Build complete &mdash; ${esc(S.name)}</div>
    <div class="stage-num" style="font-size:48px">${draftOvr} <span style="color:var(--led-dim);font-size:.45em">&rarr;</span> ${potential}</div>
    <div class="stage-exp">DRAFT NIGHT &rarr; CEILING &middot; the attributes above describe the ceiling</div>
    <div class="stage-sub">Whether he ever gets there is work ethic, playing time and luck &mdash;
    and four mental attributes you still cannot see. Simulate to find out.</div>`);
}

// ---------------------------------------------------------------------------
// Career
// ---------------------------------------------------------------------------
function runCareer() {
  const b = S.b;
  const rng = S.daily ? seededRng(`hooper-career-${todaySeed()}`) : defaultRng;
  const c = simulateCareer(b, rng);
  const v = writeVerdict(c, b, rng);
  const a = c.careerAverages;

  const draftLine = c.drafted
    ? `Pick #${c.pick} &mdash; ${esc(c.teams[0])}`
    : c.madeLeague ? `Undrafted &mdash; signed by ${esc(c.teams[0])}` : 'Undrafted &mdash; never signed';

  const line = (k, val) => `<div class="line"><span>${k}</span><span>${val}</span></div>`;
  const body = c.madeLeague
    ? line('DRAFT OVR &rarr; PEAK', `${c.draftOvr} &rarr; ${c.peakRating}` +
        `<span style="color:var(--led-dim);font-weight:400"> (+${c.peakRating - c.draftOvr})</span>`) +
      line('POTENTIAL', c.peakRating >= c.potential
        ? `${c.potential} &mdash; reached it`
        : `${c.potential} &mdash; got ${Math.round(((c.peakRating - c.draftOvr) / Math.max(1, c.potential - c.draftOvr)) * 100)}% there`) +
      line('OFFSEASON LEAPS', c.leaps) +
      line('SEASONS', c.seasons.length) +
      line('LOST TO INJURY', c.seasonsLostToInjury) +
      line('CAREER AVERAGES', `${a.ppg} / ${a.rpg} / ${a.apg}`) +
      line('ALL-STARS', c.awards.allStars) +
      line('MVPS', c.awards.mvps) +
      line('CHAMPIONSHIPS', c.awards.rings) +
      line('HALL OF FAME', c.hof ? 'INDUCTED' : '—')
    : line('SEASONS', 0) + line('OUTCOME', 'NEVER PLAYED');

  const seasonRows = c.seasons
    .map(
      (s) => `<tr class="${s.allStar ? 'hl' : ''}">
        <td>${s.age}</td><td>${esc(s.team)}</td><td>${s.rating}</td><td>${s.games}</td>
        <td>${s.minutes}</td><td>${s.ppg}</td><td>${s.rpg}</td><td>${s.apg}</td><td>${s.wins}</td>
        <td>${[s.leapt ? 'LEAP' : '', s.mvp ? 'MVP' : '', s.allStar ? 'AS' : '', s.ring ? 'TITLE' : '', s.injury ? esc(s.injury.kind) : ''].filter(Boolean).join(' ') || '—'}</td>
      </tr>`,
    )
    .join('');

  $('car').innerHTML = `<div class="career">
    <h2>Career Result</h2>
    <div class="draft">${draftLine}</div>
    <div class="draft-sub">ENTERED AT ${b.draftAge} &middot; SCOUT HYPE ${c.hype} &middot; TRUE CEILING ${c.potential}${c.guaranteedByArchetype ? ' &middot; ARCHETYPE GUARANTEED A SLOT' : ''}</div>
    ${body}
    <div class="reveal">
      <h3>Hidden attributes &mdash; revealed</h3>
      ${MENTAL_KEYS.map((k) => line(LABELS[k].toUpperCase(), b.mentals[k])).join('')}
      ${
        c.traits.length
          ? `<div class="traits">${c.traits
              .map((t) => `<span class="trait ${t.effects.growth < 1 || t.effects.injury > 1 || t.effects.playoffProd < 1 || t.effects.teamSuccess < 1 ? 'bad' : ''}">${esc(t.name)}<b>${esc(t.desc)}</b></span>`)
              .join('')}</div>`
          : '<div class="traits"><span class="trait" style="border-color:var(--wood3);color:var(--t0)">No traits &mdash; nothing extreme enough to bend the sim</span></div>'
      }
    </div>
    ${
      c.seasons.length
        ? `<details class="log"><summary>Season by season (${c.seasons.length})</summary>
             <div class="scroll-x"><table>
               <thead><tr><th>Age</th><th>Team</th><th>OVR</th><th>G</th><th>MP</th><th>PPG</th><th>RPG</th><th>APG</th><th>W</th><th>Notes</th></tr></thead>
               <tbody>${seasonRows}</tbody></table></div></details>`
        : ''
    }
    <div class="verdict"><b>${esc(v.headline)}</b><br>${esc(v.body)}</div>
    ${S.daily ? dailyBoard(c) : ''}
  </div>`;

  S.simmed = true;
  updateBtns();
  $('car').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' });
}

function dailyBoard(c) {
  const all = load(LB, []);
  all.push({
    date: todaySeed(), name: S.name, ovr: c.overall, seasons: c.seasons.length,
    allStars: c.awards.allStars, rings: c.awards.rings, score: c.hofScore || 0, hof: c.hof,
  });
  save(LB, all.slice(-300));
  const today = all.filter((e) => e.date === todaySeed()).sort((x, y) => y.score - x.score);
  return `<details class="log" open><summary>Today's seed &mdash; your runs (${today.length})</summary>
    <div class="scroll-x"><table>
      <thead><tr><th>#</th><th>Player</th><th>OVR</th><th>Yrs</th><th>AS</th><th>Rings</th><th>Score</th></tr></thead>
      <tbody>${today
        .map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.name)}</td><td>${e.ovr}</td><td>${e.seasons}</td><td>${e.allStars}</td><td>${e.rings}</td><td>${e.score}${e.hof ? ' ★' : ''}</td></tr>`)
        .join('')}</tbody></table></div>
    <div class="draft-sub" style="margin-top:8px">Stored in this browser only &mdash; v1 has no backend.</div>
  </details>`;
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------
function nextLabel() {
  const beat = S.beats[S.idx];
  if (!beat) return 'Roll';
  if (beat.kind === 'height') return 'Roll height';
  if (beat.kind === 'body') return 'Roll wingspan';
  if (beat.kind === 'archetype') return 'Roll archetype';
  if (beat.kind === 'mentality') return 'Roll mentality';
  return `Roll ${LABELS[beat.key].toLowerCase()}`;
}

function updateBtns() {
  $('rrn').textContent = `(${S.rerolls})`;
  $('rr').disabled = S.busy || !(S.rerolls > 0 && S.lastKey && !S.done);
  const roll = $('roll');
  roll.disabled = S.busy;
  if (S.done) roll.textContent = S.simmed ? 'New build' : 'Simulate career';
  else roll.textContent = S.quick ? 'Roll everything' : nextLabel();
}

$('roll').onclick = () => {
  if (S.busy) return;
  if (S.done) {
    if (S.simmed) newBuild();
    else runCareer();
    return;
  }
  if (S.quick) {
    while (S.idx < S.beats.length) doStep(false);
    return;
  }
  doStep(true);
};

$('rr').onclick = () => {
  if (S.busy || S.rerolls <= 0 || !S.lastKey || S.done) return;
  S.rerolls--;
  S.idx--;
  const row = $('stats').querySelector(`.row[data-k="${S.lastKey}"]`);
  if (row) row.remove();
  doStep(true);
};

$('quick').onclick = () => {
  S.quick = !S.quick;
  $('quick').setAttribute('aria-pressed', String(S.quick));
  updateBtns();
};

$('daily').onclick = () => {
  S.daily = !S.daily;
  $('daily').setAttribute('aria-pressed', String(S.daily));
  $('daily').textContent = S.daily ? `Daily ${todaySeed()}` : 'Daily seed';
  newBuild();
};

syncCounters();
newBuild();
