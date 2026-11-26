// Graphiques de l'EPS : courbe de Bradley (avec l'étoile du résultat), camemberts, badges.
import { motion } from 'motion/react';
import {
  LISTE_NIVEAUX,
  NIVEAUX,
  niveauGlobal,
  positionBradley,
  type Niveau,
} from '../../domain/eps';
import { cx } from '../ui/primitives';

const virgule = (n: number, d = 2) => n.toFixed(d).replace('.', ',');

/** Pastille colorée d'un niveau (la couleur n'est jamais seule : le nom est écrit). */
const COURT: Record<Niveau, string> = { 1: 'Réactif', 2: 'Dépendant', 3: 'Indép.', 4: 'Interdép.' };

export function BadgeNiveau({
  niveau,
  grand,
  court,
}: {
  niveau: Niveau | null;
  grand?: boolean;
  /** Nom abrégé, pour les tableaux. */
  court?: boolean;
}) {
  if (!niveau)
    return (
      <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-bold text-muted">—</span>
    );
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full font-extrabold text-white',
        grand
          ? 'px-4 py-1.5 text-base'
          : court
            ? 'px-2 py-0.5 text-[11px]'
            : 'px-2.5 py-0.5 text-xs',
      )}
      style={{ background: NIVEAUX[niveau].couleur }}
      title={NIVEAUX[niveau].nom}
    >
      {court ? COURT[niveau] : NIVEAUX[niveau].nom}
    </span>
  );
}

// ───────────── Courbe de Bradley ─────────────

const X0 = 34;
const X1 = 336;
const HAUT = 26;
const BAS = 150;
const curveY = (x: number) => {
  const t = (x - X0) / (X1 - X0);
  const k = 2.4;
  return HAUT + (BAS - HAUT) * ((1 - Math.exp(-k * t)) / (1 - Math.exp(-k)));
};
const CHEMIN = Array.from({ length: 41 }, (_, i) => {
  const x = X0 + ((X1 - X0) * i) / 40;
  return `${i ? 'L' : 'M'}${x.toFixed(1)} ${curveY(x).toFixed(1)}`;
}).join(' ');

const MOTS: Record<Niveau, string> = {
  1: 'Instinct',
  2: 'Surveillance',
  3: 'Personnel',
  4: 'Équipe',
};

export interface Repere {
  score: number;
  libelle: string;
  /** Repère secondaire (années passées) : plus discret. */
  discret?: boolean;
}

/** Étoile à 5 branches centrée sur (cx, cy). */
const etoile = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

