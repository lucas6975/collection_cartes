// Évacuation : recensement au point de rassemblement. Ce téléphone garde seulement un identifiant
// d'appareil et le fait d'être déjà déclaré présent ; l'inscription Team Ulysse n'est jamais modifiée.
import { useEffect, useState } from 'react';
import { api, type EtatRassemblement } from './api';

export const STATUTS = ['Salarié IMECA', 'Intérimaire', 'Prestataire', 'Visiteur'] as const;

/** Lien du QR code à afficher au point de rassemblement (permanent : il sert à chaque évacuation). */
export const LIEN_RASSEMBLEMENT = 'https://lucas6975.github.io/collection_cartes/#/rassemblement';

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
