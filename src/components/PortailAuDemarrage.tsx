// À l'ouverture de l'appli, ceux qui ont l'Espace Sécurité (pour l'instant Lucas, Vincent et
// l'administrateur) arrivent sur le portail pour choisir leur monde. Les autres : rien ne change.
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAccesSecurite } from '../data/accesSecurite';

let decide = false;

export function PortailAuDemarrage() {
  const acces = useAccesSecurite();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (decide || acces === null) return;
    decide = true;
    if (acces && pathname === '/') navigate('/portail', { replace: true });
  }, [acces, pathname, navigate]);
  return null;
}
