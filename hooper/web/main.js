import {
  SKILLS,
  PHYSICALS,
  PHYSICAL_KEYS,
  MENTALS,
  MENTAL_KEYS,
} from '../src/constants.js';
import {
  startBuild,
  rollArchetypeBeat,
  rollMentalityBeat,
  rollSkillBeat,
  rollPhysicalBeat,
  rollMentals,
  beatPlan,
  formatHeight,
  oddsText,
  tierFor,
} from '../src/roll.js';
import { overallFor, fitFor, positionFor, buildRarityTier } from '../src/overall.js';
import { titleFor } from '../src/archetypes.js';
import { simulateCareer } from '../src/career.js';
import { writeVerdict, titleLine } from '../src/verdict.js';
import { defaultRng, seededRng } from '../src/rng.js';
import { randomName, LEAGUE_NAME } from '../src/names.js';

const app = document.getElementById('app');
const LABELS = {
  ...Object.fromEntries(Object.entries(SKILLS).map(([k, v]) => [k, v.label])),
  ...Object.fromEntries(Object.entries(PHYSICALS).map(([k, v]) => [k, v.label])),
  ...Object.fromEntries(Object.entries(MENTALS).map(([k, v]) => [k, v.label])),
};
const LB_KEY = 'hooper.leaderboard.v1';

const S = {
  screen: 'home',
  quickRoll: false,
  build: null,
  beats: [],
  idx: 0,
  revealed: false,
  last: null, // meta for the beat just revealed
  career: null,
  verdict: null,
  playerName: '',
  daily: false,
  seedLabel: '',
};

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const todaySeed = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------
function render() {
  app.innerHTML = '';
  ({ home, roll: rollScreen, sheet, career: careerScreen, leaderboard })[S.screen]();
}

function home() {
  const c = el(`
    <div class="stack">
      <div class="card">
        <div class="section-label" style="margin-top:0">Start</div>
        <div class="row">
          <button class="primary" id="new">Roll a build</button>
          <button id="dailyBtn">Daily seed &mdash; ${todaySeed()}</button>
          <button class="ghost" id="lb">Leaderboard</button>
        </div>
        <div class="row" style="margin-top:16px">
          <label class="toggle">
            <input type="checkbox" id="quick" ${S.quickRoll ? 'checked' : ''} />
            Quick roll &mdash; skip the ceremony, roll everything at once
          </label>
        </div>
      </div>
      <div class="card">
        <div class="section-label" style="margin-top:0">How it reads</div>
        <p class="note">
          A 6'0" with a 94 dunk is a freak. A 7'1" with a 94 dunk is Tuesday. Height sets an
          expected value for every attribute, and the tier next to each number is the
          probability of rolling <em>that high or higher</em> for a player that size.
          Shooting is cheap and height-gated stats are expensive &mdash; which also means a
          7'1" with a 95 three is a chase pull from the opposite direction.
        </p>
        <p class="note" style="margin-bottom:0">
          Mentality is an axis, not a quality. Pass-first is not worse than score-first;
          it is only worse if the build behind it disagrees. Three rerolls per build,
          skills only, never height.
        </p>
      </div>
    </div>`);
  c.querySelector('#new').onclick = () => beginBuild(false);
  c.querySelector('#dailyBtn').onclick = () => beginBuild(true);
  c.querySelector('#lb').onclick = () => {
    S.screen = 'leaderboard';
    render();
  };
  c.querySelector('#quick').onchange = (e) => {
    S.quickRoll = e.target.checked;
  };
  app.append(c);
}

