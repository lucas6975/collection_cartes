import { Lock } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { CSSProperties, PointerEvent } from 'react';
import { CATEGORY_BY_ID, RARITY_BY_ID } from '../../content/categories';
import type { Card, Rarity } from '../../domain/types';
import { Icon } from '../ui/Icon';
import { cx } from '../ui/primitives';

export const TOTAL_PAD = 3;

/** Traitement graphique propre à chaque rareté. */
export const RARITY_STYLE: Record<
  Rarity,
  { frame: string; accent: string; label: string; glow?: string; shimmer?: boolean }
> = {
  commune: {
    frame: 'linear-gradient(160deg, #E3E8EF, #CBD3DE)',
    accent: '#64748B',
    label: 'text-muted',
  },
  'peu-commune': {
    frame: 'linear-gradient(160deg, #5B8FD0, #2563A6 45%, #153E75)',
    accent: '#2563A6',
    label: 'text-blue',
  },
  rare: {
    frame: 'linear-gradient(135deg, #8C97A8, #F4F6F9 30%, #A9B3C2 50%, #EEF1F5 70%, #7E8A9C)',
    accent: '#6B7A90',
    label: 'text-slate-500',
    shimmer: true,
  },
  epique: {
    frame: 'linear-gradient(135deg, #A87A0C, #FFD966 28%, #C99A17 52%, #FFE9A3 72%, #9E7208)',
    accent: '#C99A17',
    label: 'text-sun-dark',
    glow: 'rgba(245,197,66,0.35)',
    shimmer: true,
  },
  legendaire: {
    frame:
      'conic-gradient(from 210deg, #F5C542, #FFF1C2, #2563A6, #153E75, #F5C542, #FFE9A3, #2563A6, #F5C542)',
    accent: '#F5C542',
    label: 'text-sun-dark',
    glow: 'rgba(245,197,66,0.55)',
    shimmer: true,
  },
};

export function RarityPips({ rarete, className }: { rarete: Rarity; className?: string }) {
  const rang = RARITY_BY_ID[rarete].rang;
  const color = RARITY_STYLE[rarete].accent;
  return (
    <span
      className={cx('inline-flex items-center gap-[3px]', className)}
      aria-label={`Rareté : ${RARITY_BY_ID[rarete].nom}`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="block size-[5px] rotate-45 rounded-[1px]"
          style={{ background: i <= rang ? color : 'rgba(21,62,117,0.15)' }}
        />
      ))}
    </span>
  );
}

/** Illustration de la carte : composition graphique cohérente pour toute la collection. */
export function CardArt({ card, size }: { card: Card; size: 'sm' | 'md' | 'lg' }) {
  const cat = CATEGORY_BY_ID[card.categorie];
  const r = RARITY_BY_ID[card.rarete].rang;
  const iconSize = size === 'sm' ? 30 : size === 'md' ? 52 : 76;
  if (card.image) {
    return (
      <img
        src={card.image}
        alt=""
        className="absolute inset-0 size-full object-cover"
        draggable={false}
      />
    );
  }
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: `linear-gradient(155deg, ${cat.couleur} 0%, ${mix(cat.couleur)} 100%)` }}
    >
      {/* Trame de points */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.2px)',
          backgroundSize: size === 'sm' ? '8px 8px' : '12px 12px',
        }}
      />
      {/* Halo lumineux, plus intense pour les cartes rares */}
      <div
        className="absolute left-1/2 top-1/2 aspect-square w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(255,255,255,${0.12 + r * 0.05}) 0%, transparent 60%)`,
        }}
      />
      {/* Anneaux concentriques */}
      {[0.86, 0.62].map((s, i) => (
        <div
          key={s}
          className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ width: `${s * 100}%`, borderColor: `rgba(255,255,255,${0.1 + i * 0.08})` }}
        />
      ))}
      {/* Bande de signalisation discrète */}
      <div
        className="absolute -bottom-px left-0 right-0 h-[9%] opacity-25"
        style={{
          backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 6px, transparent 6px 12px)',
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="grid place-items-center rounded-full bg-white/12 ring-1 ring-white/30 backdrop-blur-[2px]"
          style={{
            width: iconSize * 1.75,
            height: iconSize * 1.75,
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.45)',
          }}
        >
          <Icon name={card.icone} size={iconSize} strokeWidth={1.5} color="white" />
        </div>
      </div>
    </div>
  );
}

