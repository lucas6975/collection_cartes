// Décors du thème de Noël (voir src/data/noel.ts).
import { useReducedMotion } from 'motion/react';
import { useIdentite } from '../../data/identite';
import { cx } from '../ui/primitives';

export const ULYSSE_NOEL_URL = `${import.meta.env.BASE_URL}avent/ulysse-noel.webp`;
export const AVATAR_NOEL_URL = `${import.meta.env.BASE_URL}ulysse-avatar-noel.webp`;

/** Fond rouge du bandeau d'accueil. */
export const FOND_HERO_NOEL = 'linear-gradient(125deg, #C62A38 0%, #931626 55%, #5E0C18 100%)';

const COULEURS = ['#F5C542', '#E0434F', '#4C9BE8', '#3DBE6E'];

/** Guirlande lumineuse accrochée sous la barre du haut. */
export function Guirlande() {
  const reduce = useReducedMotion();
  const n = 14;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-full h-5 overflow-visible"
      aria-hidden
    >
      <svg
        viewBox="0 0 700 20"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-4 w-full"
      >
        <path
          d="M0 2 Q25 16 50 4 T100 4 T150 4 T200 4 T250 4 T300 4 T350 4 T400 4 T450 4 T500 4 T550 4 T600 4 T650 4 T700 2"
          fill="none"
          stroke="#1F6B45"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className="absolute block size-2.5 rounded-full"
          style={{
            left: `${((i + 0.5) / n) * 100}%`,
            top: 7,
            background: COULEURS[i % COULEURS.length],
            boxShadow: `0 0 8px ${COULEURS[i % COULEURS.length]}`,
            animation: reduce ? undefined : `scintille 1.6s ease-in-out ${(i % 4) * 0.4}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/** Le pack du jour emballé comme un cadeau, avec le prénom sur l'étiquette. */
export function PaquetCadeau({
  titre,
  sousTitre,
  opened,
  className,
}: {
  titre: string;
  sousTitre: string;
  opened?: boolean;
  className?: string;
}) {
  const { identite } = useIdentite();
  const papier = 'linear-gradient(135deg, #22774D, #0D3A24)';
  return (
    <div
      className={cx(
        'relative aspect-[5/7] w-full rounded-[26px] shadow-lift',
        opened && 'opacity-60 grayscale',
        className,
      )}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-[26px]"
        style={{ background: papier }}
      >
        {/* Motif du papier */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(#fff 1.4px, transparent 1.6px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Ruban vertical */}
        <div className="absolute inset-y-0 left-1/2 w-[15%] -translate-x-1/2 bg-sun shadow-[0_0_0_2px_rgba(168,116,6,0.35)]" />
        {/* Ruban horizontal, avec le nom du pack */}
        <div className="absolute inset-x-0 top-[58%] flex flex-col items-center justify-center bg-sun py-2.5 shadow-[0_0_0_2px_rgba(168,116,6,0.35)]">
          <p className="text-center font-display text-[22px] font-extrabold uppercase leading-none tracking-tight text-navy-950 sm:text-[26px]">
            {titre}
          </p>
          <p className="mt-1 text-xs font-bold text-navy-950/75">{sousTitre}</p>
        </div>
        {/* Reflet */}
        <div
          className="pointer-events-none absolute inset-0 animate-shimmer"
          style={{
            backgroundImage:
              'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
            backgroundSize: '250% 100%',
          }}
        />
      </div>
      {/* Nœud */}
      <span
        className="absolute left-1/2 top-[-9%] -translate-x-1/2 text-[64px] leading-none drop-shadow-[0_6px_8px_rgba(0,0,0,0.35)] sm:text-[72px]"
        aria-hidden
      >
        🎀
      </span>
      {/* Étiquette */}
      <span className="absolute right-[-6%] top-[24%] rotate-[8deg] rounded-lg bg-white px-2.5 py-1.5 font-display text-[13px] font-extrabold text-navy-950 shadow-[0_6px_12px_rgba(0,0,0,0.25)]">
        Pour {identite?.prenom ?? 'toi'} 🎄
      </span>
    </div>
  );
}
