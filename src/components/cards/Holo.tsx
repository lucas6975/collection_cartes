import type { Rarity } from '../../domain/types';

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
