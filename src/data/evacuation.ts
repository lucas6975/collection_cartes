// Évacuation : recensement au point de rassemblement. Ce téléphone garde seulement un identifiant
// d'appareil et le fait d'être déjà déclaré présent ; l'inscription Team Ulysse n'est jamais modifiée.
import { useEffect, useState } from 'react';
import { api, type EtatRassemblement } from './api';

export const STATUTS = ['Salarié IMECA', 'Intérimaire', 'Prestataire', 'Visiteur'] as const;

const SITE = 'https://lucas6975.github.io/collection_cartes/';

/**
 * Lien du QR code du point de rassemblement (permanent : il sert à chaque évacuation). Il contient
 * un code secret : se déclarer présent exige de l'avoir scanné (affiche ou téléphone de
 * Lucas / Vincent), pour qu'on ne puisse pas le faire depuis chez soi.
 */
export const lienRassemblement = (codeLieu: string) => `${SITE}#/rassemblement?p=${codeLieu}`;

/** Code du point de rassemblement contenu dans un lien ou un QR scanné (ou null). */
export function codeLieuDe(texte: string): string | null {
  const m = /#\/rassemblement\?(?:.*&)?p=([0-9a-f]{6,32})/i.exec(texte);
  return m ? m[1].toLowerCase() : null;
}

const CLE_APPAREIL = 'team-ulysse-appareil';
const CLE_PRESENT = 'team-ulysse-present';

export function identifiantAppareil(): string {
  try {
    let id = localStorage.getItem(CLE_APPAREIL);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLE_APPAREIL, id);
    }
    return id;
  } catch {
    return 'inconnu';
  }
}

export interface DejaPresent {
  evacuation: string;
  heure: string;
  nom: string;
}

/** Ce téléphone s'est déjà déclaré présent à cette évacuation ? */
export function dejaPresent(evacuation: string | null): DejaPresent | null {
  if (!evacuation) return null;
  try {
    const v = JSON.parse(localStorage.getItem(CLE_PRESENT) ?? 'null') as DejaPresent | null;
    return v?.evacuation === evacuation ? v : null;
  } catch {
    return null;
  }
}

export function noterPresent(v: DejaPresent) {
  try {
    localStorage.setItem(CLE_PRESENT, JSON.stringify(v));
  } catch {
    /* stockage indisponible */
  }
}

export const heureFr = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** État de l'évacuation, revérifié régulièrement et quand l'appli revient au premier plan. */
export function useEvacuation(intervalle = 30_000): EtatRassemblement | null {
  const [etat, setEtat] = useState<EtatRassemblement | null>(null);
  useEffect(() => {
    let actif = true;
    const verifier = () =>
      api
        .rassemblementEtat()
        .then((e) => actif && setEtat(e))
        .catch(() => undefined);
    void verifier();
    const t = setInterval(verifier, intervalle);
    const auRetour = () => document.visibilityState === 'visible' && void verifier();
    document.addEventListener('visibilitychange', auRetour);
    return () => {
      actif = false;
      clearInterval(t);
      document.removeEventListener('visibilitychange', auRetour);
    };
  }, [intervalle]);
  return etat;
}
