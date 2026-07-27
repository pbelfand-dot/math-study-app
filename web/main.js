import { SKILLS, SKILL_KEYS, PHYSICALS, MENTALS, MENTAL_KEYS } from '../src/constants.js';
import { rollCompleteBuild, formatHeight, clamp } from '../src/roll.js';
import { titleFor } from '../src/archetypes.js';
import { potentialGrade, positionFor, buildRarityTier } from '../src/overall.js';
import { simulateCareer } from '../src/career.js';
import { writeVerdict } from '../src/verdict.js';
import { defaultRng } from '../src/rng.js';
import { randomName } from '../src/names.js';
import { Progress } from '../src/progress.js';
import {
  newLife, advanceYear, overallNow, starRating, heightAt, gradeName,
  trainingFor, slotsFor, commit, declare, returnToSchool, proBuildFrom,
  draftProjection,
} from '../src/life.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const LABELS = {
  ...Object.fromEntries(Object.entries(SKILLS).map(([k, v]) => [k, v.label])),
  ...Object.fromEntries(Object.entries(PHYSICALS).map(([k, v]) => [k, v.label])),
  ...Object.fromEntries(Object.entries(MENTALS).map(([k, v]) => [k, v.label])),
};
const money = (n) => `$${Math.round(n).toLocaleString()}`;

const S = { life: null, plan: [], view: 'life', prog: Progress.load(), career: null, verdict: null };

// ---------------------------------------------------------------------------
// New life
// ---------------------------------------------------------------------------
function startLife() {
  const rng = defaultRng;
  // The roll engine still runs in full — it is now describing genetics: the
  // height he finishes at and the ceiling on every attribute.
  const build = rollCompleteBuild(rng);
  S.life = newLife(build, randomName(rng), rng);
  S.plan = [];
  S.career = null;
  S.verdict = null;
  S.wonBadges = null;
  Progress.saveLife(S.life);
  render();
}

// Pick a life back up where it was left. A career that already finished is not
// resumable — there is nothing left to decide — so that one starts fresh.
function resumeOrStart() {
  const saved = Progress.loadLife();
  if (!saved || saved.stage === 'pro') { startLife(); return; }
  S.life = saved;
  S.plan = [];
  render();
}

// ---------------------------------------------------------------------------
// Header + meters
// ---------------------------------------------------------------------------
const METERS = [
  ['health', 'Health', 'var(--health)'],
  ['energy', 'Energy', 'var(--energy)'],
  ['hype', 'Hype', 'var(--hype)'],
  ['rep', 'Rep', 'var(--rep)'],
  ['grades', 'Grades', 'var(--grades)'],
  ['chemistry', 'Coach', 'var(--chem)'],
];

