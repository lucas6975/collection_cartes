// Fabrique la version « un seul fichier » de la fonction Supabase envoyer-rappels,
// plus simple à coller dans l'éditeur du tableau de bord Supabase.
//   node scripts/fonction-tout-en-un.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const dossier = new URL('../supabase/functions/envoyer-rappels/', import.meta.url);

export function toutEnUn() {
  const index = readFileSync(new URL('index.ts', dossier), 'utf8');
  const rappel = readFileSync(new URL('rappel.ts', dossier), 'utf8');
  const sansImportLocal = index.replace(/import \{[^}]*\} from '\.\/rappel\.ts';\n/, '');
  const i = sansImportLocal.indexOf('\nconst RAPPEL_ESSAI');
  return (
    '// FICHIER UNIQUE à coller dans Supabase › Edge Functions › envoyer-rappels › index.ts\n' +
    '// (généré par scripts/fonction-tout-en-un.mjs, ne pas modifier à la main)\n\n' +
    sansImportLocal.slice(0, i).trimEnd() +
    '\n\n// ───────────── Choix du rappel selon l’heure de Paris ─────────────\n\n' +
    rappel.trim() +
    '\n' +
    sansImportLocal.slice(i)
  );
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  writeFileSync(new URL('tout-en-un.ts', dossier), toutEnUn());
  console.log('supabase/functions/envoyer-rappels/tout-en-un.ts mis à jour');
}
