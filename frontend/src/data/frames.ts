export const FRAMES = {
  temp_cotonou: [
    { big: '31°C', meta: 'Partiellement nuageux' },
    { big: '30°C', meta: 'Ensoleillé' },
    { big: '29°C', meta: 'Légère brume' },
  ],
  temp_paris: [
    { big: '14°C', meta: 'Pluie légère' },
    { big: '13°C', meta: 'Couvert' },
    { big: '15°C', meta: 'Nuageux' },
  ],
  precip: [
    { days: ['+2j 20%', '+3j 45%', '+4j 10%'] },
    { days: ['+2j 15%', '+3j 55%', '+4j 30%'] },
    { days: ['+2j 25%', '+3j 40%', '+4j 5%'] },
  ],
  commits: [
    [
      { m: 'Fix widget refresh race condition', a: 'stella', t: '2 min' },
      { m: 'Add OAuth callback handler', a: 'aichath', t: '40 min' },
      { m: 'Update docker-compose ports', a: 'stella', t: '2 h' },
    ],
    [
      { m: "Improve /about.json generator", a: 'stella', t: "à l'instant" },
      { m: 'Fix widget refresh race condition', a: 'stella', t: '5 min' },
      { m: 'Add OAuth callback handler', a: 'aichath', t: '43 min' },
    ],
  ],
  alerts: [
    { high: 2, medium: 5 },
    { high: 1, medium: 5 },
    { high: 2, medium: 6 },
  ],
  articles: [
    [
      { t: 'Comment le Timer orchestre les widgets', n: true },
      { t: "RGAA : les bases de l'accessibilité" },
      { t: 'OAuth 2.0 expliqué simplement' },
    ],
    [
      { t: "Les secrets d'un bon docker-compose", n: true },
      { t: 'Comment le Timer orchestre les widgets' },
      { t: "RGAA : les bases de l'accessibilité" },
    ],
  ],
} as const;

export type FrameKey = keyof typeof FRAMES;
