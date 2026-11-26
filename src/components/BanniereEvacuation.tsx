// Bandeau rouge en haut de l'appli pendant une évacuation : un toucher pour se déclarer présent
// (prénom et nom déjà connus). Disparaît une fois déclaré, ou à la fin de l'évacuation.
import { ChevronRight, ShieldAlert } from 'lucide-react';
import { dejaPresent, useEvacuation } from '../data/evacuation';

export function BanniereEvacuation() {
  const etat = useEvacuation();
  if (!etat?.active || dejaPresent(etat.id)) return null;
  return (
    <a
      href="#/rassemblement"
      className="flex items-center gap-3 bg-[#DC2626] px-4 py-3 text-white shadow-lift"
    >
      <ShieldAlert size={26} className="shrink-0 animate-pulse" />
      <span className="min-w-0 flex-1 leading-tight">
        <b className="block font-display text-[17px]">Évacuation en cours</b>
        <span className="text-sm text-white/90">Touche ici pour te déclarer présent(e)</span>
      </span>
      <ChevronRight size={22} />
    </a>
  );
}
