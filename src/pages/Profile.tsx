import {
  Award,
  BookOpen,
  Clapperboard,
  Flame,
  Layers,
  Medal,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Icon } from '../components/ui/Icon';
import {
  Avatar,
  CountUp,
  PageHeader,
  ProgressBar,
  Reveal,
  SectionTitle,
  cx,
} from '../components/ui/primitives';
import { CATEGORIES } from '../content/categories';
import { useSession } from '../data/store';
import {
  ACHIEVEMENTS,
  collectionCategorie,
  maitrise,
  niveauDepuisXp,
  published,
} from '../domain/engine';
import type { ActivityEvent } from '../domain/types';

const EVENT_ICON: Record<ActivityEvent['type'], typeof Award> = {
  quiz: BookOpen,
  parcours: BookOpen,
  revision: RotateCcw,
  quotidien: Flame,
  scenario: Clapperboard,
  carte: Layers,
  succes: Medal,
  niveau: TrendingUp,
};

/** Radar SVG léger de la maîtrise par domaine. */
function Radar({ values }: { values: { label: string; value: number; color: string }[] }) {
  const size = 280;
  const c = size / 2;
  const R = 100;
  const n = values.length;
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r] as const;
  };
  const poly = values.map((v, i) => pt(i, Math.max(0.04, v.value) * R).join(',')).join(' ');
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto w-full max-w-[300px]"
      role="img"
      aria-label="Maîtrise par domaine"
    >
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={values.map((_, i) => pt(i, s * R).join(',')).join(' ')}
          fill="none"
          stroke="#E3E8EF"
          strokeWidth={1}
        />
      ))}
      {values.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#E3E8EF" />;
      })}
      <motion.polygon
        points={poly}
        fill="rgba(37,99,166,0.18)"
        stroke="#2563A6"
        strokeWidth={2}
        strokeLinejoin="round"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ transformOrigin: `${c}px ${c}px` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      {values.map((v, i) => {
        const [x, y] = pt(i, Math.max(0.04, v.value) * R);
        const [lx, ly] = pt(i, R + 24);
        return (
          <g key={v.label}>
            <circle cx={x} cy={y} r={4} fill={v.color} stroke="#fff" strokeWidth={2} />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink/70 text-[11px] font-semibold"
            >
              {v.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Profile() {
  const { user, progress, catalog } = useSession();
  if (!user || !progress) return null;
  const lvl = niveauDepuisXp(progress.xp);
  const total = published(catalog.cards).length;
  const domaines = CATEGORIES.map((c) => ({
    cat: c,
    m: maitrise(catalog, progress, c.id),
    col: collectionCategorie(catalog, progress, c.id),
  }));
  const fort = [...domaines].sort((a, b) => b.m - a.m)[0];
  const faible = [...domaines].sort((a, b) => a.m - b.m)[0];
  const history = [...progress.activity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 14);

  return (
    <div>
      <PageHeader eyebrow="Profil" title="Mon profil" />

      <Reveal>
        <section className="panel overflow-hidden">
          <div
            className="h-24 sm:h-28"
            style={{ background: 'linear-gradient(120deg, #2563A6, #153E75 60%, #0B2347)' }}
          />
          <div className="flex flex-col gap-5 px-5 pb-6 sm:flex-row sm:items-end sm:px-8">
            <div className="-mt-12 rounded-full bg-white p-1.5 sm:-mt-14">
              <Avatar user={user} size={96} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-navy-950">
                {user.prenom} {user.nom}
              </h2>
              <p className="text-sm text-muted">
                {user.service} · {user.equipe}
              </p>
            </div>
            <div className="w-full sm:w-72">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-navy-950">
                  Niveau {lvl.niveau} · {lvl.titre}
                </span>
                <span className="text-muted">
                  {lvl.xpDansNiveau}/{lvl.xpPourSuivant}
                </span>
              </div>
              <ProgressBar value={lvl.progression} tone="sun" height={9} className="mt-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
            {[
              { icon: Sparkles, label: 'Expérience totale', value: progress.xp, suffix: ' XP' },
              {
                icon: Layers,
                label: 'Cartes obtenues',
                value: progress.cards.length,
                suffix: `/${total}`,
              },
              {
                icon: Trophy,
                label: 'Collection',
                value: Math.round((progress.cards.length / total) * 100),
                suffix: ' %',
              },
              {
                icon: Award,
                label: 'Succès',
                value: progress.achievements.length,
                suffix: `/${ACHIEVEMENTS.length}`,
              },
            ].map(({ icon: I, label, value, suffix }, i) => (
              <div
                key={label}
                className={cx(
                  'p-4 sm:p-5',
                  i % 2 === 1 && 'border-l border-line',
                  i >= 2 && 'border-t border-line sm:border-t-0',
                  i === 2 && 'sm:border-l',
                )}
              >
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <I size={14} /> {label}
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold text-navy-950">
                  <CountUp value={value} />
                  <span className="text-sm font-bold text-muted">{suffix}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Maîtrise par domaine */}
        <Reveal delay={0.05}>
          <section className="panel h-full p-5 sm:p-6">
            <SectionTitle
              title="Maîtrise par domaine"
              subtitle="Part des questions dont ta dernière réponse est correcte."
            />
            <Radar
              values={domaines.map((d) => ({
                label: d.cat.court,
                value: d.m,
                color: d.cat.couleur,
              }))}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-success/[0.07] p-4">
                <p className="text-xs font-semibold text-success">Point fort</p>
                <p className="mt-1 font-semibold text-navy-950">{fort.cat.nom}</p>
              </div>
              <div className="rounded-2xl bg-sun/15 p-4">
                <p className="text-xs font-semibold text-sun-dark">À renforcer</p>
                <p className="mt-1 font-semibold text-navy-950">{faible.cat.nom}</p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Progression par catégorie */}
        <Reveal delay={0.1}>
          <section className="panel h-full p-5 sm:p-6">
            <SectionTitle title="Progression par catégorie" />
            <ul className="space-y-5">
              {domaines.map(({ cat, m, col }) => (
                <li key={cat.id} className="flex items-center gap-3">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-xl"
                    style={{ background: cat.fond, color: cat.couleur }}
                  >
                    <Icon name={cat.icone} size={19} />
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-navy-950">{cat.nom}</span>
                      <span className="text-xs text-muted">
                        {col.obtenues}/{col.total} cartes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={m} tone={cat.couleur} height={6} />
                      <span className="w-10 shrink-0 text-right text-xs font-semibold text-navy">
                        {Math.round(m * 100)} %
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      </div>

      {/* Succès */}
      <Reveal delay={0.1}>
        <section className="mt-6">
          <SectionTitle
            title="Succès"
            subtitle={`${progress.achievements.length} débloqués sur ${ACHIEVEMENTS.length}`}
          />
          <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-7">
            {ACHIEVEMENTS.map((a) => {
              const got = progress.achievements.find((x) => x.id === a.id);
              return (
                <div
                  key={a.id}
                  className={cx(
                    'flex w-32 shrink-0 flex-col items-center rounded-2xl border p-4 text-center sm:w-auto',
                    got ? 'border-sun/50 bg-white' : 'border-line bg-white/40 opacity-60',
                  )}
                  title={a.description}
                >
                  <span
                    className={cx(
                      'grid size-12 place-items-center rounded-full',
                      got
                        ? 'bg-gradient-to-br from-sun-light to-sun text-navy-950 shadow-md shadow-sun/30'
                        : 'bg-navy/5 text-navy/30',
                    )}
                  >
                    <Icon name={a.icone} size={22} />
                  </span>
                  <p className="mt-2 text-xs font-bold leading-tight text-navy-950">{a.titre}</p>
                  {got && (
                    <p className="mt-1 text-[10px] text-muted">
                      {new Date(got.at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </Reveal>

      {/* Historique */}
      <section className="mt-6">
        <SectionTitle title="Historique des activités" />
        <div className="panel p-5 sm:p-6">
          {history.length === 0 ? (
            <p className="text-sm text-muted">Aucune activité pour le moment.</p>
          ) : (
            <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[17px] before:top-2 before:w-px before:bg-line">
              {history.map((e) => {
                const I = EVENT_ICON[e.type];
                return (
                  <li key={e.id} className="relative flex items-center gap-3">
                    <span
                      className={cx(
                        'relative z-10 grid size-9 shrink-0 place-items-center rounded-full ring-4 ring-white',
                        e.type === 'carte' || e.type === 'succes' || e.type === 'niveau'
                          ? 'bg-sun/25 text-navy'
                          : 'bg-blue-light text-blue',
                      )}
                    >
                      <I size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy-950">{e.label}</p>
                      <p className="text-xs text-muted">
                        {new Date(e.at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                        })}{' '}
                        à{' '}
                        {new Date(e.at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {e.xp > 0 && (
                      <span className="shrink-0 text-sm font-bold text-navy">+{e.xp} XP</span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
