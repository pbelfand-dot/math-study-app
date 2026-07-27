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
  'Amari', 'Bryce', 'Cassius', 'Dorian', 'Elias', 'Fabian', 'Gideon', 'Hollis',
  'Isaiah', 'Jarrell', 'Kendrick', 'Lennox', 'Marquis', 'Nasir', 'Omari', 'Prosper',
  'Quentin', 'Rashad', 'Solomon', 'Tobias', 'Ulysses', 'Vance', 'Wendell', 'Xavier',
  'Yusuf', 'Zaire', 'Ambrose', 'Beckett', 'Cyrus', 'Demetrius', 'Ezekiel', 'Finnian',
];

const LAST = [
  'Ashworth', 'Bellamy', 'Cardwell', 'Draper', 'Ellery', 'Fenmore', 'Garrick', 'Hastings',
  'Ivers', 'Jessup', 'Kingsley', 'Larkin', 'Merrow', 'Nightingale', 'Orlander', 'Pryce',
  'Quillon', 'Rutherford', 'Sable', 'Thistlewood', 'Underhill', 'Vasquez-Orr', 'Whitlock',
  'Yarborough', 'Ziegler', 'Brackenbury', 'Coldwater', 'Dunmore', 'Everhart', 'Fairweather',
];

export function randomName(rng) {
  return `${rng.pick(FIRST)} ${rng.pick(LAST)}`;
}

export function randomTeam(rng) {
  return rng.pick(TEAMS);
}