export function CourbeBradley({ reperes = [] }: { reperes?: Repere[] }) {
  const largeur = (X1 - X0) / 4;
  return (
    <figure className="w-full">
      <svg
        viewBox="0 0 350 200"
        className="w-full"
        role="img"
        aria-label={`Courbe de Bradley${reperes
          .map((r) => ` · ${r.libelle} : ${NIVEAUX[niveauGlobal(r.score)].nom}`)
          .join('')}`}
      >
        {LISTE_NIVEAUX.map((n, i) => (
          <g key={n}>
            <rect
              x={X0 + i * largeur}
              y={HAUT - 14}
              width={largeur}
              height={BAS - HAUT + 26}
              fill={NIVEAUX[n].couleur}
              opacity={0.09}
            />
            <text
              x={X0 + i * largeur + largeur / 2}
              y={184}
              textAnchor="middle"
              fontSize="9"
              fontWeight="800"
              fill="#15233F"
            >
              {NIVEAUX[n].nom}
            </text>
            <rect
              x={X0 + i * largeur + 6}
              y={190}
              width={largeur - 12}
              height={4}
              rx={2}
              fill={NIVEAUX[n].couleur}
            />
            <text
              x={X0 + i * largeur + largeur / 2}
              y={curveY(X0 + i * largeur + largeur / 2) - 9}
              textAnchor="middle"
              fontSize="9.5"
              fontStyle="italic"
              fill="#5B6478"
            >
              {MOTS[n]}
            </text>
          </g>
        ))}
        {/* Pont culturel : passage de Dépendant à Indépendant */}
        <line
          x1={X0 + 2 * largeur}
          x2={X0 + 2 * largeur}
          y1={8}
          y2={BAS + 12}
          stroke="#15233F"
          strokeWidth="2.5"
        />
        <text
          x={X0 + 2 * largeur}
          y={6}
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="700"
          fill="#15233F"
        >
          Pont culturel
        </text>
        {/* Axes */}
        <line x1={X0} x2={X0} y1={HAUT - 14} y2={BAS + 12} stroke="#9AA3B5" strokeWidth="1" />
        <line x1={X0} x2={X1 + 6} y1={BAS + 12} y2={BAS + 12} stroke="#9AA3B5" strokeWidth="1" />
        <text
          x={12}
          y={(HAUT + BAS) / 2}
          fontSize="8.5"
          fill="#5B6478"
          textAnchor="middle"
          transform={`rotate(-90 12 ${(HAUT + BAS) / 2})`}
        >
          Taux d’accident
        </text>
        <text x={X1 + 4} y={BAS + 8} fontSize="8.5" fill="#5B6478" textAnchor="end">
          Temps →
        </text>
        <path
          d={CHEMIN}
          fill="none"
          stroke="#E8952B"
          strokeWidth="2.5"
          className="sc-courbe"
          strokeLinecap="round"
        />

        {reperes.map((r) => {
          const x = X0 + positionBradley(r.score) * (X1 - X0);
          const y = curveY(x);
          if (r.discret)
            return (
              <g key={r.libelle}>
                <circle cx={x} cy={y} r={5} fill="#fff" stroke="#5B6478" strokeWidth="2" />
                <text
                  x={x}
                  y={y + 17}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill="#5B6478"
                >
                  {r.libelle}
                </text>
              </g>
            );
          const bulleX = Math.min(Math.max(x, 52), 316);
          return (
            <motion.g
              key={r.libelle}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.2 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              <rect x={bulleX - 44} y={y - 44} width={88} height={20} rx={10} fill="#15233F" />
              <text
                x={bulleX}
                y={y - 30.5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill="#fff"
              >
                {r.libelle} · {virgule(r.score)}
              </text>
              <polygon
                points={etoile(x, y, 13)}
                fill="#F5C542"
                stroke="#15233F"
                strokeWidth="2"
                strokeLinejoin="round"
                className="sc-etoile"
              />
            </motion.g>
          );
        })}
      </svg>
    </figure>
  );
}

// ───────────── Camembert (anneau) ─────────────

const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`;
};

/** Répartition des 4 niveaux. `compte` : nombre d'EPS par niveau. */
export function Camembert({
  titre,
  compte,
  petit,
}: {
  titre: string;
  compte: Record<Niveau, number>;
  petit?: boolean;
}) {
  const total = LISTE_NIVEAUX.reduce((s, n) => s + compte[n], 0);
  const r = 40;
  const presents = LISTE_NIVEAUX.filter((n) => compte[n] > 0);
  const segments = presents.map((n, i) => {
    const avant = presents.slice(0, i).reduce((s, k) => s + compte[k], 0);
    const part = compte[n] / total;
    const a0 = -Math.PI / 2 + (avant / total) * Math.PI * 2;
    return { n, a0, a1: a0 + part * Math.PI * 2, part };
  });
  const majoritaire = total
    ? LISTE_NIVEAUX.reduce((a, b) => (compte[b] > compte[a] ? b : a))
    : null;

  return (
    <div className={cx('panel', petit ? 'p-3' : 'p-4')}>
      <p
        className={cx('font-display font-extrabold text-navy-950', petit ? 'text-sm' : 'text-base')}
      >
        {titre}
      </p>
      {!total ? (
        <p className="mt-2 text-xs text-muted">Pas encore de réponse détaillée.</p>
      ) : (
        <div className={cx('mt-2 flex items-center', petit ? 'flex-col gap-2' : 'gap-4')}>
          <svg
            viewBox="0 0 100 100"
            className={petit ? 'w-24' : 'w-32 shrink-0'}
            role="img"
            aria-label={titre}
          >
            {segments.length === 1 ? (
              <circle
                cx={50}
                cy={50}
                r={r}
                fill="none"
                stroke={NIVEAUX[segments[0].n].couleur}
                strokeWidth={16}
              />
            ) : (
              segments.map((s) => (
                <path
                  key={s.n}
                  d={arc(50, 50, r, s.a0 + 0.025, s.a1 - 0.025)}
                  fill="none"
                  stroke={NIVEAUX[s.n].couleur}
                  strokeWidth={16}
                >
                  <title>
                    {NIVEAUX[s.n].nom} : {compte[s.n]} ({Math.round(s.part * 100)} %)
                  </title>
                </path>
              ))
            )}
            <text x={50} y={48} textAnchor="middle" fontSize="15" fontWeight="800" fill="#15233F">
              {total}
            </text>
            <text x={50} y={61} textAnchor="middle" fontSize="8" fill="#5B6478">
              EPS
            </text>
          </svg>
          <ul className={cx('w-full space-y-1', petit ? 'text-[11px]' : 'text-sm')}>
            {LISTE_NIVEAUX.map((n) => (
              <li key={n} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: NIVEAUX[n].couleur }}
                />
                <span
                  className={cx(
                    'flex-1 truncate',
                    n === majoritaire ? 'font-bold text-navy-950' : 'text-muted',
                  )}
                >
                  {NIVEAUX[n].nom}
                </span>
                <b className="text-navy-950 tabular-nums">
                  {Math.round((compte[n] / total) * 100)} %
                </b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Barre des 4 niveaux avec un curseur à la position du score (pendant le questionnaire). */
export function JaugeBradley({ score }: { score: number | null }) {
  return (
    <div className="relative">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {LISTE_NIVEAUX.map((n) => (
          <span
            key={n}
            className="flex-1"
            style={{ background: NIVEAUX[n].couleur, opacity: 0.85 }}
          />
        ))}
      </div>
      {score !== null && (
        <motion.span
          className="absolute -top-1.5 grid size-6 -translate-x-1/2 place-items-center rounded-full border-2 border-navy-950 bg-sun text-[11px] shadow"
          animate={{ left: `${positionBradley(score) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          ★
        </motion.span>
      )}
    </div>
  );
}
