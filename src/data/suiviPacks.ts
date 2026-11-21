// Envoie à la base l'historique des packs du jour de la personne inscrite, pour l'onglet
// « Packs » de l'espace admin : à l'ouverture de l'appli, à son retour au premier plan,
// et après chaque pack ouvert.
import { CARDS } from '../content/cards';
import { api } from './api';
import { masqueStore } from './classement';
import { identiteStore } from './identite';
import { game } from './store';

let enCours = false;
let encore = false;

export async function envoyerPacks(): Promise<void> {
  const id = identiteStore.get().identite;
  if (!id?.jeton || !id.synchro) return;
  if (enCours) {
    encore = true;
    return;
  }
  enCours = true;
  try {
    const p = game.getState().progress;
    const packs = p.packs.filter((x) => !x.bonus).map((x) => ({ jour: x.jour, at: x.at }));
    const legendaires = p.cards.filter(
      (c) => CARDS.find((x) => x.id === c.cardId)?.rarete === 'legendaire',
    ).length;
    const extra = {
      legendaires,
      admin: !!identiteStore.get().codeAdmin,
      masque: masqueStore.get(),
    };
    try {
      await api.envoyerPacks(id.jeton, packs, p.cards.length, extra);
    } catch {
      // SQL du classement pas encore lancé : ancienne version de la fonction.
      await api.envoyerPacks(id.jeton, packs, p.cards.length);
    }
  } catch {
    /* sans importance : renvoyé à la prochaine ouverture */
  } finally {
    enCours = false;
    if (encore) {
      encore = false;
      void envoyerPacks();
    }
  }
}

let demarre = false;

export function demarrerSuiviPacks() {
  if (demarre) return;
  demarre = true;
  void envoyerPacks();
  let nb = game.getState().progress.packs.length;
  game.subscribe(() => {
    const n = game.getState().progress.packs.length;
    if (n !== nb) {
      nb = n;
      void envoyerPacks();
    }
  });
  // L'inscription vient d'être envoyée : on transmet aussitôt l'historique.
  let jeton = identiteStore.get().identite?.jeton;
  identiteStore.subscribe(() => {
    const j = identiteStore.get().identite?.jeton;
    if (j && j !== jeton) {
      jeton = j;
      void envoyerPacks();
    }
  });
  // Choix « masquer mon nom » : envoyé tout de suite.
  masqueStore.subscribe(() => void envoyerPacks());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void envoyerPacks();
  });
}