function headerHtml() {
  const L = S.life;
  const h = heightAt(L);
  const stars = starRating(L);
  const college = L.stage === 'college';
  const where = college ? esc(L.program.school) : esc(L.background.name);
  return `
    <div class="top">
      <div class="who">
        <div class="nm">${esc(L.name)}</div>
        <div class="sub">
          ${gradeName(L.age, L.stage)} &middot; ${formatHeight(h)} &middot; ${money(L.money)}
          &middot; ${where}
          <br />${
            college
              // Stars are a recruiting number. Once you are in a program nobody
              // cares what you were rated; what matters is where you would go.
              ? `<span class="stars">${esc(draftProjection(L).label)}</span>`
              : `<span class="stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span>`
          }
          <span style="color:var(--muted)"> &middot; ${esc(L.teamRole)}</span>
        </div>
      </div>
      <div class="ovr-badge"><b>${overallNow(L)}</b><span>Overall</span></div>
    </div>
    <div class="meters">
      ${METERS.map(([k, label, col]) => {
        const v = Math.round(L.meters[k]);
        return `<div class="meter">
          <div class="k">${label}</div>
          <div class="track"><div class="fill" style="width:${clamp(v, 0, 100)}%;background:${col}"></div></div>
          <div class="v">${v}</div>
        </div>`;
      }).join('')}
    </div>`;
}

// ---------------------------------------------------------------------------
// The year feed
// ---------------------------------------------------------------------------
function yearHtml(e) {
  const where = e.school ? ` &middot; ${esc(e.school)}` : '';
  return `<article class="year">
    <header>
      <h3>${e.grade} year${e.stage === 'college' ? ' <span class="tag">College</span>' : ''}</h3>
      <span class="meta">${formatHeight(e.height)} &middot; OVR ${e.ovr}${
        e.stage === 'college' ? '' : ` &middot; ${'★'.repeat(e.stars)}`
      }${where}</span>
    </header>
    <div class="body">
      ${
        e.stats
          ? `<div class="line-stat">${e.role} &middot; ${e.stats.ppg} pts, ${e.stats.rpg} reb, ${e.stats.apg} ast in ${e.stats.mpg} min</div>`
          : `<div class="line-stat">${esc(e.role)} &mdash; no stats this year</div>`
      }
      ${e.events.map((v) => `<div class="ev ${v.kind}"><span class="dot"></span><span>${esc(v.text)}</span></div>`).join('')}
    </div>
  </article>`;
}

// ---------------------------------------------------------------------------
// The plan — three slots, each with a real cost
// ---------------------------------------------------------------------------
function planHtml() {
  const L = S.life;
  const slots = slotsFor(L);
  const left = slots - S.plan.length;
  return `<div class="panel">
    <h2>Plan the year</h2>
    <p class="hint">${
      left > 0
        ? `Pick ${left} more — you get ${slots} a year, and everything costs something.`
        : 'Ready. Press the button to play the year.'
    }</p>
    <div class="opts">
      ${trainingFor(L).map((t) => {
        const picked = S.plan.filter((p) => p === t.id).length;
        const gated = t.gated && L.meters.hype < t.gated;
        const broke = t.cost > L.money;
        const full = left <= 0 && !picked;
        const bits = [];
        if (t.cost) bits.push(`${broke ? '<b>' : ''}${money(t.cost)}${broke ? '</b>' : ''}`);
        if (t.money) bits.push(`+${money(t.money)}`);
        if (t.energy) bits.push(`${t.energy > 0 ? '+' : ''}${t.energy} energy`);
        if (t.hype) bits.push(`+${t.hype} hype`);
        if (t.grades) bits.push(`${t.grades > 0 ? '+' : ''}${t.grades} grades`);
        if (t.rep) bits.push(`+${t.rep} rep`);
        if (t.stock) bits.push(`+${t.stock} draft stock`);
        if (t.nil) bits.push('endorsement money');
        if (t.health) bits.push(`${t.health > 0 ? '+' : ''}${t.health} health`);
        if (gated) bits.push('<b>needs more hype</b>');
        return `<button class="opt" data-t="${t.id}" type="button"
            aria-pressed="${picked ? 'true' : 'false'}" ${gated || broke || full ? 'disabled' : ''}>
          <span class="pick">${picked ? picked : ''}</span>
          <span class="txt">
            <span class="t">${esc(t.name)}</span>
            <span class="d">${esc(t.blurb)}</span>
            <span class="cost">${bits.join(' &middot; ')}</span>
          </span>
        </button>`;
      }).join('')}
    </div>
  </div>
  <div class="advance">
    <button class="big" id="advance" type="button" ${left > 0 ? 'disabled' : ''}>
      <span class="plus">+</span> Play ${gradeName(L.age, L.stage)} year
    </button>
  </div>`;
}

// ---------------------------------------------------------------------------
// Decision: where do you go after high school
// ---------------------------------------------------------------------------
function offersHtml() {
  const L = S.life;
  const stars = starRating(L);
  return `<div class="panel">
    <h2>Where do you go?</h2>
    <p class="hint">Four years of high school are done — you graduate a
      ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} recruit. This is what came in.</p>
    <div class="opts">
      ${L.offers.map((o, i) => `
        <div class="offer${o.pro ? ' risky' : ''}" style="margin-bottom:8px">
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
        </div>`).join('')}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Decision: stay in school or put your name in