function beginBuild(daily) {
  const rng = daily ? seededRng(`hooper-${todaySeed()}`) : defaultRng;
  S.daily = daily;
  S.seedLabel = daily ? todaySeed() : '';
  S.build = startBuild(rng);
  S.beats = beatPlan(S.build);
  S.idx = 0;
  S.revealed = false;
  S.last = null;
  S.career = null;
  S.verdict = null;
  S.playerName = randomName(rng);

  if (S.quickRoll) {
    const b = S.build;
    rollArchetypeBeat(b);
    rollMentalityBeat(b);
    for (const k of b.order) rollSkillBeat(b, k);
    for (const k of PHYSICAL_KEYS) rollPhysicalBeat(b, k);
    rollMentals(b);
    S.screen = 'sheet';
  } else {
    S.screen = 'roll';
  }
  render();
}

// ---------------------------------------------------------------------------
// Sequential roll
// ---------------------------------------------------------------------------
function progressBar() {
  return `<div class="progress">${S.beats
    .map((_, i) => `<i class="${i < S.idx ? 'done' : i === S.idx ? 'current' : ''}"></i>`)
    .join('')}</div>`;
}

function tierChip(tier) {
  return `<span class="chip" style="color:${tier.color}">${tier.name}</span>`;
}

function deltaText(value, expected) {
  const d = value - expected;
  if (d === 0) return `<span class="delta" style="color:var(--dim)">exactly as expected</span>`;
  const col = d > 0 ? 'var(--good)' : 'var(--bad)';
  return `<span class="delta" style="color:${col}">${d > 0 ? '+' : ''}${d} vs expected ${expected}</span>`;
}

function rollScreen() {
  const b = S.build;
  const beat = S.beats[S.idx];
  const wrap = el(`<div class="card">${progressBar()}<div id="beat"></div></div>`);
  const host = wrap.querySelector('#beat');
  host.append(renderBeat(beat, b));
  app.append(wrap);
}

