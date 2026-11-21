import { useNomCartePerso } from '../cards/CartePerso';
import { MASCOTTE_URL } from '../cards/CardBack';
import type { CarteSpecialeDef } from '../../content/speciales';

const ARC = 'conic-gradient(from 210deg, #F5C542, #FF8FB1, #C084FC, #60A5FA, #34D399, #F5C542)';

/** Carte spéciale unique (n° 1/1), au nom de la personne qui la reçoit. Tailles en cqw. */
export function CarteSpeciale({
  carte,
  pour,
}: {
  carte: CarteSpecialeDef;
  /** Nom affiché (aperçu admin) ; sinon celui de la personne qui a la carte. */
  pour?: string;
}) {
  const moi = useNomCartePerso();
  const nom = pour ?? `${moi.prenom} ${moi.nom}`;
  return (
    <div
      className="relative aspect-[5/7] w-full [container-type:inline-size]"
      style={{ borderRadius: '8cqw', padding: '3.6cqw', background: ARC }}
    >
      <div
        className="pointer-events-none absolute -inset-[3px] -z-10 animate-glow rounded-[inherit] opacity-80 blur-md"
        style={{ background: ARC }}
      />
      <div
        className="relative flex size-full flex-col overflow-hidden bg-white text-navy-950"
        style={{ borderRadius: '5.4cqw' }}
      >
        <div
          className="flex items-center justify-between font-display font-extrabold"
          style={{ padding: '3cqw 4cqw 0', fontSize: '4.6cqw' }}
        >
          <span className="text-[#C8283A]">★ ÉDITION UNIQUE</span>
          <span className="text-navy-950/50">1/1</span>
        </div>
        <div
          className="relative mx-[4cqw] mt-[2cqw] flex items-end justify-center overflow-hidden"
          style={{
            height: '42cqw',
            borderRadius: '4cqw',
            background: 'radial-gradient(circle at 50% 40%, #FDE68A, #F5C542 45%, #C8283A)',
          }}
        >
          <img src={MASCOTTE_URL} alt="" className="h-[96%] w-auto" />
          <span className="absolute right-[3cqw] top-[1cqw]" style={{ fontSize: '14cqw' }}>
            {carte.emoji}
          </span>
        </div>
        <p
          className="text-center font-display font-extrabold leading-none"
          style={{ fontSize: '9.5cqw', marginTop: '3cqw' }}
        >
          {carte.titre}
        </p>
        <p
          className="text-center font-semibold text-navy-950/70"
          style={{ fontSize: '4.6cqw', marginTop: '1.4cqw' }}
        >
          {nom}
        </p>
        <div style={{ padding: '2.4cqw 4.5cqw 0', fontSize: '3.9cqw', lineHeight: 1.3 }}>
          <p>
            <b>⚡ Pouvoir :</b> {carte.pouvoir}
          </p>
          <p style={{ marginTop: '1.2cqw' }}>
            <b>😱 Faiblesse :</b> {carte.faiblesse}
          </p>
        </div>
        <p
          className="mt-auto text-center font-display font-extrabold text-white"
          style={{ background: '#153E75', padding: '2cqw', fontSize: '4.2cqw' }}
        >
          Envoyée par {carte.de}
        </p>
      </div>
    </div>
  );
}
