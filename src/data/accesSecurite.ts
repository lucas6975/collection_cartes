// Accès à l'Espace Sécurité : l'administrateur, et les destinataires des remontées (Vincent),
// reconnus par leur inscription (supabase/maj-securite-vincent.sql). Les autres ne voient rien.
import { useEffect, useState } from 'react';
import { api } from './api';
import { useIdentite } from './identite';

const CLE = 'team-ulysse-acces-securite';

const lire = (jeton: string): boolean | null => {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) ?? 'null') as {
      jeton: string;
      ok: boolean;
    } | null;
    return v?.jeton === jeton ? v.ok : null;
  } catch {
    return null;
  }
};

/** true : accès ; false : pas d'accès ; null : vérification en cours. */
export function useAccesSecurite(): boolean | null {
  const { identite, codeAdmin } = useIdentite();
  const jeton = identite?.jeton ?? null;
  const [verifie, setVerifie] = useState<{ jeton: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (codeAdmin || !jeton) return;
    let actif = true;
    api
      .accesSecurite(jeton)
      .then((ok) => {
        if (!actif) return;
        setVerifie({ jeton, ok });
        try {
          localStorage.setItem(CLE, JSON.stringify({ jeton, ok }));
        } catch {
          /* stockage indisponible */
        }
      })
      .catch(() => {
        if (actif) setVerifie({ jeton, ok: lire(jeton) ?? false });
      });
    return () => {
      actif = false;
    };
  }, [codeAdmin, jeton]);

  if (codeAdmin) return true;
  if (!jeton) return false;
  if (verifie?.jeton === jeton) return verifie.ok;
  return lire(jeton);
}