function renderBeat(beat, b) {
  // --- non-skill beats reveal immediately; they have no expectation to root against
  if (beat.kind === 'height') {
    return withNext(`
      <div class="beat">
        <div class="prompt">Measurement</div>
        <div class="label">Height</div>
        <div class="value pop">${formatHeight(b.height)}</div>
        <div class="odds">This sets the expected value for every attribute that follows.</div>
      </div>`);
  }
  if (beat.kind === 'body') {
    const diff = b.wingspan - b.height;
    return withNext(`
      <div class="beat">
        <div class="prompt">Measurement</div>
        <div class="label">Wingspan &amp; Frame</div>
        <div class="value pop" style="font-size:clamp(2.6rem,11vw,4.6rem)">
          ${diff >= 0 ? '+' : ''}${diff}"
        </div>
        <div class="delta" style="color:var(--dim)">${formatHeight(b.wingspan)} wingspan &middot; ${b.frame} frame</div>
      </div>`);
  }
  if (beat.kind === 'archetype') {
    if (!S.revealed) {
      return withReveal(`
        <div class="beat">
          <div class="prompt">The gift</div>
          <div class="label">Archetype roll</div>
          <div class="odds" style="margin-top:14px">
            Seven in ten builds get nothing. One in two hundred gets something enormous.
          </div>
        </div>`);
    }
    const a = b.archetype;
    if (!a) {
      return withNext(`
        <div class="beat">
          <div class="prompt">The gift</div>
          <div class="value pop" style="font-size:clamp(2rem,8vw,3.2rem);color:var(--dim)">No archetype</div>
          <div class="odds">Seventy percent of builds roll here. Your title gets derived from
          whatever you turn out to be.</div>
        </div>`);
    }
    return withNext(`
      <div class="arch-reveal ${a.tier === 'Legendary' ? 'legendary-burst' : 'pop'}">
        <div class="tier" style="color:${a.color}">${a.tier}</div>
        <div class="title" style="color:${a.color}">${esc(a.title)}</div>
        <div class="flavor">${esc(a.flavor)}</div>
        <div class="gifts">${giftChips(a)}</div>
        ${a.guaranteesDraft ? `<div class="freak-tag" style="background:rgba(240,177,50,.13);color:#f0b132;border-color:rgba(240,177,50,.45)">Guaranteed to be drafted</div>` : ''}
      </div>`);
  }
  if (beat.kind === 'mentality') {
    if (!S.revealed) {
      return withReveal(`
        <div class="beat">
          <div class="prompt">Before a single skill</div>
          <div class="label">Mentality</div>
          <div class="odds" style="margin-top:14px">
            You find out what he wants to be <em>before</em> you find out whether he can do it.
          </div>
        </div>`);
    }
    const m = b.mentality;
    const lean = m >= 62 ? 'Score-first' : m <= 38 ? 'Pass-first' : 'Balanced';
    return withNext(`
      <div class="beat">
        <div class="prompt">Mentality</div>
        <div class="value pop">${m}</div>
        <div class="delta" style="color:var(--text)">${lean}</div>
        <div class="axis">
          <div class="axis-track"><div class="axis-dot" style="left:${m}%"></div></div>
          <div class="axis-labels"><span>Pass-first</span><span>Balanced</span><span>Score-first</span></div>
        </div>
        <div class="odds" style="margin-top:16px">
          Not good or bad. It only means something against the skills you are about to roll.
        </div>
      </div>`);
  }

  // --- skills and physicals: expectation first, number second
  const isSkill = beat.kind === 'skill';
  const key = beat.key;
  const meta = isSkill ? b.skillMeta[key] : b.physicalMeta[key];

  if (!S.revealed || !meta) {
    const expected = isSkill
      ? Math.round(
          SKILLS[key].base + (b.height - 64) * SKILLS[key].growth,
        )
      : Math.round(PHYSICALS[key].expected(b.height, b.frameIndex));
    return withReveal(`
      <div class="beat">
        <div class="prompt">${isSkill ? 'Skill' : 'Physical'}</div>
        <div class="label">${LABELS[key]}</div>
        <div class="expected">
          Expected at ${formatHeight(b.height)}${isSkill ? '' : ` &middot; ${b.frame} frame`} &mdash; <b>${expected}</b>
        </div>
      </div>`);
  }

  const value = isSkill ? b.skills[key] : b.physicals[key];
  const gifted = isSkill && meta.expectedGifted !== meta.expectedNatural;
  return withNext(
    `
    <div class="beat">
      <div class="prompt">${isSkill ? 'Skill' : 'Physical'}</div>
      <div class="label">${LABELS[key]}</div>
      <div class="value pop" style="color:${meta.tier.color}">${value}</div>
      ${deltaText(value, meta.expectedNatural)}
      <div style="margin-top:12px">${tierChip(meta.tier)}</div>
      <div class="odds">${oddsText(meta.p)} for a ${formatHeight(b.height)}</div>
      ${gifted ? `<div class="odds">Archetype moved the expectation to ${meta.expectedGifted}.</div>` : ''}
      ${meta.freak ? `<div class="freak-tag">Freak gene &mdash; variance &times;2.6 on this attribute</div>` : ''}
    </div>`,
    isSkill,
  );
}

function giftChips(a) {
  const out = [];
  for (const [k, v] of Object.entries(a.boost || {})) {
    out.push(`<span class="gift">${LABELS[k] || k} +${v}</span>`);
  }
  for (const [k, v] of Object.entries(a.cost || {})) {
    out.push(`<span class="gift cost">${LABELS[k] || k} &minus;${v}</span>`);
  }
  for (const [k, v] of Object.entries(a.sigmaMult || {})) {
    out.push(`<span class="gift mech">${LABELS[k] || k} variance &times;${v}</span>`);
  }
  for (const [k, v] of Object.entries(a.floor || {})) {
    const name = k === 'ALL' ? 'Every attribute' : LABELS[k] || k;
    out.push(`<span class="gift mech">${name} floor: expected ${v >= 0 ? '+' : '&minus;'}${Math.abs(v)}</span>`);
  }
  if (a.costNote) out.push(`<span class="gift cost">${esc(a.costNote)}</span>`);
  return out.join('');
}

