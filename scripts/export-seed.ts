// Génère supabase/seed.sql à partir des contenus TypeScript (source unique de vérité).
// Usage : npm run db:seed
import { writeFileSync } from 'node:fs';
import { CARDS } from '../src/content/cards';
import { QUESTIONS } from '../src/content/questions';
import { PARCOURS, SCENARIOS } from '../src/content/scenarios';

const lit = (v: unknown): string => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v) && v.every((x) => typeof x === 'string'))
    return `array[${v.map(lit).join(', ')}]::text[]`;
  if (typeof v === 'object') return `${lit(JSON.stringify(v))}::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
const row = (vals: unknown[]) => `  (${vals.map(lit).join(', ')})`;

const out: string[] = [
  '-- Fichier généré par scripts/export-seed.ts : ne pas modifier à la main.',
  '-- Contenus de démonstration publiés mais NON vérifiés : à valider avant usage réel.',
  '',
  'insert into public.cards (id, numero, nom, categorie, rarete, icone, description, info, le_savais_tu, a_retenir, obtention, nature, sources, verif_statut, publie) values',
  CARDS.map((c) =>
    row([
      c.id,
      c.numero,
      c.nom,
      c.categorie,
      c.rarete,
      c.icone,
      c.description,
      c.info,
      c.leSavaisTu,
      c.aRetenir,
      c.obtention,
      c.nature,
      c.sources,
      c.verification.statut,
      c.publie,
    ]),
  ).join(',\n') + ';',
  '',
  'insert into public.questions (id, categorie, difficulte, enonce, choix, bonne_reponse, explication, nature, sources, verif_statut, publie) values',
  QUESTIONS.map((q) =>
    row([
      q.id,
      q.categorie,
      q.difficulte,
      q.enonce,
      q.choix,
      q.bonneReponse,
      q.explication,
      q.nature,
      q.sources,
      q.verification.statut,
      q.publie,
    ]),
  ).join(',\n') + ';',
  '',
  'insert into public.scenarios (id, categorie, titre, accroche, lieu, etapes, nature, sources, verif_statut, publie) values',
  SCENARIOS.map((s) =>
    row([
      s.id,
      s.categorie,
      s.titre,
      s.accroche,
      s.lieu,
      s.etapes,
      s.nature,
      s.sources,
      s.verification.statut,
      s.publie,
    ]),
  ).join(',\n') + ';',
  '',
  'insert into public.parcours (id, categorie, titre, description, question_ids, seuil, publie) values',
  PARCOURS.map((p) =>
    row([p.id, p.categorie, p.titre, p.description, p.questionIds, p.seuil, p.publie]),
  ).join(',\n') + ';',
  '',
];

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), out.join('\n'));
console.log(
  `seed.sql : ${CARDS.length} cartes, ${QUESTIONS.length} questions, ${SCENARIOS.length} scénarios, ${PARCOURS.length} parcours`,
);
