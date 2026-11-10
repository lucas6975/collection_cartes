// Connexion à la base Supabase (inscriptions et tirages au sort).
//
// Ces deux valeurs se trouvent dans Supabase › Project Settings › API (voir docs/SUPABASE.md).
// La clé « anon » est publique par conception : elle ne donne accès qu'aux fonctions prévues,
// et la liste des inscrits reste protégée par le code administrateur.

const URL_PROJET = '';
const CLE_ANON = '';

export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || URL_PROJET;
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || CLE_ANON;

export const baseConfiguree = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