function withReveal(html) {
  const node = el(`<div>${html}<div class="row" style="justify-content:center"></div></div>`);
  const bar = node.querySelector('.row');
  const btn = el(`<button class="primary">Reveal</button>`);
  btn.onclick = () => {
    const beat = S.beats[S.idx];
    const b = S.build;
    if (beat.kind === 'archetype') rollArchetypeBeat(b);
    else if (beat.kind === 'mentality') rollMentalityBeat(b);
    else if (beat.kind === 'skill') rollSkillBeat(b, beat.key);
    else if (beat.kind === 'physical') rollPhysicalBeat(b, beat.key);
    S.revealed = true;
    render();
  };
  bar.append(btn);
  bar.append(quickRollButton());
  return node;
}

function withNext(html, allowReroll = false) {
  const node = el(`<div>${html}<div class="row" style="justify-content:center"></div></div>`);
  const bar = node.querySelector('.row');
  const b = S.build;

  if (allowReroll && b.rerollsLeft > 0) {
    const rb = el(`<button>Reroll (${b.rerollsLeft} left)</button>`);
    rb.onclick = () => {
      b.rerollsLeft--;
      rollSkillBeat(b, S.beats[S.idx].key);
      render();
    };
    bar.append(rb);
  }

  const nb = el(`<button class="primary">${S.idx === S.beats.length - 1 ? 'Finish build' : 'Next'}</button>`);
  nb.onclick = () => {
    S.idx++;
    S.revealed = false;
    if (S.idx >= S.beats.length) {
      rollMentals(b);
      S.screen = 'sheet';
    }
    render();
  };
  bar.append(nb);
  bar.append(quickRollButton());
  return node;
}

function quickRollButton() {
  const btn = el(`<button class="ghost">Roll the rest</button>`);
  btn.onclick = () => {
    const b = S.build;
    if (!b.archetype && S.idx <= 2) rollArchetypeBeat(b);
    if (b.mentality === null) rollMentalityBeat(b);
    for (const k of b.order) if (b.skills[k] === undefined) rollSkillBeat(b, k);
    for (const k of PHYSICAL_KEYS) if (b.physicals[k] === undefined) rollPhysicalBeat(b, k);
    rollMentals(b);
    S.screen = 'sheet';
    render();
  };
  return btn;
}

// ---------------------------------------------------------------------------
// Build sheet
// ---------------------------------------------------------------------------
function statTile(key, value, meta) {
  return `
    <div class="stat" style="border-left-color:${meta.tier.color}">
      <div>
        <div class="k">${LABELS[key]}</div>
        <div class="exp">exp ${meta.expectedNatural}</div>
      </div>
      <div class="n" style="color:${meta.tier.color}">${value}</div>
    </div>`;
}