/** Assombrit une couleur vers le bleu marine de la marque. */
function mix(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const t = 0.62;
  const navy = [11, 35, 71];
  return `rgb(${Math.round(r * (1 - t) + navy[0] * t)}, ${Math.round(g * (1 - t) + navy[1] * t)}, ${Math.round(b * (1 - t) + navy[2] * t)})`;
}

export interface GameCardProps {
  card: Card;
  total: number;
  size?: 'sm' | 'md' | 'lg';
  locked?: boolean;
  isNew?: boolean;
  onClick?: () => void;
  tilt?: boolean;
  className?: string;
  layoutId?: string;
  /** Largeur fixe en pixels (sinon dépend de `size`, ou 100 % avec la classe w-full). */
  width?: number;
}

const WIDTH = { sm: 132, md: 208, lg: 300 };

export function GameCard({
  card,
  total,
  size = 'md',
  locked,
  isNew,
  onClick,
  tilt = true,
  className,
  layoutId,
  width,
}: GameCardProps) {
  const style = RARITY_STYLE[card.rarete];
  const cat = CATEGORY_BY_ID[card.categorie];
  const numero = `${String(card.numero).padStart(3, '0')}/${String(total).padStart(3, '0')}`;

  // Inclinaison 3D légère au survol
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 200, damping: 18 });
  const sheenX = useTransform(mx, [0, 1], ['0%', '100%']);
  const sheen = useTransform(
    sheenX,
    (x) => `radial-gradient(circle at ${x} 30%, rgba(255,255,255,0.35), transparent 55%)`,
  );

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (!tilt || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  const fluid = className?.includes('w-full');
  const wrapStyle: CSSProperties = fluid ? {} : { width: width ?? WIDTH[size] };
  const radius = size === 'sm' ? 12 : size === 'md' ? 16 : 22;

  if (locked) {
    return (
      <motion.button
        type="button"
        layoutId={layoutId}
        onClick={onClick}
        className={cx('group relative block aspect-[5/7] text-left', className)}
        style={wrapStyle}
        whileHover={{ y: -3 }}
        aria-label={`Carte n° ${card.numero} non obtenue`}
      >
        <div
          className="absolute inset-0 overflow-hidden border-2 border-dashed border-navy/15 bg-[#EEF2F7]"
          style={{ borderRadius: radius }}
        >
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, rgba(21,62,117,0.04) 0 8px, transparent 8px 16px)',
            }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-2 text-navy/25">
              <Icon name={card.icone} size={size === 'sm' ? 30 : 48} strokeWidth={1.25} />
            </div>
          </div>
          <div className="absolute left-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-white/80 text-navy/40">
            <Lock size={13} />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="font-display text-[11px] font-bold tracking-wider text-navy/35">
              N° {String(card.numero).padStart(3, '0')}
            </p>
            {size !== 'sm' && (
              <p className="mt-0.5 truncate text-xs font-medium text-navy/35">{cat.court}</p>
            )}
          </div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cx('group relative block aspect-[5/7] text-left [perspective:900px]', className)}
      style={wrapStyle}
      whileHover={tilt ? { y: -4 } : undefined}
      aria-label={`${card.nom}, carte ${RARITY_BY_ID[card.rarete].nom.toLowerCase()}`}
    >
      <motion.div
        className="relative size-full transition-shadow duration-300"
        style={{
          rotateX: tilt ? rx : 0,
          rotateY: tilt ? ry : 0,
          transformStyle: 'preserve-3d',
          borderRadius: radius,
          padding: TOTAL_PAD,
          background: style.frame,
          boxShadow: `0 1px 2px rgba(16,47,90,0.08), 0 12px 28px -14px rgba(16,47,90,0.45)${style.glow ? `, 0 0 26px -4px ${style.glow}` : ''}`,
        }}
      >
        {card.rarete === 'legendaire' && (
          <div
            className="pointer-events-none absolute -inset-[3px] animate-glow rounded-[inherit] opacity-70 blur-md"
            style={{ background: style.frame, zIndex: -1 }}
          />
        )}
        <div
          className="relative flex size-full flex-col overflow-hidden bg-white"
          style={{ borderRadius: radius - 3 }}
        >
          {/* En-tête : famille et numéro */}
          <div
            className={cx(
              'flex items-center justify-between',
              size === 'sm' ? 'px-2 py-1.5' : 'px-3 py-2',
            )}
          >
            <span
              className="inline-flex items-center gap-1 font-semibold"
              style={{ color: cat.couleur, fontSize: size === 'sm' ? 9 : 11 }}
            >
              <Icon name={cat.icone} size={size === 'sm' ? 10 : 12} strokeWidth={2.4} />
              {cat.court}
            </span>
            <span
              className="font-display font-bold tracking-wide text-navy/40"
              style={{ fontSize: size === 'sm' ? 8 : 10 }}
            >
              {size === 'sm' ? `N° ${String(card.numero).padStart(3, '0')}` : numero}
            </span>
          </div>
          {/* Illustration */}
          <div
            className={cx(
              'relative mx-auto w-[calc(100%-12px)] shrink-0 overflow-hidden',
              size === 'sm' ? 'h-[52%] rounded-lg' : 'h-[50%] rounded-xl',
            )}
          >
            <CardArt card={card} size={size} />
          </div>
          {/* Titre et rareté */}
          <div
            className={cx(
              'flex min-h-0 flex-1 flex-col overflow-hidden',
              size === 'sm'
                ? 'px-2 pb-2 pt-1.5'
                : size === 'md'
                  ? 'px-3 pb-3 pt-2.5'
                  : 'px-4 pb-4 pt-3.5',
            )}
          >
            <h3
              className={cx(
                'font-display font-extrabold leading-tight text-navy-950',
                size === 'sm'
                  ? 'line-clamp-2 text-[11px]'
                  : size === 'md'
                    ? 'text-[15px]'
                    : 'text-xl',
              )}
            >
              {card.nom}
            </h3>
            <div className={cx('flex items-center gap-1.5', size === 'sm' ? 'mt-1' : 'mt-1.5')}>
              <RarityPips rarete={card.rarete} />
              {size !== 'sm' && (
                <span
                  className={cx('text-[10px] font-semibold uppercase tracking-wider', style.label)}
                >
                  {RARITY_BY_ID[card.rarete].nom}
                </span>
              )}
            </div>
            {size !== 'sm' && (
              <p
                className={cx(
                  'mt-2 text-muted',
                  size === 'md'
                    ? 'line-clamp-3 text-[11px] leading-snug'
                    : 'line-clamp-4 text-[13px] leading-relaxed',
                )}
              >
                {card.description}
              </p>
            )}
          </div>
        </div>
        {/* Reflets : brillance qui suit la souris et balayage pour les raretés supérieures */}
        {tilt && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: sheen }}
          />
        )}
        {style.shimmer && (
          <div
            className="pointer-events-none absolute inset-0 animate-shimmer rounded-[inherit] mix-blend-overlay"
            style={{
              backgroundImage:
                'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 48%, transparent 60%)',
              backgroundSize: '250% 100%',
            }}
          />
        )}
      </motion.div>
      {isNew && (
        <span className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-950 shadow-md">
          Nouveau
        </span>
      )}
    </motion.button>
  );
}
