import { CardSchema, type Card } from '../types/card';

// Charge toutes les cartes de src/data/cards au moment du build.
const modules = import.meta.glob<{ default: unknown }>('../data/cards/*.json', { eager: true });

export const cards: Card[] = Object.values(modules).map((m) => CardSchema.parse(m.default));