function sheet() {
  const b = S.build;
  const ovr = overallFor(b);
  const title = titleFor(b);
  const rarity = buildRarityTier(b);
  const pos = positionFor(b.height);
  const fit = fitFor(b);
  const lean = b.mentality >= 62 ? 'Score-first' : b.mentality <= 38 ? 'Pass-first' : 'Balanced';

  const c = el(`
    <div class="stack">
      <div class="card">
        <div class="headline">
          <div class="ovr">${ovr}</div>
          <div>
            <div class="name">${esc(S.playerName)}</div>
            <div class="meta">
              ${formatHeight(b.height)} &middot; ${b.wingspan - b.height >= 0 ? '+' : ''}${b.wingspan - b.height}" wingspan
              &middot; ${b.frame} frame &middot; ${pos.name}
            </div>
          </div>
        </div>
        <div class="row" style="margin-top:12px">
          <span class="chip" style="color:${title.color}">${esc(title.title)}</span>
          <span class="chip" style="color:${rarity.color}">${rarity.name} build</span>
          ${b.freakGene ? `<span class="chip" style="color:#ff4d4d">Freak gene: ${LABELS[b.freakGene]}</span>` : ''}
          ${S.daily ? `<span class="chip" style="color:var(--dim)">Daily ${S.seedLabel}</span>` : ''}
        </div>
        <div class="meta" style="margin-top:10px">${esc(title.flavor || '')}</div>

        <div class="section-label">Mentality &mdash; ${b.mentality} &middot; ${lean}</div>
        <div class="axis" style="margin-left:0">
          <div class="axis-track"><div class="axis-dot" style="left:${b.mentality}%"></div></div>
          <div class="axis-labels"><span>Pass-first</span><span>Balanced</span><span>Score-first</span></div>
        </div>
        <p class="note" style="margin-top:12px">
          Fit ${fit >= 0 ? '+' : ''}${fit.toFixed(2)} &mdash;
          ${
            fit > 0.15
              ? 'the mentality and the skill profile agree.'
              : fit < -0.15
                ? 'the mentality and the skill profile are in open disagreement. This costs real career.'
                : 'roughly neutral.'
          }
        </p>

        <div class="section-label">Skills</div>
        <div class="grid">${b.order.map((k) => statTile(k, b.skills[k], b.skillMeta[k])).join('')}</div>

        <div class="section-label">Physical intangibles</div>
        <div class="grid">${PHYSICAL_KEYS.map((k) => statTile(k, b.physicals[k], b.physicalMeta[k])).join('')}</div>

        <div class="section-label">Mental intangibles</div>
        <p class="note">Hidden until the career is over. Work Ethic, Basketball IQ, Clutch and
        Coachability are all driving the simulation you are about to run &mdash; you just do not
        get to see them yet.</p>

        <div class="row" style="margin-top:20px">
          <button class="primary" id="sim">Simulate career</button>
          <button id="again">Roll another</button>
          <button class="ghost" id="homeBtn">Home</button>
        </div>
      </div>
    </div>`);

  c.querySelector('#sim').onclick = () => {
    const rng = S.daily ? seededRng(`hooper-career-${S.seedLabel}`) : defaultRng;
    S.career = simulateCareer(b, rng);
    S.verdict = writeVerdict(S.career, b, rng);
    if (S.daily) saveToLeaderboard();
    S.screen = 'career';
    render();
  };
  c.querySelector('#again').onclick = () => beginBuild(S.daily);
  c.querySelector('#homeBtn').onclick = () => {
    S.screen = 'home';
    render();
  };
  app.append(c);
}

