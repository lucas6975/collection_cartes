import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { Rarity } from '../../domain/types';
import { inclinaisonStore, useInclinaison } from '../../data/inclinaison';
import { cx } from '../ui/primitives';

const AVEC_HOLO: Partial<Record<Rarity, true>> = { rare: true, epique: true, legendaire: true };

/** Calque holographique d'une carte rare, épique ou légendaire (visible quand on bouge). */
export function Holo({ rarete }: { rarete: Rarity }) {
  if (!AVEC_HOLO[rarete]) return null;
  return (
    <div className={`holo holo-${rarete}`} aria-hidden>
      <i className="bande" />
      {rarete !== 'rare' && <i className="paillettes" />}
      <i className="eclat" />
    </div>
  );
}

/** Sur iPhone : bouton pour autoriser les mouvements, affiché tant que l'effet n'est pas actif. */
export function BoutonBrillant({ className, sombre }: { className?: string; sombre?: boolean }) {
  const actif = useInclinaison();
  const [refuse, setRefuse] = useState(false);
  if (actif || refuse || !inclinaisonStore.besoinAutorisation()) return null;
  return (
    <button
      type="button"
      onClick={async () => setRefuse(!(await inclinaisonStore.autoriser()))}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold',
        sombre
          ? 'bg-white/15 text-white hover:bg-white/25'
          : 'bg-gradient-to-r from-[#FFE58A] via-[#FFB8CF] to-[#B8F0FF] text-navy-950 shadow-sm',
        className,
      )}
    >
      <Sparkles size={15} /> Activer les cartes brillantes
    </button>
  );
}
