// Appels aux fonctions de la base (supabase/setup.sql), via l'API REST de Supabase.

import { SUPABASE_ANON_KEY, SUPABASE_URL, baseConfiguree } from '../config';
import type { LigneClassement } from './classement';
import type { SuiviPacks } from './packsAdmin';
import type { ChiffresVisites } from './visites';

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

/** Roue de Secours : étapes d'une personne (onglet « Roue » de l'admin). */
export interface SuiviRoue {
  participant_id: string;
  vue_le: string | null;
  ouverte_le: string | null;
  tournee_le: string | null;
  gain: string | null;
}

/** Sauveteur secouriste du travail (espace Sécurité, en test). */
export interface ContactSst {
  prenom: string;
  nom: string;
  telephone: string;
  role: string;
  /** Où le trouver : RDC, Étage, Atelier… (null si non renseigné). */
  lieu?: string | null;
}

/** Remontée de situation à risque (page « Remontées reçues »). */
export interface RemonteeRecue {
  id: string;
  prenom: string;
  nom: string;
  type: string;
  lieu: string;
  description: string;
  gravite: string;
  cree_le: string;
  traitee: boolean;
}

export interface Participant {
  id: string;
  prenom: string;
  nom: string;
  jours: number[];
  inscrit_le: string;
}

/** Chiffres du lancement (onglet « Lancement » de l'espace admin). */
export interface ChiffresLancement {
  rappels: number;
  avec_rappels: string[];
  echanges: number;
  /** Absent tant que supabase/maj-visites.sql n'a pas été lancé. */
  visites?: ChiffresVisites;
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
  /** Cartes qui manquent à chacun (absentes si la base n'est pas à jour). */
  manquantes_a?: string[];
  manquantes_b?: string[];
  /** Carte que B donne et carte que B reçoit (prise dans les doublons de A). */
  donne_b: string | null;
  recoit_b: string | null;
}

export interface ResultatAdmin {
  jour: number;
  participant_id: string;
  prenom: string;
  nom: string;
  /** Étoiles du tout premier essai (la personne peut rejouer ensuite). */
  premier_etoiles: number;
  premier_le: string;
  /** Meilleur résultat obtenu. */
  etoiles: number;
  details: { etoiles: number; resume: string }[];
  maj_le: string;
}

