// Ulysse qui félicite : un message à la fois, affiché par le composant <Bravo />.

export interface MessageBravo {
  id: number;
  titre: string;
  texte?: string;
}

let courant: MessageBravo | null = null;
let id = 0;
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());

export const bravoStore = {
  get: () => courant,
  subscribe(f: () => void) {
    abonnes.add(f);
    return () => abonnes.delete(f);
  },
  montrer(titre: string, texte?: string) {
    courant = { id: ++id, titre, texte };
    prevenir();
  },
  fermer() {
    courant = null;
    prevenir();
  },
};

/** Petite vibration au toucher (Android ; ignorée là où ce n'est pas possible). */
export function vibrer(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* pas de vibration disponible */
  }
}
