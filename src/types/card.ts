import { z } from 'zod';

/** Familles de cartes. */
export const CATEGORIES = ['menace', 'defense', 'concept', 'outil', 'incident'] as const;

/** Rareté, de la plus courante à la plus rare. */
export const RARETES = ['commune', 'peu-commune', 'rare', 'epique', 'legendaire'] as const;

export const CardSchema = z.object({
  /** Identifiant unique, en kebab-case, identique au nom du fichier JSON. */
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id doit être en kebab-case'),
  nom: z.string().min(1),
  categorie: z.enum(CATEGORIES),
  rarete: z.enum(RARETES),
  /** Explication courte affichée sur la carte. */
  description: z.string().min(10).max(400),
  /** Le message pédagogique : ce que l'équipe doit retenir. */
  aRetenir: z.string().min(10).max(300),
  /** Sources de référence (OWASP, ANSSI, CVE, MITRE ATT&CK...). */
  sources: z.array(z.string().url()).min(1),
  tags: z.array(z.string()).default([]),
});

export type Card = z.infer<typeof CardSchema>;
export type Categorie = (typeof CATEGORIES)[number];
export type Rarete = (typeof RARETES)[number];