/** Appelle la fonction Supabase des rappels (test des notifications par l'administrateur). */
async function fonctionRappels<T>(corps: Record<string, unknown>): Promise<T> {
  if (!baseConfiguree()) throw new ApiError('La base de données n’est pas encore connectée.', true);
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/envoyer-rappels`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(corps),
    });
  } catch {
    throw new ApiError('Connexion impossible. Vérifie ton réseau et réessaie.', true);
  }
  const r = (await res.json().catch(() => ({}))) as T & { erreur?: string };
  if (!res.ok || r.erreur) throw new ApiError(r.erreur ?? `Erreur ${res.status}`);
  return r;
}

export const api = {
  adminTesterCompteARebours: (code: string, endpoint: string) =>
    fonctionRappels<{ envoyes: number }>({ test_compte_a_rebours: true, code, endpoint }),

  adminTesterEvenements: (code: string, endpoint: string) =>
    fonctionRappels<{ envoyes: number }>({ test_evenements: true, code, endpoint }),

  adminTesterInscription: (code: string, endpoint: string) =>
    fonctionRappels<{ envoyes: number }>({ test_inscription: true, code, endpoint }),

  /** Alerte « Nouvel inscrit » sur ce téléphone : vrai = activer, faux = couper, absent = lire. */
  adminAlertesInscrits: (code: string, endpoint: string, actif?: boolean) =>
    rpc<boolean>('admin_alertes_inscrits', {
      p_code: code,
      p_endpoint: endpoint,
      p_actif: actif ?? null,
    }),

  envoyerResultat: (
    jeton: string,
    jour: number,
    etoiles: number,
    details: { etoiles: number; resume: string }[],
  ) =>
    rpc<null>('envoyer_resultat', {
      p_jeton: jeton,
      p_jour: jour,
      p_etoiles: etoiles,
      p_details: details,
    }),
  adminResultats: (code: string) => rpc<ResultatAdmin[]>('admin_resultats', { p_code: code }),

  adminOffrirCarte: (code: string, participant: string, carte: string) =>
    rpc<null>('admin_offrir_carte', { p_code: code, p_participant: participant, p_carte: carte }),
  recupererCadeaux: (jeton: string) => rpc<string[]>('recuperer_cadeaux', { p_jeton: jeton }),

  numeroUlysseOr: (appareil: string) => rpc<number>('numero_ulysse_or', { p_appareil: appareil }),

  noterVisite: (appareil: string, etape: string, plateforme: string) =>
    rpc<null>('noter_visite', { p_appareil: appareil, p_etape: etape, p_plateforme: plateforme }),

  envoyerPacks: (
    jeton: string,
    packs: { jour: string; at: string }[],
    cartes: number,
    extra?: { legendaires: number; admin: boolean; masque: boolean },
  ) =>
    rpc<null>(
      'envoyer_packs',
      extra
        ? {
            p_jeton: jeton,
            p_packs: packs,
            p_cartes: cartes,
            p_legendaires: extra.legendaires,
            p_admin: extra.admin,
            p_masque: extra.masque,
          }
        : { p_jeton: jeton, p_packs: packs, p_cartes: cartes },
    ),

  classement: (jeton: string | null, code: string | null) =>
    rpc<LigneClassement[]>('classement', { p_jeton: jeton, p_code: code }).catch((e) => {
      // Ancienne version du SQL (jeton seulement).
      if (jeton) return rpc<LigneClassement[]>('classement', { p_jeton: jeton });
      throw e;
    }),

  adminPacks: (code: string) => rpc<SuiviPacks[]>('admin_packs', { p_code: code }),

  noterRoue: (jeton: string, etape: string, gain?: string) =>
    rpc<null>('noter_roue', { p_jeton: jeton, p_etape: etape, p_gain: gain ?? null }),
  adminRoue: (code: string) => rpc<SuiviRoue[]>('admin_roue', { p_code: code }),

  envoyerRemontee: (r: {
    prenom: string;
    nom: string;
    type: string;
    lieu: string;
    description: string;
    gravite: string;
  }) =>
    rpc<null>('envoyer_remontee', {
      p_prenom: r.prenom,
      p_nom: r.nom,
      p_type: r.type,
      p_lieu: r.lieu,
      p_description: r.description,
      p_gravite: r.gravite,
    }),

  mesRemontees: (jeton: string | null, code: string | null) =>
    rpc<RemonteeRecue[]>('mes_remontees', { p_jeton: jeton, p_code: code }),
  traiterRemontee: (id: string, traitee: boolean, jeton: string | null, code: string | null) =>
    rpc<null>('traiter_remontee', { p_id: id, p_traitee: traitee, p_jeton: jeton, p_code: code }),

  securiteSst: (code: string | null, jeton: string | null) =>
    rpc<ContactSst[]>('securite_sst', { p_code: code, p_jeton: jeton }),
  accesSecurite: (jeton: string) => rpc<boolean>('acces_securite', { p_jeton: jeton }),

  adminLancement: (code: string) => rpc<ChiffresLancement>('admin_lancement', { p_code: code }),

  // Les cartes manquantes ne sont envoyées que si supabase/maj-echanges-v2.sql a été lancé.
  echangeCreer: (nom: string, doublons: string[], manquantes: string[]) =>
    rpc<{ code: string; cle: string }>('echange_creer', {
      p_nom: nom,
      p_doublons: doublons,
      p_manquantes: manquantes,
    }).catch(() =>
      rpc<{ code: string; cle: string }>('echange_creer', { p_nom: nom, p_doublons: doublons }),
    ),
  echangeRejoindre: (code: string, nom: string, doublons: string[], manquantes: string[]) =>
    rpc<Echange & { cle: string }>('echange_rejoindre', {
      p_code: code,
      p_nom: nom,
      p_doublons: doublons,
      p_manquantes: manquantes,
    }).catch((e: unknown) => {
      // Code expiré ou déjà utilisé : on garde le message ; sinon, ancienne version de la base.
      if (e instanceof ApiError && /valable|utilisé/.test(e.message)) throw e;
      return rpc<Echange & { cle: string }>('echange_rejoindre', {
        p_code: code,
        p_nom: nom,
        p_doublons: doublons,
      });
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
