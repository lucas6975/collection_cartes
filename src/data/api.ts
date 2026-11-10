// Appels aux fonctions de la base (supabase/setup.sql), via l'API REST de Supabase.

import { SUPABASE_ANON_KEY, SUPABASE_URL, baseConfiguree } from '../config';

export class ApiError extends Error {
  constructor(
    message: string,
    /** Vrai si la base n'est pas joignable (réseau, base non configurée). */
    readonly horsLigne = false,
  ) {
    super(message);
  }
}

async function rpc<T>(fonction: string, args: Record<string, unknown>): Promise<T> {
  if (!baseConfiguree()) throw new ApiError('La base de données n’est pas encore connectée.', true);
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fonction}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });
  } catch {
    throw new ApiError('Connexion impossible. Vérifie ton réseau et réessaie.', true);
  }
  const texte = await res.text();
  const corps: unknown = texte ? JSON.parse(texte) : null;
  if (!res.ok) {
    const message = (corps as { message?: string } | null)?.message ?? `Erreur ${res.status}`;
    throw new ApiError(message);
  }
  return corps as T;
}

export interface Inscription {
  id: string;
  jeton: string;
  prenom: string;
  nom: string;
  jours: number[];
}

export interface Participant {
  id: string;
  prenom: string;
  nom: string;
  jours: number[];
  inscrit_le: string;
}

export interface Tirage {
  jour: number;
  participant_id: string | null;
  prenom: string;
  nom: string;
  tire_le?: string;
}

export const api = {
  inscrire: (prenom: string, nom: string, jours: number[], jeton?: string) =>
    rpc<Inscription>('inscrire', {
      p_prenom: prenom,
      p_nom: nom,
      p_jours: jours,
      p_jeton: jeton ?? null,
    }),

  maParticipation: (jeton: string) =>
    rpc<{ prenom: string; nom: string; jours: number[]; gagne: number[] | null } | null>(
      'ma_participation',
      {
        p_jeton: jeton,
      },
    ),

  adminVerifier: (code: string) => rpc<boolean>('admin_verifier', { p_code: code }),

  adminListe: (code: string) =>
    rpc<{ participants: Participant[]; tirages: Tirage[] }>('admin_liste', { p_code: code }),

  adminTirer: (code: string, jour: number, refaire = false) =>
    rpc<Tirage>('admin_tirer', { p_code: code, p_jour: jour, p_refaire: refaire }),

  adminAnnulerTirage: (code: string, jour: number) =>
    rpc<null>('admin_annuler_tirage', { p_code: code, p_jour: jour }),

  adminSupprimer: (code: string, id: string) =>
    rpc<null>('admin_supprimer', { p_code: code, p_id: id }),
};
