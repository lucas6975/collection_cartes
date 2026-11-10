import { Star } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../components/ui/primitives';

export const NOEL = {
  rouge: '#C8323A',
  vert: '#1F7A4D',
  kraft: '#C49A62',
  or: '#F5C542',
  nuit: '#0B1F3F',
};

/** Pluie de confettis, à afficher quelques secondes après une réussite. */
export function Confetti({ count = 70 }: { count?: number }) {
  const reduce = useReducedMotion();
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.8 + Math.random() * 1.4,
      rotate: Math.random() * 720 - 360,
      drift: Math.random() * 30 - 15,
      size: 6 + Math.random() * 7,
      color: [NOEL.rouge, NOEL.vert, NOEL.or, '#FFFFFF', '#2563A6'][i % 5],
      round: i % 3 === 0,
    })),
  );
  if (reduce) return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? '50%' : 2,
          }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', x: `${p.drift}vw`, rotate: p.rotate, opacity: [1, 1, 0.8] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>,
    document.body,
  );
}

/** Neige qui tombe doucement, en fond des pages du calendrier. */
export function Neige({ flocons = 36 }: { flocons?: number }) {
  const reduce = useReducedMotion();
  const [items] = useState(() =>
    Array.from({ length: flocons }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 8 + Math.random() * 10,
      delay: -Math.random() * 18,
      opacity: 0.35 + Math.random() * 0.5,
    })),
  );
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((f) => (
        <span
          key={f.id}
          className="absolute -top-4 block rounded-full bg-white"
          style={{
            left: `${f.x}%`,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animation: `neige ${f.duration}s linear ${f.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function Etoiles({
  n,
  size = 18,
  animate = false,
  clair = false,
  className,
}: {
  n: number;
  size?: number;
  animate?: boolean;
  /** Sur fond clair : étoiles vides plus visibles. */
  clair?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx('inline-flex items-center gap-0.5', className)}
      aria-label={`${n} étoile${n > 1 ? 's' : ''} sur 3`}
    >
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          initial={animate ? { scale: 0, rotate: -90 } : false}
          animate={animate ? { scale: 1, rotate: 0 } : undefined}
          transition={{ delay: 0.25 + i * 0.18, type: 'spring', stiffness: 260, damping: 14 }}
        >
          <Star
            size={size}
            className={
              i <= n
                ? 'fill-sun text-sun-dark'
                : clair
                  ? 'fill-navy/5 text-navy/25'
                  : 'fill-white/10 text-white/25'
            }
            strokeWidth={1.6}
          />
        </motion.span>
      ))}
    </span>
  );
}

/** Bandeau de retour après une réponse. */
export function Retour({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cx(
        'rounded-2xl px-4 py-3 text-[15px] font-medium',
        ok ? 'bg-success/12 text-success' : 'bg-danger/10 text-danger',
      )}
      role="status"
    >
      {children}
    </motion.div>
  );
}
