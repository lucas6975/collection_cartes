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
  /** Vrai quand l'administrateur a débloqué la correction pour le gagnant de ce jour. */
  correction_debloquee?: boolean;
}

export interface Volontaire {
  id: string;
  prenom: string;
  nom: string;
  participant_id: string | null;
  le: string;
}

export interface AbonnementRappels {
  endpoint: string;
  p256dh: string;
  auth: string;
  pack: boolean;
  avent: boolean;
}

export type EtatEchange = 'ouvert' | 'propose' | 'accepte' | 'refuse' | 'annule';

export interface Echange {
  code: string;
  etat: EtatEchange;
  nom_a: string;
  nom_b: string | null;
  doublons_a: string[];
  doublons_b: string[];
  /** Carte que B donne et carte que B reçoit (prise dans les doublons de A). */
  donne_b: string | null;
  recoit_b: string | null;
}

export const api = {
  echangeCreer: (nom: string, doublons: string[]) =>
    rpc<{ code: string; cle: string }>('echange_creer', { p_nom: nom, p_doublons: doublons }),
  echangeRejoindre: (code: string, nom: string, doublons: string[]) =>
    rpc<Echange & { cle: string }>('echange_rejoindre', {
      p_code: code,
      p_nom: nom,
      p_doublons: doublons,
    }),
  echangeProposer: (code: string, cle: string, donne: string, recoit: string) =>
    rpc<Echange>('echange_proposer', {
      p_code: code,
      p_cle: cle,
      p_donne: donne,
      p_recoit: recoit,
    }),
  echangeRepondre: (code: string, cle: string, accepte: boolean) =>
    rpc<Echange>('echange_repondre', { p_code: code, p_cle: cle, p_accepte: accepte }),
  echangeVoir: (code: string, cle: string) =>
    rpc<Echange | null>('echange_voir', { p_code: code, p_cle: cle }),
  echangeAnnuler: (code: string, cle: string) =>
    rpc<null>('echange_annuler', { p_code: code, p_cle: cle }),

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

  rejoindreCoalition: (prenom: string, nom: string, jeton?: string) =>
    rpc<{ deja: boolean }>('rejoindre_coalition', {
      p_prenom: prenom,
      p_nom: nom,
      p_jeton: jeton ?? null,
    }),

  adminVolontaires: (code: string) => rpc<Volontaire[]>('admin_volontaires', { p_code: code }),

  adminSupprimerVolontaire: (code: string, id: string) =>
    rpc<null>('admin_supprimer_volontaire', { p_code: code, p_id: id }),

  rappelsEnregistrer: (abo: AbonnementRappels, jeton?: string) =>
    rpc<null>('enregistrer_rappels', {
      p_endpoint: abo.endpoint,
      p_p256dh: abo.p256dh,
      p_auth: abo.auth,
      p_pack: abo.pack,
      p_avent: abo.avent,
      p_jeton: jeton ?? null,
    }),
  rappelsSupprimer: (endpoint: string) => rpc<null>('supprimer_rappels', { p_endpoint: endpoint }),
  correctionBloquee: (jeton: string, jour: number) =>
    rpc<boolean>('correction_bloquee', { p_jeton: jeton, p_jour: jour }),

  adminDebloquerCorrection: (code: string, jour: number, debloquer = true) =>
    rpc<null>('admin_debloquer_correction', {
      p_code: code,
      p_jour: jour,
      p_debloquer: debloquer,
    }),

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
