// Roue de Secours : signale à la base, une seule fois par étape, que la personne a vu la
// bannière, ouvert la roue, puis l'a fait tourner (onglet « Roue » de l'espace admin).
// Le téléphone administrateur n'envoie rien (ses tests ne comptent pas).
import { api } from './api';
import { identiteStore } from './identite';

export type EtapeRoue = 'vue' | 'ouverte' | 'tournee';

const cle = (e: EtapeRoue) => `team-ulysse-roue-${e}`;
const enCours = new Set<EtapeRoue>();

export async function noterRoue(etape: EtapeRoue, gain?: string): Promise<void> {
  const { identite, codeAdmin } = identiteStore.get();
  if (codeAdmin || !identite?.jeton || !identite.synchro || enCours.has(etape)) return;
  try {
    if (localStorage.getItem(cle(etape))) return;
    enCours.add(etape);
    await api.noterRoue(identite.jeton, etape, gain);
    localStorage.setItem(cle(etape), '1');
  } catch {
    /* réessayé à la prochaine ouverture */
  } finally {
    enCours.delete(etape);
  }
}
