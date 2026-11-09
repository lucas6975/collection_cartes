// Génère supabase/seed.sql à partir des cartes TypeScript (source unique de vérité).
// Usage : npm run db:seed
import { writeFileSync } from 'node:fs';
import { CARDS } from '../src/content/cards';

const lit = (v: unknown): string => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') return `${lit(JSON.stringify(v))}::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

const rows = CARDS.map(
  (c) =>
    `  (${[c.id, c.numero, c.nom, c.categorie, c.rarete, c.icone, c.description, c.info, c.leSavaisTu, c.aRetenir, c.nature, c.sources, c.verification.statut].map(lit).join(', ')})`,
);

const out = [
  '-- Fichier généré par scripts/export-seed.ts : ne pas modifier à la main.',
  '-- Contenus de démonstration NON vérifiés : à valider avant usage réel.',
  '',
  'insert into public.cards (id, numero, nom, categorie, rarete, icone, description, info, le_savais_tu, a_retenir, nature, sources, verif_statut) values',
  rows.join(',\n') + ';',
  '',
].join('\n');

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), out);
console.log(`seed.sql : ${CARDS.length} cartes`);