// ---------------------------------------------------------------------------
// Career
// ---------------------------------------------------------------------------
function careerScreen() {
  const b = S.build;
  const c = S.career;
  const a = c.careerAverages;
  const draftLine = c.drafted
    ? `Pick ${c.pick} of 60${c.guaranteedByArchetype ? ' (archetype guaranteed a slot)' : ''}`
    : c.madeLeague
      ? 'Undrafted &mdash; signed anyway'
      : 'Undrafted &mdash; never signed';

  const seasons = c.seasons
    .map(
      (s) => `
      <tr class="${s.allStar ? 'hl' : ''}">
        <td>${s.age}</td><td style="text-align:left">${esc(s.team)}</td><td>${s.rating}</td>
        <td>${s.games}</td><td>${s.minutes}</td>
        <td>${s.ppg}</td><td>${s.rpg}</td><td>${s.apg}</td>
        <td>${s.wins}</td>
        <td style="text-align:left">${
          [
            s.mvp ? 'MVP' : '',
            s.allStar ? 'All-Star' : '',
            s.ring ? 'CHAMPION' : '',
            s.injury ? `${s.injury.kind} (${s.injury.games}g)` : '',
          ]
            .filter(Boolean)
            .join(', ') || '&mdash;'
        }</td>
      </tr>`,
    )
    .join('');

  const node = el(`
    <div class="stack">
      <div class="card">
        <div class="verdict">
          <div class="vh">${esc(S.verdict.headline)}</div>
          <div class="vb">${esc(S.verdict.body)}</div>
        </div>
      </div>

      <div class="card">
        <div class="section-label" style="margin-top:0">Draft &mdash; ${LEAGUE_NAME}</div>
        <div class="meta">${draftLine} &middot; scout hype ${c.hype} against a true rating of ${c.overall}</div>

        <div class="section-label">Career</div>
        <div class="kpis">
          <div class="kpi"><div class="n">${c.seasons.length}</div><div class="k">Seasons</div></div>
          <div class="kpi"><div class="n">${a.ppg}</div><div class="k">PPG</div></div>
          <div class="kpi"><div class="n">${a.rpg}</div><div class="k">RPG</div></div>
          <div class="kpi"><div class="n">${a.apg}</div><div class="k">APG</div></div>
          <div class="kpi"><div class="n">${c.peakRating || '—'}</div><div class="k">Peak</div></div>
          <div class="kpi"><div class="n">${c.awards.allStars}</div><div class="k">All-Star</div></div>
          <div class="kpi"><div class="n">${c.awards.mvps}</div><div class="k">MVP</div></div>
          <div class="kpi"><div class="n">${c.awards.rings}</div><div class="k">Titles</div></div>
          <div class="kpi"><div class="n">${c.seasonsLostToInjury}</div><div class="k">Lost to injury</div></div>
          <div class="kpi"><div class="n">${c.hof ? 'YES' : 'NO'}</div><div class="k">Hall of fame</div></div>
        </div>
        ${
          c.permanentLoss.speed || c.permanentLoss.dunk
            ? `<p class="note" style="margin-top:14px">Permanent athletic loss from injury:
               &minus;${c.permanentLoss.speed} speed, &minus;${c.permanentLoss.dunk} dunk. Skills were untouched
               &mdash; which is exactly why the shooters last longer.</p>`
            : ''
        }
        <p class="note">Decline dependence ${c.dependence} &mdash; ${
          c.dependence >= 1.4
            ? 'this build lived on athleticism, and athleticism has a shelf life.'
            : c.dependence <= 0.9
              ? 'this build lived on shooting and feel, which age far better.'
              : 'a mixed profile.'
        } Peak age ~${c.peakAge}.</p>
      </div>

      ${
        c.seasons.length
          ? `<div class="card">
               <div class="section-label" style="margin-top:0">Season by season</div>
               <div class="scroll-x"><table>
                 <thead><tr><th>Age</th><th>Team</th><th>Rtg</th><th>G</th><th>MP</th>
                 <th>PPG</th><th>RPG</th><th>APG</th><th>W</th><th>Notes</th></tr></thead>
                 <tbody>${seasons}</tbody>
               </table></div>
             </div>`
          : ''
      }

      <div class="card">
        <div class="section-label" style="margin-top:0">The hidden four</div>
        <div class="grid">
          ${MENTAL_KEYS.map(
            (k) => `<div class="stat" style="border-left-color:${
              b.mentals[k] >= 85 ? '#f0b132' : b.mentals[k] <= 25 ? '#ff6b6b' : '#39404e'
            }">
              <div><div class="k">${LABELS[k]}</div></div>
              <div class="n">${b.mentals[k]}</div>
            </div>`,
          ).join('')}
        </div>
        ${
          c.traits.length
            ? `<div class="section-label">Traits &mdash; these were running the whole time</div>
               <div class="stack">${c.traits
                 .map((t) => `<div class="trait"><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></div>`)
                 .join('')}</div>`
            : `<p class="note">No traits. Nothing in the hidden four was extreme enough to bend the simulation.</p>`
        }
      </div>

      <div class="card">
        <div class="row">
          <button class="primary" id="again">Roll another</button>
          <button id="copy">Copy result</button>
          <button class="ghost" id="homeBtn">Home</button>
        </div>
      </div>
    </div>`);

  node.querySelector('#again').onclick = () => beginBuild(S.daily);
  node.querySelector('#homeBtn').onclick = () => {
    S.screen = 'home';
    render();
  };
  node.querySelector('#copy').onclick = async (e) => {
    const txt = shareText();
    try {
      await navigator.clipboard.writeText(txt);
      e.target.textContent = 'Copied';
      setTimeout(() => (e.target.textContent = 'Copy result'), 1400);
    } catch {
      e.target.textContent = 'Copy failed';
    }
  };
  app.append(node);
}

