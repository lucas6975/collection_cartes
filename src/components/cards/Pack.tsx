import { motion } from 'motion/react';
import { cx } from '../ui/primitives';
import { HAZARD, MASCOTTE_URL } from './CardBack';

/** Visuel du pack : bandes de signalisation, mascotte Ulysse. */
export function PackArt({
  titre = 'Pack du jour',
  sousTitre = '5 cartes sécurité',
  className,
  opened,
}: {
  titre?: string;
  sousTitre?: string;
  className?: string;
  /** Pack déjà ouvert : rendu atténué. */
  opened?: boolean;
}) {
  return (
    <div
      className={cx(
        'relative aspect-[5/7] w-full overflow-hidden rounded-[26px] p-[18px] shadow-lift',
        className,
      )}
      style={{ background: HAZARD }}
    >
      <div className="relative flex size-full flex-col items-center overflow-hidden rounded-[16px] bg-[#15171C] px-4 pb-6 pt-4">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(#fff 1px, transparent 1.2px)',
            backgroundSize: '14px 14px',
          }}
        />
        <div
          className="absolute left-1/2 top-[36%] aspect-square w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,197,66,0.28), transparent 65%)' }}
        />
        <img
          src={MASCOTTE_URL}
          alt="Ulysse, la mascotte"
          draggable={false}
          className={cx(
            'relative h-[58%] w-auto object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.6)]',
            opened && 'opacity-50 grayscale',
          )}
        />
        <p className="relative mt-auto text-center font-display text-[34px] font-extrabold uppercase leading-[0.95] tracking-tight text-sun sm:text-[40px]">
          {titre}
        </p>
        <p className="relative mt-2 text-sm font-semibold text-white/90">{sousTitre}</p>
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
  );
}

/** Pack qui flotte doucement, invitation à l'ouvrir. */
export function FloatingPack({ disabled, onClick }: { disabled?: boolean; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={disabled ? 'Pack du jour déjà ouvert' : 'Ouvrir le pack du jour'}
      className="relative mx-auto block w-[230px] sm:w-[260px]"
      initial={{ rotate: -4 }}
      animate={disabled ? { rotate: -3, y: 0 } : { rotate: [-4, -1.5, -4], y: [0, -8, 0] }}
      transition={disabled ? undefined : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={disabled ? undefined : { scale: 1.03, rotate: 0 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
    >
      <PackArt opened={disabled} />
    </motion.button>
  );
}
