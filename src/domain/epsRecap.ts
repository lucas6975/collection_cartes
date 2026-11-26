// Récapitulatif des EPS et contenu de l'extraction Excel. Fonctions pures, testées.
import type { Cellule, Feuille } from '../data/excel';
import type { LigneEps } from '../data/api';
import { FREQUENCES, NIVEAUX, QUESTIONS, TYPES_REPONSE, dansDeuxMois, type Niveau } from './eps';

const sansAccent = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const MOIS = [
  'Janv.',
  'Févr.',
  'Mars',
  'Avr.',
  'Mai',
  'Juin',
  'Juil.',
  'Août',
  'Sept.',
  'Oct.',
  'Nov.',
  'Déc.',
];

export interface Compte {
  nom: string;
  n: number;
}

/** Regroupe des noms écrits différemment (« Gérard Brun », « BRUN Gerard ») : orthographe la plus fréquente. */
function regrouper(noms: (string | null)[]): Compte[] {
  const groupes = new Map<string, Map<string, number>>();
  for (const brut of noms) {
    const nom = brut?.trim();
    if (!nom) continue;
    // Clé sans ordre : « Gérard Brun » et « BRUN Gerard » donnent la même.
    const cle = sansAccent(nom)
      .toUpperCase()
      .split(/[\s.]+/)
      .filter(Boolean)
      .sort()
      .join(' ');
    const g = groupes.get(cle) ?? new Map<string, number>();
    g.set(nom, (g.get(nom) ?? 0) + 1);
    groupes.set(cle, g);
  }
  return [...groupes.values()]
    .map((g) => {
      const [nom] = [...g.entries()].sort((a, b) => b[1] - a[1])[0];
      return { nom, n: [...g.values()].reduce((s, v) => s + v, 0) };
    })
    .sort((a, b) => b.n - a.n || a.nom.localeCompare(b.nom));
}

export interface RecapEps {
  total: number;
  personnes: number;
  excel: number;
  appli: number;
  parMois: number[];
  interviewers: Compte[];
  managers: Compte[];
  /** Personnes interviewées plusieurs fois dans l'année. */
  plusieurs: { nom: string; dates: string[] }[];
  /** Personnes qu'on ne peut pas encore réinterviewer aujourd'hui (moins de 2 mois). */
  enAttente: { nom: string; libre: string }[];
}

export function recapEps(eps: LigneEps[], annee: number, aujourdhui: string): RecapEps {
  const duAn = eps.filter((e) => e.date.startsWith(String(annee)));
  const parMois = Array<number>(12).fill(0);
  duAn.forEach((e) => parMois[Number(e.date.slice(5, 7)) - 1]++);

  const parPersonne = new Map<string, LigneEps[]>();
  for (const e of duAn) parPersonne.set(e.cle, [...(parPersonne.get(e.cle) ?? []), e]);
  const plusieurs = [...parPersonne.values()]
    .filter((l) => l.length > 1)
    .map((l) => ({ nom: l[0].interviewe, dates: l.map((e) => e.date).sort() }))
    .sort((a, b) => b.dates.length - a.dates.length || a.nom.localeCompare(b.nom));

  // Dernière EPS de chaque personne (toutes années) : encore dans les 2 mois ?
  const derniere = new Map<string, LigneEps>();
  for (const e of eps) {
    const d = derniere.get(e.cle);
    if (!d || e.date > d.date) derniere.set(e.cle, e);
  }
  const enAttente = [...derniere.values()]
    .map((e) => ({ nom: e.interviewe, libre: dansDeuxMois(e.date) }))
    .filter((x) => x.libre > aujourdhui)
    .sort((a, b) => a.libre.localeCompare(b.libre));

  return {
    total: duAn.length,
    personnes: parPersonne.size,
    excel: duAn.filter((e) => e.source === 'import').length,
    appli: duAn.filter((e) => e.source !== 'import').length,
    parMois,
    interviewers: regrouper(duAn.map((e) => e.interviewer)),
    managers: regrouper(duAn.map((e) => e.manager)),
    plusieurs,
    enAttente,
  };
}

// ───────────── Extraction Excel ─────────────

const enDate = (iso: string) => {
  const [a, m, j] = iso.split('-').map(Number);
  return new Date(a, m - 1, j);
};
const nomNiveau = (n: number | null | undefined) => (n ? NIVEAUX[n as Niveau].nom : null);

