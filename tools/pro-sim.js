// Does the stepped pro engine produce the same league the one-shot one does?
// Monte Carlo for the year-by-year pro engine.
//
// It shares career.js's season maths but wraps it in contracts, free agency and
// an independent roster, so it needs its own gate: the published award rates
// have to survive the wrapper.
//
//   npm run sim -- --league
import { playLife } from './life-sim.js';
import {
  draftNight, newPro, playSeason, freeAgencyOffers, signWith, acceptTrade, retire,
} from '../src/pro.js';

export function leagueCheck(n, rng) {
  let lives=0, made=0, seasons=0, allStars=0, mvps=0, rings=0, hof=0, roty=0;
  let ratingSeasons=0, r70=0, r80=0, r90=0, earnings=[], careerLens=[];
  for (let i=0;i<n;i++){
    const { life, pro: handoff } = playLife(rng);
    lives++;
    const d = draftNight(handoff.build, life, rng);
    if (!d.drafted && !d.signed) continue;
    made++;
    const p = newPro(handoff.build, life, d, rng);
    let guard=0;
    while (!p.retired && guard++ < 30) {
      playSeason(p, rng);
      if (p.pending === 'retire') retire(p);
      else if (p.pending === 'freeagency') signWith(p, freeAgencyOffers(p, rng)[0]);
      else if (p.pending === 'trade') acceptTrade(p, rng);
    }
    if (!p.retired) retire(p);
    seasons += p.seasons.length; careerLens.push(p.seasons.length);
    allStars += p.awards.allStars; mvps += p.awards.mvps; rings += p.awards.rings; roty += p.awards.roty;
    if (p.hof) hof++;
    earnings.push(p.earnings);
    for (const s of p.seasons){ ratingSeasons++; if(s.rating>=90) r90++; else if(s.rating>=80) r80++; else if(s.rating>=70) r70++; }
}
const pc=(n,d)=>((n/d)*100).toFixed(2)+'%';
const q=(a,p)=>{a.sort((x,y)=>x-y);return a[Math.floor(p*(a.length-1))];};
console.log(`\nTHE LEAGUE — ${lives.toLocaleString()} lives -> ${made} pro careers (${pc(made,lives)})`);
  console.log('-'.repeat(60));
console.log(`mean career ${(seasons/made).toFixed(1)} seasons · median ${q(careerLens,0.5)}`);
console.log('\nPER PLAYER-SEASON vs a 450-player league');
console.log('  all-star      ', pc(allStars, seasons).padStart(7), '   target 5.3%');
console.log('  MVP           ', pc(mvps, seasons).padStart(7), '   target 0.22%');
console.log('  championship  ', pc(rings, seasons).padStart(7), '   target 3.3%');
console.log('  rated 70-79   ', pc(r70, ratingSeasons).padStart(7), '   ~33%');
console.log('  rated 80-89   ', pc(r80, ratingSeasons).padStart(7), '   ~10%');
console.log('  rated 90+     ', pc(r90, ratingSeasons).padStart(7), '   ~1.3%');
console.log('\nhall of fame (of those who played):', pc(hof, made), '  target ~0.5%');
console.log('rookie of the year per career:', (roty/made).toFixed(3));
console.log('career earnings: median', (q(earnings,0.5)/1e6).toFixed(1)+'M', '· p90', (q(earnings,0.9)/1e6).toFixed(1)+'M', '· max', (q(earnings,1)/1e6).toFixed(0)+'M');
}
