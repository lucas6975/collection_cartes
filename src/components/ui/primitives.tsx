import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { User } from '../../domain/types';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ───────────── Bouton ─────────────

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-900 shadow-sm',
  accent: 'bg-sun text-navy-950 hover:bg-sun-light shadow-sm shadow-sun/30',
  secondary: 'bg-white text-navy border border-line hover:border-blue/40 hover:bg-blue-light/50',
  ghost: 'text-navy hover:bg-blue-light',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-11 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ───────────── Progression ─────────────

export function ProgressBar({
  value,
  className,
  tone = 'blue',
  height = 8,
  delay = 0,
}: {
  value: number;
  className?: string;
  tone?: 'blue' | 'sun' | 'success' | string;
  height?: number;
  delay?: number;
}) {
  const color =
    tone === 'blue'
      ? '#2563A6'
      : tone === 'sun'
        ? '#F5C542'
        : tone === 'success'
          ? '#22A06B'
          : tone;
  return (
    <div
      className={cx('w-full overflow-hidden rounded-full bg-navy/[0.07]', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      />
    </div>
  );
}

export function Ring({
  value,
  size = 72,
  stroke = 7,
  color = '#2563A6',
  track = 'rgba(21,62,117,0.08)',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(1, value))) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/** Nombre qui s'anime jusqu'à sa valeur lorsqu'il devient visible. */
export function CountUp({
  value,
  duration = 0.9,
  suffix = '',
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);
  return (
    <span ref={ref} className="tabular-nums">
      {(reduce ? value : display).toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
}

// ───────────── Avatar ─────────────

const AVATAR_TONES = [
  '#153E75',
  '#2563A6',
  '#13896F',
  '#6A4FB3',
  '#B7791F',
  '#D9542B',
  '#0E7490',
  '#475569',
];

export function Avatar({
  user,
  size = 40,
  ring = false,
}: {
  user: Pick<User, 'id' | 'prenom' | 'nom'>;
  size?: number;
  ring?: boolean;
}) {
  const hash = [...user.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const bg = AVATAR_TONES[hash % AVATAR_TONES.length];
  return (
    <div
      className={cx(
        'grid shrink-0 place-items-center rounded-full font-display font-bold text-white',
        ring && 'ring-2 ring-sun ring-offset-2 ring-offset-white',
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        fontSize: size * 0.38,
      }}
      aria-hidden
    >
      {user.prenom[0]}
      {user.nom[0]}
    </div>
  );
}

// ───────────── Divers ─────────────

export function Chip({
  active,
  children,
  onClick,
  color,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
        active
          ? 'border-navy bg-navy text-white'
          : 'border-line bg-white text-ink/80 hover:border-blue/40',
      )}
      style={active && color ? { background: color, borderColor: color } : undefined}
    >
      {children}
    </button>
  );
}

export function SectionTitle({
  title,
  action,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-navy-950">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold text-navy-950 md:text-[32px] md:leading-tight">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-muted">{description}</p>}
      </div>
      {children}
    </header>
  );
}

/** Apparition progressive des éléments d'une page. */
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={fadeUp}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
