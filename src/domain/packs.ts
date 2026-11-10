// Règles des packs. Fonctions pures, testées. En production, le tirage est fait côté serveur
// (fonction open_daily_pack de supabase/migrations) pour qu'il ne puisse pas être manipulé.

import type { Card, PackOpening, Progress, Rarity } from './types';

export const CARTES_PAR_PACK = 5;

/** Probabilités de chaque rareté pour un emplacement normal (total = 100). */
export const PROBABILITES: Record<Rarity, number> = {
  commune: 52,
  'peu-commune': 27,
  rare: 12,
  epique: 5,
  legendaire: 4,
};

/** Le dernier emplacement garantit au moins une carte peu commune. */
export const PROBABILITES_GARANTIE: Record<Rarity, number> = {
  commune: 0,
  'peu-commune': 58,
  rare: 26,
  epique: 9,
  legendaire: 7,
};

const ORDRE: Rarity[] = ['commune', 'peu-commune', 'rare', 'epique', 'legendaire'];

/** Générateur pseudo-aléatoire déterministe : le même pack pour la même graine. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 2 ** 32;
  };
}

export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Jour local (AAAA-MM-JJ) : le pack du jour change à minuit, heure du collaborateur. */
export const jourDe = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function tirerRarete(
  rand: () => number,
  table: Record<Rarity, number>,
  disponibles: Set<Rarity>,
): Rarity {
  const choix = ORDRE.filter((r) => disponibles.has(r) && table[r] > 0);
  const total = choix.reduce((s, r) => s + table[r], 0);
  let x = rand() * total;
  for (const r of choix) {
    x -= table[r];
    if (x < 0) return r;
  }
  return choix[choix.length - 1];
}

/** Tire les cartes d'un pack, triées de la plus commune à la plus rare (la meilleure à la fin). */
export function tirerPack(cards: Card[], seed: number): Card[] {
  const rand = rng(seed);
  const parRarete = new Map<Rarity, Card[]>();
  // Les cartes à débloquer (Ulysse) ne sortent jamais d'un pack.
  for (const c of cards.filter((x) => !x.deblocage))
    parRarete.set(c.rarete, [...(parRarete.get(c.rarete) ?? []), c]);
  const disponibles = new Set(parRarete.keys());
  const tirage: Card[] = [];
  for (let i = 0; i < CARTES_PAR_PACK; i++) {
    const table = i === CARTES_PAR_PACK - 1 ? PROBABILITES_GARANTIE : PROBABILITES;
    const rarete = tirerRarete(rand, table, disponibles);
    // Évite les doublons à l'intérieur d'un même pack quand c'est possible.
    const pool = parRarete.get(rarete)!;
    const libres = pool.filter((c) => !tirage.includes(c));
    const source = libres.length ? libres : pool;
    tirage.push(source[Math.floor(rand() * source.length)]);
  }
  return tirage.sort((a, b) => ORDRE.indexOf(a.rarete) - ORDRE.indexOf(b.rarete));
}

export const packDuJourOuvert = (p: Progress, now: Date) =>
  p.packs.some((x) => !x.bonus && x.jour === jourDe(now));

export class PackIndisponible extends Error {}

export interface PackResult {
  progress: Progress;
  cards: Card[];
  /** Pour chaque carte du pack : vrai si elle est nouvelle dans la collection. */
  nouvelles: boolean[];
  /** Carte secrète débloquée grâce à ce pack (Ulysse, quand les 5 LSR sont réunies). */
  debloquee: Card | null;
}

/** Ulysse se débloque dès que toutes les règles qui sauvent la vie sont dans la collection. */
export function carteADebloquer(cards: Card[], possedees: Set<string>): Card | null {
  const lsr = cards.filter((c) => c.categorie === 'lsr');
  const secrete = cards.find((c) => c.deblocage === 'toutes-les-lsr');
  if (!secrete || possedees.has(secrete.id) || lsr.length === 0) return null;
  return lsr.every((c) => possedees.has(c.id)) ? secrete : null;
}

/**
 * Ouvre un pack et ajoute ses cartes à la collection. Le pack du jour est unique par jour ;
 * sa graine dépend du joueur et de la date, donc recharger la page ne change pas son contenu.
 */
export function ouvrirPack(
  cards: Card[],
  progress: Progress,
  now: Date,
  bonus = false,
): PackResult {
  if (!bonus && packDuJourOuvert(progress, now)) {
    throw new PackIndisponible('Le pack du jour a déjà été ouvert.');
  }
  const jour = jourDe(now);
  const n = progress.packs.length;
  const seed = hash(`${progress.userId}|${jour}|${bonus ? `bonus-${n}` : 'jour'}`);
  const tirage = tirerPack(cards, seed);

  const owned = new Map(progress.cards.map((c) => [c.cardId, { ...c }]));
  const at = now.toISOString();
  const nouvelles = tirage.map((c) => {
    const o = owned.get(c.id);
    if (o) {
      o.count++;
      return false;
    }
    owned.set(c.id, { cardId: c.id, count: 1, firstAt: at });
    return true;
  });
  const debloquee = carteADebloquer(cards, new Set(owned.keys()));
  if (debloquee) owned.set(debloquee.id, { cardId: debloquee.id, count: 1, firstAt: at });
  const pack: PackOpening = { jour, at, cardIds: tirage.map((c) => c.id), bonus };
  return {
    progress: { ...progress, cards: [...owned.values()], packs: [...progress.packs, pack] },
    cards: tirage,
    nouvelles,
    debloquee,
  };
}

/** Nombre de jours consécutifs (jusqu'à aujourd'hui ou hier) où le pack du jour a été ouvert. */
export function serie(p: Progress, now: Date): number {
  const jours = new Set(p.packs.filter((x) => !x.bonus).map((x) => x.jour));
  const d = new Date(now);
  if (!jours.has(jourDe(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (jours.has(jourDe(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const progressionVide = (userId: string): Progress => ({ userId, cards: [], packs: [] });
