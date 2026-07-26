// Original league. Invented cities, invented clubs — nothing here maps to a real
// franchise, market, or league mark.

export const LEAGUE_NAME = 'The Continental Basketball Circuit';
export const LEAGUE_SHORT = 'CBC';

export const TEAMS = [
  'Ashgrove Kilnmen', 'Bellwater Tide', 'Calder Foundry', 'Duskmoor Ravens',
  'Eastport Riggers', 'Fenwick Blackbirds', 'Granite Bay Quarry', 'Halloway Hounds',
  'Ironvale Forge', 'Juniper Flats Coyotes', 'Kestrel City Falcons', 'Loomis Mill',
  'Marrow Creek Timber', 'Northgate Sentinels', 'Orrin Harbor Anchors', 'Pinehurst Elk',
  'Quarrytown Hammers', 'Redlick Rattlers', 'Saltmarsh Herons', 'Thornbury Rooks',
  'Umberfield Wolves', 'Vance Ridge Prospectors', 'Westbrook Current', 'Yarrow Valley Bison',
  'Alder Point Lighthouse', 'Brightwell Voltage', 'Coldspur Frost', 'Draymoor Colliers',
  'Evanhead Mariners', 'Foxglove Union',
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
