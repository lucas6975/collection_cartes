// Thème de Noël de l'appli (« Rouge Noël ») : actif pour tout le monde
// du 1er décembre au 3 janvier inclus, puis retour automatique au thème habituel.
import { useState } from 'react';

export const DEBUT_NOEL = '2026-12-01';
/** Premier jour où l'appli revient au thème habituel. */
export const FIN_NOEL = '2027-01-04';

const jourLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function periodeNoel(now: Date): boolean {
  const j = jourLocal(now);
  return j >= DEBUT_NOEL && j < FIN_NOEL;
}

/** Vrai pendant la période de Noël. */
export function useNoel(): boolean {
  const [noel] = useState(() => periodeNoel(new Date()));
  return noel;
}