/** Les feuilles du fichier Excel : EPS, réponses détaillées, récap, interviewers, managers. */
export function feuillesEps(
  eps: LigneEps[],
  inscrits: number,
  annee: number,
  aujourdhui: string,
): Feuille[] {
  const tri = [...eps].sort((a, b) => a.date.localeCompare(b.date));

  const liste: Cellule[][] = [
    [
      'Date',
      'Interviewé',
      'Interviewer',
      'Manager',
      'Correspondant sécurité',
      'Service / atelier',
      'Q1 · Vigilance reçue',
      'Q2 · Vigilance donnée',
      'Q3 · Correspondant sécurité',
      'Q4 · Manager',
      'Moyenne pondérée',
      'Culture sécurité (Bradley)',
      'Réinterview possible le',
      'Origine',
    ],
    ...tri.map((e) => [
      enDate(e.date),
      e.interviewe,
      e.interviewer,
      e.manager,
      e.correspondant,
      e.service,
      ...QUESTIONS.map((_, i) => nomNiveau(e.niveaux?.[i])),
      e.score === null ? null : Math.round(Number(e.score) * 100) / 100,
      nomNiveau(e.niveau),
      enDate(dansDeuxMois(e.date)),
      e.source === 'import' ? 'Fichier Excel' : 'Appli',
    ]),
  ];

  const detail: Cellule[][] = [
    [
      'Date',
      'Interviewé',
      'Interviewer',
      'Question',
      'Résumé de l’échange',
      'Type de réponse',
      'Fréquence de renforcement',
      'Niveau',
    ],
  ];
  for (const e of tri) {
    if (!e.reponses) continue;
    e.reponses.forEach((r, i) =>
      detail.push([
        enDate(e.date),
        e.interviewe,
        e.interviewer,
        `Q${i + 1} · ${QUESTIONS[i].court}`,
        r.resume,
        r.type ? `${r.type} - ${TYPES_REPONSE[r.type - 1]}` : null,
        r.frequence ? `${r.frequence} - ${FREQUENCES[r.frequence - 1]}` : null,
        nomNiveau(e.niveaux?.[i]),
      ]),
    );
  }

  const rc = recapEps(eps, annee, aujourdhui);
  const recap: Cellule[][] = [
    [`Récap EPS ${annee}`, 'Valeur'],
    ['EPS réalisées', rc.total],
    ['Personnes interviewées', rc.personnes],
    ['Inscrits à l’appli Team Ulysse', inscrits],
    [
      'Taux de réalisation (personnes / inscrits)',
      inscrits ? `${Math.round((rc.personnes / inscrits) * 100)} %` : null,
    ],
    ['EPS du fichier Excel', rc.excel],
    ['EPS faites dans l’appli', rc.appli],
    [],
    ['Mois', 'EPS'],
    ...MOIS.map((m, i) => [m, rc.parMois[i]]),
    [],
    ['Interviewé plusieurs fois', 'Dates'],
    ...rc.plusieurs.map((p) => [
      p.nom,
      p.dates.map((d) => d.split('-').reverse().join('/')).join(' · '),
    ]),
  ];

  return [
    {
      nom: 'EPS',
      lignes: liste,
      largeurs: [12, 20, 26, 26, 22, 16, 16, 16, 16, 16, 12, 18, 16, 13],
    },
    { nom: 'Réponses détaillées', lignes: detail, largeurs: [12, 20, 24, 26, 50, 40, 24, 16] },
    { nom: 'Récap', lignes: recap, largeurs: [42, 50] },
    {
      nom: 'Interviewers',
      lignes: [
        ['Interviewer', `EPS menées en ${annee}`],
        ...rc.interviewers.map((c) => [c.nom, c.n]),
      ],
      largeurs: [32, 20],
    },
    {
      nom: 'Managers',
      lignes: [
        ['Manager', `Personnes interviewées en ${annee}`],
        ...rc.managers.map((c) => [c.nom, c.n]),
      ],
      largeurs: [32, 28],
    },
  ];
}

/** EPS des 7 derniers jours (aujourd'hui compris), les plus récentes d'abord. */
export function epsDeLaSemaine(eps: LigneEps[], maintenant = new Date()): LigneEps[] {
  const debut = new Date(maintenant);
  debut.setDate(debut.getDate() - 6);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const de = iso(debut);
  const a = iso(maintenant);
  return eps
    .filter((e) => e.date >= de && e.date <= a)
    .sort((x, y) => y.date.localeCompare(x.date));
}