// ---------------------------------------------------------------------------
function declareHtml() {
  const L = S.life;
  const proj = draftProjection(L);
  const forced = L.pending === 'forced';
  return `<div class="panel">
    <h2>${forced ? 'You are out of eligibility' : 'Declare for the draft?'}</h2>
    <p class="hint">${
      forced
        ? 'Four years of college are done. There is nothing left to go back to.'
        : 'Leave now and you sell the years of development you have not had yet. Stay and you bank the ability, but you are that much closer to finished when they draft you.'
    }</p>
    <div class="proj ${proj.tone}">${esc(proj.label)}</div>
    <p class="note">That is a projection, not a promise. Nobody knows what you top out at — including the people writing it.</p>
    <div class="row" style="margin-top:12px">
      <button class="btn primary" id="doDeclare" type="button">Declare for the draft</button>
      ${forced ? '' : '<button class="btn" id="doStay" type="button">Go back to school</button>'}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// The pro career, once he leaves school
// ---------------------------------------------------------------------------
function runCareer() {
  const L = S.life;
  const rng = defaultRng;

  // The engine that projects present ability onto the genetic ceiling lives in
  // life.js, so the Monte Carlo harness and the app hand the draft the same
  // build. It used to live here, which meant the sweep could not see it.
  declare(L);
  const b = proBuildFrom(L);

  const c = simulateCareer(b, rng);
  const v = writeVerdict(c, b, rng);
  S.career = c;
  S.verdict = v;

  Progress.record(S.prog, c, b, {
    name: L.name, pos: positionFor(b.height).short, height: b.height,
    title: c.title.title, grade: potentialGrade(b), daily: false,
  });
  const won = Progress.checkAchievements(S.prog, c, b);
  Progress.save(S.prog);
  Progress.saveLife(null);
  S.wonBadges = won;
  render();
}

function careerHtml() {
  const c = S.career;
  const a = c.careerAverages;
  const line = (k, v) => `<div class="meter" style="grid-template-columns:1fr auto"><div class="k">${k}</div><div class="v">${v}</div></div>`;
  return `<div class="panel">
    <h2>The career</h2>
    <h3 style="font-size:19px;margin-bottom:2px">${c.drafted ? `Pick #${c.pick}` : 'Undrafted'} &mdash; ${esc(c.teams[0] || 'nobody')}</h3>
    <p class="note" style="margin-bottom:8px">${
      S.life.program
        ? `${esc(S.life.program.school)}, ${S.life.age - 18} year${S.life.age - 18 === 1 ? '' : 's'} &middot; declared at ${S.life.age}`
        : `Declared straight out of high school at ${S.life.age}`
    }</p>
    <p class="hint">${esc(S.verdict.headline)}</p>
    ${c.madeLeague ? line('Draft OVR → peak', `${c.draftOvr} → ${c.peakRating}`) : ''}
    ${line('Seasons', c.seasons.length)}
    ${c.madeLeague ? line('Career averages', `${a.ppg} / ${a.rpg} / ${a.apg}`) : ''}
    ${line('All-stars', c.awards.allStars)}
    ${line('MVPs', c.awards.mvps)}
    ${line('Championships', c.awards.rings)}
    ${line('Hall of fame', c.hof ? 'Inducted' : '—')}
    <p class="note" style="margin-top:12px">${esc(S.verdict.body)}</p>
  </div>
  ${
    (S.wonBadges || []).length
      ? `<div class="panel"><h2>Unlocked</h2><div class="badges">${S.wonBadges
          .map((b) => `<div class="badge on"><b>${esc(b.name)}</b><span>${esc(b.hint)}</span></div>`)
          .join('')}</div></div>`
      : ''
  }
  <div class="panel">
    <h2>The hidden four</h2>
    <p class="note" style="margin-bottom:10px">These were driving everything and you could not see them.</p>
    <div class="attrs">
      ${MENTAL_KEYS.map((k) => `<div class="attr">
        <span class="k">${LABELS[k]}</span><span class="v">${S.life.mentals[k]}</span>
      </div>`).join('')}
    </div>
  </div>
  <div class="advance"><button class="big" id="again" type="button"><span class="plus">+</span> Start a new life</button></div>`;
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------
function render() {
  const L = S.life;
  if (!L) return;
  const body =
    S.career ? careerHtml()
    : L.pending === 'decision' ? offersHtml()
    : L.pending ? declareHtml()
    : planHtml();

  $('lifeView').innerHTML =
    headerHtml() +
    `<div class="feed">${[...L.log].reverse().map(yearHtml).join('')}</div>` +
    body;

  if (!S.career) Progress.saveLife(L);

  // Wire the plan.
  for (const el of $('lifeView').querySelectorAll('[data-t]')) {
    el.onclick = () => {
      const id = el.dataset.t;
      const at = S.plan.indexOf(id);
      if (at >= 0) S.plan.splice(at, 1);
      else if (S.plan.length < slotsFor(S.life)) S.plan.push(id);
      render();
    };
  }
  const adv = $('advance');
  if (adv) {
    adv.onclick = () => {
      advanceYear(S.life, S.plan, defaultRng);
      S.plan = [];
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }
  for (const el of $('lifeView').querySelectorAll('[data-offer]')) {
    el.onclick = () => {
      const offer = S.life.offers[Number(el.dataset.offer)];
      if (offer.pro) { runCareer(); return; }
      commit(S.life, offer);
      S.plan = [];
      render();
    };
  }
  const dec = $('doDeclare');
  if (dec) dec.onclick = () => runCareer();
  const stay = $('doStay');
  if (stay) {
    stay.onclick = () => {
      returnToSchool(S.life);
      S.plan = [];
      render();
    };
  }
  const again = $('again');
  if (again) again.onclick = startLife;

  syncViews();
}

function attrsHtml() {
  const L = S.life;
  const t = titleFor(L.build);
  return `<div class="panel">
    <h2>Attributes &mdash; now vs your ceiling</h2>
    <p class="hint">The bar is where you are. The notch is as far as your genetics go,
    at your current height. Training closes the gap; nothing closes it all the way on its own.</p>
    <div class="attrs">
      ${SKILL_KEYS.map((k) => {
        const now = Math.round(L.attrs[k]);
        const cap = L.build.skills[k];
        return `<div class="attr">
          <span class="k">${LABELS[k]}</span><span class="v">${now}</span>
          <span class="bar"><span class="now" style="width:${now}%"></span>
            <span class="cap" style="left:${clamp(cap, 0, 99)}%"></span></span>
        </div>`;
      }).join('')}
    </div>
    <h2 style="margin-top:16px">Body</h2>
    <div class="attrs">
      ${Object.keys(PHYSICALS).map((k) => `<div class="attr">
        <span class="k">${LABELS[k]}</span><span class="v">${L.physicals[k]}</span>
      </div>`).join('')}
    </div>
    <h2 style="margin-top:16px">Profile</h2>
    <p class="note">${esc(t.title)} &mdash; ${esc(t.flavor || '')}<br />
    Mentality ${L.build.mentality} &middot; ${
      L.build.mentality >= 62 ? 'score-first' : L.build.mentality <= 38 ? 'pass-first' : 'balanced'
    }${L.build.freakGene ? ` &middot; freak gene: ${LABELS[L.build.freakGene]}` : ''}</p>
  </div>`;
}

function vaultHtml() {
  const p = S.prog;
  const best = Progress.bestCareers(p, 25);
  return `<div class="panel">
    <h2>Career vault</h2>
    ${
      best.length
        ? `<div class="scroll-x"><table>
            <thead><tr><th>#</th><th>Player</th><th>Pick</th><th>Peak</th><th>Yrs</th><th>AS</th><th>Rings</th><th>Score</th></tr></thead>
            <tbody>${best.map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.name)}</td><td>${e.pick ?? '—'}</td>
              <td>${e.peak}</td><td>${e.seasons}</td><td>${e.allStars}</td><td>${e.rings}</td><td>${e.score}</td></tr>`).join('')}
            </tbody></table></div>`
        : '<p class="note">Nothing yet. Finish a life and it lands here.</p>'
    }
    <h2 style="margin-top:16px">Back up your progress</h2>
    <p class="note">No account, no server. Copy this somewhere safe.</p>
    <textarea id="backupBox" class="backup" readonly rows="3">${esc(Progress.exportProgress(p))}</textarea>
    <div class="row" style="margin-top:9px">
      <button class="btn" id="copyBackup" type="button">Copy backup</button>
      <button class="btn" id="pasteBackup" type="button">Restore</button>
    </div>
    <div id="restoreSlot"></div>
  </div>`;
}

