// The league, as parody.
//
// Real markets, invented clubs. City names are not anybody's trademark, and the
// nicknames are jokes rather than thin skins over real marks — Brooklyn plays as
// the Baskets, New York as the Bricklayers, Salt Lake as the Ragtime. Nothing
// here is a franchise name, a logo, or a league mark, and no real player appears
// anywhere in the game.

export const LEAGUE_NAME = 'The National Basket League';
export const LEAGUE_SHORT = 'NBL';

export const TEAMS = [
  'Atlanta Talons', 'Boston Shamrocks', 'Brooklyn Baskets', 'Charlotte Wasps',
  'Chicago Steers', 'Cleveland Cavalry', 'Dallas Wranglers', 'Denver Prospectors',
  'Detroit Motors', 'Golden Gate Guardians', 'Houston Launch', 'Indiana Speedway',
  'Los Angeles Schooners', 'Los Angeles Lagoons', 'Memphis Kodiaks', 'Miami Swelter',
  'Milwaukee Stags', 'Minnesota Timber', 'New Orleans Herons', 'New York Bricklayers',
  'Oklahoma City Squall', 'Orlando Illusion', 'Philadelphia Foundry', 'Phoenix Sunstroke',
  'Portland Trailhead', 'Sacramento Regents', 'San Antonio Stirrups', 'Seattle Rainmakers',
  'Toronto Rapture', 'Salt Lake Ragtime', 'Washington Warlocks', 'Vancouver Timberline',
];

const FIRST = [
  'Amari', 'Ambrose', 'Anders', 'Arlo', 'Beckett', 'Bryce', 'Caleb', 'Callum',
  'Cassius', 'Cyrus', 'Damari', 'Darius', 'Demetrius', 'Desmond', 'Devonte',
  'Dorian', 'Eamon', 'Elias', 'Emmett', 'Ezekiel', 'Fabian', 'Finnian', 'Gideon',
  'Grayson', 'Hollis', 'Hugo', 'Ibrahim', 'Isaiah', 'Jabari', 'Jamal', 'Jarrell',
  'Jaxon', 'Jericho', 'Josiah', 'Kai', 'Kendrick', 'Keon', 'Khalil', 'Kwame',
  'Lennox', 'Lorenzo', 'Malachi', 'Marquis', 'Mateo', 'Micah', 'Nasir', 'Nikolai',
  'Obadiah', 'Octavio', 'Omari', 'Orion', 'Prosper', 'Quentin', 'Rafael', 'Rashad',
  'Remy', 'Rondell', 'Roman', 'Samir', 'Santiago', 'Shepherd', 'Silas', 'Solomon',
  'Sterling', 'Tariq', 'Thaddeus', 'Theo', 'Tobias', 'Trevon', 'Ulysses', 'Uriah',
  'Vance', 'Vaughn', 'Wendell', 'Wilder', 'Xavier', 'Yusuf', 'Zaire', 'Zephyr',
  'Abel', 'Bodhi', 'Corbin', 'Dashiell', 'Emory', 'Foster', 'Griffin', 'Hendrix',
  'Idris', 'Jonah', 'Kingston', 'Lucian', 'Maddox', 'Nehemiah', 'Osiris', 'Phineas',
];

const LAST = [
  'Ashworth', 'Bellamy', 'Blackwood', 'Bracken', 'Brackenbury', 'Callaway',
  'Cardwell', 'Carrington', 'Chadwick', 'Coldwater', 'Cormier', 'Crenshaw',
  'Draper', 'Dunmore', 'Eastwood', 'Ellery', 'Everhart', 'Fairweather',
  'Fenmore', 'Fortier', 'Galloway', 'Garrick', 'Grimaldi', 'Hargrove',
  'Hastings', 'Hollingsworth', 'Ivers', 'Jessup', 'Kingsley', 'Larkin',
  'Lockwood', 'Maddox', 'Marchetti', 'Merrow', 'Nightingale', 'Okonkwo',
  'Orlander', 'Pemberton', 'Prescott', 'Pryce', 'Quillon', 'Radcliffe',
  'Rutherford', 'Sable', 'Sinclair', 'Stroud', 'Thistlewood', 'Toussaint',
  'Underhill', 'Vasquez-Orr', 'Vandermeer', 'Wakefield', 'Whitlock', 'Winslow',
  'Yarborough', 'Ziegler', 'Abernathy', 'Ballinger', 'Cavanaugh', 'Delacroix',
  'Emerson', 'Fairbanks', 'Grayson', 'Hollister', 'Ironside', 'Jamison',
  'Kirkpatrick', 'Lattimore', 'Montrose', 'Northcott', 'Oyelaran', 'Pennington',
  'Quinlan', 'Ravenscroft', 'Somerset', 'Thackeray', 'Uxbridge', 'Verity',
  'Wentworth', 'Yarrow', 'Adeyemi', 'Brightwater', 'Castellan', 'Dunhill',
  'Ellsworth', 'Fitzgerald', 'Goodwin', 'Harrelson', 'Islington', 'Jerivan',
];

