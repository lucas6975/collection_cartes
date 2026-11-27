// Classement des collectionneurs (visible par tous les inscrits).
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { api } from './api';
import { useIdentite } from './identite';

export interface LigneClassement {
  cle: string;
  prenom: string;
  nom: string;
  cartes: number;
  legendaires: number;
  echanges: number;
  moi: boolean;
}

export type Tri = 'cartes' | 'echanges';

/** Avatar : initiales, ou « ? » pour un joueur anonyme. */
export const avatarDe = (l: LigneClassement) =>
  l.prenom === 'Joueur' && l.nom === 'anonyme'
    ? { id: l.cle, prenom: '?', nom: ' ' }
    : { id: l.cle, prenom: l.prenom, nom: l.nom };

/** Lignes triées avec leur rang (ex aequo : même rang). */
export function trier(lignes: LigneClassement[], tri: Tri) {
  const l = [...lignes].sort((a, b) =>
    tri === 'cartes'
      ? b.cartes - a.cartes || b.legendaires - a.legendaires
      : b.echanges - a.echanges || b.cartes - a.cartes,
  );
  const cle = (x: LigneClassement) =>
    tri === 'cartes' ? `${x.cartes}-${x.legendaires}` : `${x.echanges}`;
  return l.map((x, i) => ({
    ...x,
    rang: i > 0 && cle(l[i - 1]) === cle(x) ? l.findIndex((y) => cle(y) === cle(x)) + 1 : i + 1,
  }));
}

/** Cartes à gagner pour entrer dans le top N (0 si déjà dedans). */
export function pourTop(lignes: LigneClassement[], n = 10): number {
  const t = trier(lignes, 'cartes');
  const moi = t.find((x) => x.moi);
  if (!moi || moi.rang <= n || t.length < n) return 0;
  return Math.max(
    1,
    t[n - 1].cartes - moi.cartes + (t[n - 1].legendaires >= moi.legendaires ? 1 : 0),
  );
}

// ── « Masquer mon nom » (réglage du téléphone, envoyé avec les packs) ──
const CLE = 'team-ulysse-classement-masque';
const abonnes = new Set<() => void>();
export const masqueStore = {
  get(): boolean {
    try {
      return localStorage.getItem(CLE) === '1';
    } catch {
      return false;
    }
  },
  set(v: boolean) {
    try {
      localStorage.setItem(CLE, v ? '1' : '0');
    } catch {
      /* rien */
    }
    abonnes.forEach((f) => f());
  },
  subscribe(f: () => void) {
    abonnes.add(f);
    return () => abonnes.delete(f);
  },
};
export const useMasque = () => useSyncExternalStore(masqueStore.subscribe, masqueStore.get);

/** Classement actualisé toutes les minutes. */
export function useClassement() {
  const { identite, codeAdmin } = useIdentite();
  const jeton = identite?.synchro ? (identite.jeton ?? null) : null;
  const [lignes, setLignes] = useState<LigneClassement[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const charger = useCallback(async () => {
    if (!jeton && !codeAdmin) return;
    try {
      setLignes(await api.classement(jeton, codeAdmin));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Classement indisponible');
    }
  }, [jeton, codeAdmin]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
    const t = setInterval(() => void charger(), 60_000);
    return () => clearInterval(t);
  }, [charger]);
  return { lignes, erreur, recharger: charger };
}

// ── Montées et descentes (comme un classement de foot) ──
// Le téléphone garde les places de la veille : on compare la place du jour à celle du dernier jour
// où le classement a été vu. Une flèche verte si on a gagné des places, rouge si on en a perdu.

export interface Photo {
  jour: string;
  rangs: Record<string, number>;
}
export interface StockRangs {
  /** Places de référence (un jour précédent). */
  ref: Photo | null;
  /** Dernières places vues aujourd'hui. */
  dernier: Photo | null;
}

/** Met à jour le stock : au premier passage d'un nouveau jour, les places d'hier deviennent la référence. */
export function majRangs(
  stock: StockRangs,
  jour: string,
  rangs: Record<string, number>,
): StockRangs {
  if (!stock.dernier) return { ref: stock.ref, dernier: { jour, rangs } };
  if (stock.dernier.jour < jour) return { ref: stock.dernier, dernier: { jour, rangs } };
  return { ref: stock.ref, dernier: { jour, rangs } };
}

/** Places gagnées (positif) ou perdues (négatif) depuis la référence ; null si nouveau ou inconnu. */
export function evolution(ref: Photo | null, cle: string, rang: number): number | null {
  if (!ref) return 0;
  const avant = ref.rangs[cle];
  return avant === undefined ? null : avant - rang;
}

const cleRangs = (tri: Tri) => `team-ulysse-classement-rangs-${tri}`;
export function lireRangs(tri: Tri): StockRangs {
  try {
    const v = JSON.parse(localStorage.getItem(cleRangs(tri)) ?? 'null') as StockRangs | null;
    return v && typeof v === 'object' ? v : { ref: null, dernier: null };
  } catch {
    return { ref: null, dernier: null };
  }
}
export function ecrireRangs(tri: Tri, stock: StockRangs) {
  try {
    localStorage.setItem(cleRangs(tri), JSON.stringify(stock));
  } catch {
    /* rien */
  }
}