function shareText() {
  const b = S.build;
  const c = S.career;
  const a = c.careerAverages;
  return [
    `Build a Hooper${S.daily ? ` — daily ${S.seedLabel}` : ''}`,
    `${formatHeight(b.height)} ${b.frame} · ${positionFor(b.height).name} · OVR ${c.overall} · ${c.rarity.name} build`,
    S.verdict.headline,
    c.madeLeague
      ? `${c.seasons.length} seasons · ${a.ppg}/${a.rpg}/${a.apg} · ${c.awards.allStars} AS · ${c.awards.mvps} MVP · ${c.awards.rings} titles${c.hof ? ' · HOF' : ''}`
      : 'Never played a game.',
    S.verdict.body,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Daily leaderboard (local only — v1 has no backend)
// ---------------------------------------------------------------------------
function loadLb() {
  try {
    return JSON.parse(localStorage.getItem(LB_KEY)) || [];
  } catch {
    return [];
  }
}

function saveToLeaderboard() {
  const c = S.career;
  const entry = {
    date: S.seedLabel,
    name: S.playerName,
    overall: c.overall,
    title: titleLine(c),
    seasons: c.seasons.length,
    score: c.hofScore || 0,
    allStars: c.awards.allStars,
    rings: c.awards.rings,
    hof: c.hof,
    at: Date.now(),
  };
  const all = loadLb();
  all.push(entry);
  try {
    localStorage.setItem(LB_KEY, JSON.stringify(all.slice(-300)));
  } catch {
    /* storage full or blocked — the leaderboard is a nicety, not the game */
  }
}

function leaderboard() {
  const all = loadLb().filter((e) => e.date === todaySeed());
  all.sort((a, b) => b.score - a.score);
  const rows =
    all
      .map(
        (e, i) => `<tr>
          <td style="text-align:left">${i + 1}</td>
          <td style="text-align:left">${esc(e.name)}</td>
          <td style="text-align:left">${esc(e.title)}</td>
          <td>${e.overall}</td><td>${e.seasons}</td><td>${e.allStars}</td>
          <td>${e.rings}</td><td>${e.hof ? 'HOF' : ''}</td><td>${e.score}</td>
        </tr>`,
      )
      .join('') ||
    `<tr><td colspan="9" style="text-align:left;color:var(--dim)">No runs on today's seed yet.</td></tr>`;

  const node = el(`
    <div class="stack">
      <div class="card">
        <div class="section-label" style="margin-top:0">Daily seed &mdash; ${todaySeed()}</div>
        <p class="note">Everyone gets the same build on a given date. Rerolls are yours to
        spend, so two people on the same seed can still end up with different players.</p>
        <div class="scroll-x"><table class="lb">
          <thead><tr><th style="text-align:left">#</th><th style="text-align:left">Player</th>
          <th style="text-align:left">Title</th><th>OVR</th><th>Yrs</th><th>AS</th><th>Rings</th>
          <th>HOF</th><th>Score</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <p class="note" style="margin-top:14px">Stored in this browser only &mdash; v1 has no
        backend, so this is your own run history on today's seed, not a global board.</p>
        <div class="row" style="margin-top:14px">
          <button class="primary" id="play">Play today's seed</button>
          <button class="ghost" id="homeBtn">Home</button>
        </div>
      </div>
    </div>`);
  node.querySelector('#play').onclick = () => beginBuild(true);
  node.querySelector('#homeBtn').onclick = () => {
    S.screen = 'home';
    render();
  };
  app.append(node);
}

render();