export function randomName(rng) {
  return `${rng.pick(FIRST)} ${rng.pick(LAST)}`;
}

export function randomTeam(rng) {
  return rng.pick(TEAMS);
}

// ---------------------------------------------------------------------------
// Schools
//
// Generated from parts rather than picked from a list, because a list runs out.
// Three tiers of place name feed a set of forms, which is enough to make a
// school you have not seen before every time — and it keeps the pro league's
// names where they belong, which is the pro league. A fifteen-year-old playing
// the Dallas Wranglers is not a fixture, it is a bug.
// ---------------------------------------------------------------------------
const PLACES = [
  'Alder', 'Ashford', 'Bellwater', 'Birchwood', 'Brackenridge', 'Briarcliff',
  'Calder', 'Cedar Falls', 'Coldspur', 'Copperfield', 'Cranleigh', 'Darrow',
  'Delta', 'Draymoor', 'Duskmoor', 'Eastport', 'Elmridge', 'Evanhead',
  'Fairweather', 'Fenwick', 'Foxglove', 'Glenmara', 'Granite Bay', 'Halloway',
  'Harlow', 'Hawthorne', 'Ironvale', 'Ironwood', 'Junction', 'Juniper Flats',
  'Kestrel', 'Kingsmere', 'Larkspur', 'Loomis', 'Marrow Creek', 'Meadowvale',
  'Northgate', 'Oakhurst', 'Orrin Harbor', 'Pinehurst', 'Quarrytown', 'Redlick',
  'Ridgeline', 'Rockford Hills', 'Saltmarsh', 'Shalefield', 'Silverbrook',
  'Stonebridge', 'Thornbury', 'Umberfield', 'Vance Ridge', 'Wexford',
  'Westbrook', 'Whitmore', 'Willowbank', 'Yarrow Valley', 'Ashcombe',
  'Brightwell', 'Carrowmore', 'Dunmoor', 'Everglade', 'Fernhill', 'Gallowbay',
  'Hartsfield', 'Innisfree', 'Jasper Bend', 'Kirkstone', 'Lambert', 'Maplecrest',
  'Norwood', 'Oakvale', 'Pemberton', 'Quill River', 'Rosemont', 'Stanhope',
  'Tarrow', 'Underwood', 'Vinemount', 'Wrenfield',
];

const SAINTS = [
  'Aubrey', 'Brannon', 'Cuthbert', 'Delaney', 'Edmund', 'Finnian', 'Gideon',
  'Hilda', 'Ignatius', 'Jerome', 'Kilian', 'Loyola', 'Malachy', 'Nolan',
  'Oswald', 'Perpetua', 'Quentin', 'Rafferty', 'Sebastian', 'Thaddeus',
];

// High school. The suffix carries most of the character — a Country Day and a
// Central are not the same school even in the same town.
const HS_FORMS = [
  (p) => `${p} High`,
  (p) => `${p} High`,
  (p) => `${p} Central`,
  (p) => `${p} Prep`,
  (p) => `${p} Academy`,
  (p) => `${p} Country Day`,
  (p) => `${p} East`,
  (p) => `${p} West`,
  (p) => `${p} North`,
  (p) => `${p} South`,
  (p) => `${p} Technical`,
];

const COLLEGE_FORMS = [
  (p) => `${p} State`,
  (p) => `${p} State`,
  (p) => `${p} University`,
  (p) => `University of ${p}`,
  (p) => `${p} Tech`,
  (p) => `${p} A&M`,
  (p) => `${p} College`,
  (p) => `${p} Poly`,
  (p) => `Western ${p}`,
  (p) => `Eastern ${p}`,
  (p) => `${p} Baptist`,
];

export function randomHighSchool(rng) {
  if (rng.chance(0.12)) return `St. ${rng.pick(SAINTS)}'s`;
  return rng.pick(HS_FORMS)(rng.pick(PLACES));
}

export function randomCollege(rng) {
  if (rng.chance(0.1)) return `St. ${rng.pick(SAINTS)}`;
  return rng.pick(COLLEGE_FORMS)(rng.pick(PLACES));
}

// Whoever you are actually playing this season. The pro league only ever shows
// up once you are in it.
export function randomOpponent(stage, rng) {
  if (stage === 'pro') return randomTeam(rng);
  if (stage === 'college') return randomCollege(rng);
  return randomHighSchool(rng);
}