function badgesHtml() {
  const p = S.prog;
  const got = Object.keys(p.achievements).length;
  return `<div class="panel">
    <h2>Achievements &mdash; ${got} of ${Progress.ACHIEVEMENTS.length}</h2>
    <div class="badges">${Progress.ACHIEVEMENTS.map((a) => {
      const on = !!p.achievements[a.id];
      return `<div class="badge ${on ? 'on' : ''}"><b>${esc(a.name)}</b><span>${esc(a.hint)}</span></div>`;
    }).join('')}</div>
  </div>`;
}

function syncViews() {
  for (const [id, name] of [['lifeView', 'life'], ['attrsView', 'attrs'], ['vaultView', 'vault'], ['badgesView', 'badges']]) {
    $(id).classList.toggle('hidden', name !== S.view);
  }
  for (const [id, name] of [['navLife', 'life'], ['navAttrs', 'attrs'], ['navVault', 'vault'], ['navBadges', 'badges']]) {
    $(id).setAttribute('aria-pressed', String(name === S.view));
  }
}

function setView(v) {
  S.view = v;
  if (v === 'attrs') $('attrsView').innerHTML = attrsHtml();
  if (v === 'vault') { $('vaultView').innerHTML = vaultHtml(); wireBackup(); }
  if (v === 'badges') $('badgesView').innerHTML = badgesHtml();
  syncViews();
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
      <div class="row" style="margin-top:9px"><button class="btn primary" id="doRestore" type="button">Restore</button></div>
      <div id="restoreMsg" class="note"></div>`;
    $('doRestore').onclick = () => {
      const r = Progress.importProgress($('restoreBox').value);
      if (!r.ok) { $('restoreMsg').innerHTML = `<span style="color:var(--bad)">${esc(r.error)}</span>`; return; }
      S.prog = r.progress;
      Progress.save(S.prog);
      setView('vault');
    };
  };
}

$('navLife').onclick = () => setView('life');
$('navAttrs').onclick = () => setView('attrs');
$('navVault').onclick = () => setView('vault');
$('navBadges').onclick = () => setView('badges');

// iOS buries "Add to Home Screen" in the Share sheet; shown once, dismissible.
(function installHint() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
  const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  if (!isIOS || standalone) return;
  try { if (localStorage.getItem('hooper.installHint') === 'off') return; } catch { /* ignore */ }
  $('installHint').innerHTML =
    `<span>Install it: tap <b>Share</b>, then <b>Add to Home Screen</b>.</span>
     <button class="btn" id="hintClose" type="button">Got it</button>`;
  $('installHint').classList.remove('hidden');
  $('hintClose').onclick = () => {
    $('installHint').classList.add('hidden');
    try { localStorage.setItem('hooper.installHint', 'off'); } catch { /* ignore */ }
  };
})();

resumeOrStart();
