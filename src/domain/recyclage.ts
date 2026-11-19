// Recyclage des doublons : 5 cartes en trop = 1 pack bonus, une fois par jour.
// Fonctions pures, testées.
import { jourDe } from './packs';
import type { Card, OwnedCard, Progress, Rarity } from './types';

export const RECYCLAGE_COUT = 5;
export const RECYCLAGES_PAR_JOUR = 1;

const ORDRE: Rarity[] = ['commune', 'peu-commune', 'rare', 'epique', 'legendaire'];
/** Jamais présélectionnées : on les garde pour les échanges. */
const PRECIEUSES: Rarity[] = ['epique', 'legendaire'];

/** Cartes en plusieurs exemplaires et nombre de copies en trop (jamais les cartes à débloquer). */
export function copiesEnTrop(p: Progress, cards: Card[]): { card: Card; enTrop: number }[] {
  const parId = new Map(cards.map((c) => [c.id, c]));
  return p.cards
    .map((o: OwnedCard) => ({ card: parId.get(o.cardId), enTrop: o.count - 1 }))
    .filter(
      (x): x is { card: Card; enTrop: number } => !!x.card && !x.card.deblocage && x.enTrop > 0,
    )
    .sort(
      (a, b) =>
        ORDRE.indexOf(a.card.rarete) - ORDRE.indexOf(b.card.rarete) ||
        a.card.numero - b.card.numero,
    );
}

export const totalEnTrop = (p: Progress, cards: Card[]) =>
  copiesEnTrop(p, cards).reduce((n, x) => n + x.enTrop, 0);

export const recyclagesDuJour = (p: Progress, now: Date) =>
  (p.recyclages ?? []).filter((j) => j === jourDe(now)).length;

export const peutRecycler = (p: Progress, cards: Card[], now: Date) =>
  totalEnTrop(p, cards) >= RECYCLAGE_COUT && recyclagesDuJour(p, now) < RECYCLAGES_PAR_JOUR;

/** Présélection : les copies en trop les plus courantes (jamais épiques ni légendaires). */
export function choixParDefaut(p: Progress, cards: Card[]): Record<string, number> {
  const choix: Record<string, number> = {};
  let reste = RECYCLAGE_COUT;
  for (const { card, enTrop } of copiesEnTrop(p, cards)) {
    if (!reste || PRECIEUSES.includes(card.rarete)) continue;
    const n = Math.min(enTrop, reste);
    choix[card.id] = n;
    reste -= n;
  }
  return choix;
}

export class RecyclageImpossible extends Error {}

/** Retire les copies choisies (5 au total, toujours au moins un exemplaire gardé). */
export function retirerCopies(
  p: Progress,
  cards: Card[],
  choix: Record<string, number>,
  now: Date,
): Progress {
  if (recyclagesDuJour(p, now) >= RECYCLAGES_PAR_JOUR)
    throw new RecyclageImpossible('Tu as déjà recyclé aujourd’hui. Reviens demain !');
  const total = Object.values(choix).reduce((n, x) => n + x, 0);
  if (total !== RECYCLAGE_COUT)
    throw new RecyclageImpossible(`Choisis exactement ${RECYCLAGE_COUT} doublons.`);
  const dispo = new Map(copiesEnTrop(p, cards).map((x) => [x.card.id, x.enTrop]));
  for (const [id, n] of Object.entries(choix))
    if (n < 0 || n > (dispo.get(id) ?? 0))
      throw new RecyclageImpossible('Ce doublon n’est plus disponible.');
  return {
    ...p,
    cards: p.cards.map((c) => (choix[c.cardId] ? { ...c, count: c.count - choix[c.cardId] } : c)),
    recyclages: [...(p.recyclages ?? []), jourDe(now)],
  };
}
