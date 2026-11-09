import type { CSSProperties } from 'react';
import { cx } from '../ui/primitives';

export const MASCOTTE_URL = `${import.meta.env.BASE_URL}mascotte.webp`;

/** Bandes de signalisation noir et jaune. */
export const HAZARD = 'repeating-linear-gradient(135deg, #F5C542 0 14px, #15171C 14px 28px)';

/**
 * Verso commun à toutes les cartes : la mascotte Ulysse sur fond bleu, cadre de signalisation.
 */
export function CardBack({
  size = 'md',
  dimmed,
  label,
  className,
  style,
}: {
  size?: 'sm' | 'md' | 'lg';
  /** Version atténuée, pour les cartes pas encore obtenues. */
  dimmed?: boolean;
  /** Texte affiché en bas (ex. numéro de carte). */
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const radius = size === 'sm' ? 12 : size === 'md' ? 16 : 22;
  const border = size === 'sm' ? 5 : size === 'md' ? 7 : 10;
  return (
    <div
      className={cx('relative size-full overflow-hidden', className)}
      style={{ borderRadius: radius, padding: border, background: HAZARD, ...style }}
    >
      <div
        className="relative flex size-full flex-col items-center overflow-hidden"
        style={{
          borderRadius: radius - border / 2,
          background: 'radial-gradient(circle at 50% 38%, #2563A6 0%, #153E75 45%, #0B2347 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(#fff 1px, transparent 1.2px)',
            backgroundSize: size === 'sm' ? '8px 8px' : '12px 12px',
          }}
        />
        <div
          className="absolute left-1/2 top-[40%] aspect-square w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,197,66,0.35), transparent 65%)' }}
        />
        <img
          src={MASCOTTE_URL}
          alt=""
          draggable={false}
          className={cx(
            'relative mt-[8%] h-[66%] w-auto object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]',
            dimmed && 'opacity-35 grayscale',
          )}
        />
        <p
          className={cx(
            'relative mt-auto font-display font-extrabold uppercase tracking-[0.22em] text-sun',
            dimmed && 'opacity-50',
          )}
          style={{
            fontSize: size === 'sm' ? 9 : size === 'md' ? 12 : 16,
            marginBottom: size === 'sm' ? 8 : 14,
          }}
        >
          {label ?? 'Vigie'}
        </p>
      </div>
    </div>
  );
}
