import { Crown, Info, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Avatar, PageHeader, cx } from '../components/ui/primitives';
import { classement, classementEquipes, type Row } from '../data/selectors';
import { useSession } from '../data/store';

type Tab = 'general' | 'semaine' | 'equipes';
const TABS: { id: Tab; label: string }[] = [
  { id: 'semaine', label: 'Cette semaine' },
  { id: 'general', label: 'Général' },
  { id: 'equipes', label: 'Par service' },
];

const PODIUM = [
  { place: 2, h: 'h-24', bg: 'linear-gradient(180deg, #E6EBF1, #C9D2DD)' },
  { place: 1, h: 'h-32', bg: 'linear-gradient(180deg, #FFE38A, #F5C542)' },
  { place: 3, h: 'h-20', bg: 'linear-gradient(180deg, #F3DCC4, #D9AE84)' },
];

export function Leaderboard() {
  const { db, user } = useSession();
  const [tab, setTab] = useState<Tab>('semaine');
  if (!user) return null;
  const rows = tab === 'equipes' ? [] : classement(db, tab);
  const teams = classementEquipes(db);
  const me = rows.findIndex((r) => r.user.id === user.id);
  const unit = tab === 'semaine' ? 'XP cette semaine' : 'XP';

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Classement"
        title="Ensemble, plus vigilants"
        description="Une compétition amicale : le classement hebdomadaire repart à zéro chaque lundi pour laisser sa chance à chacun."
      />

      <div
        className="mb-6 inline-flex rounded-2xl border border-line bg-white p-1 shadow-soft"
        role="tablist"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              'relative h-10 rounded-xl px-4 text-sm font-semibold transition-colors',
              tab === t.id ? 'text-white' : 'text-muted hover:text-navy',
            )}
          >
            {tab === t.id && (
              <motion.span
                layoutId="lb-tab"
                className="absolute inset-0 rounded-xl bg-navy"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'equipes' ? (
        <div className="panel divide-y divide-line">
          {teams.map((t, i) => {
            const mine = t.service === user.service;
            return (
              <motion.div
                key={t.service}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cx('flex items-center gap-4 px-5 py-4', mine && 'bg-sun/10')}
              >
                <span
                  className={cx(
                    'w-7 text-center font-display text-lg font-extrabold',
                    i === 0 ? 'text-sun-dark' : 'text-muted',
                  )}
                >
                  {i + 1}
                </span>
                <span className="grid size-11 place-items-center rounded-xl bg-blue-light text-navy">
                  <Users size={20} />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-navy-950">
                    {t.service}{' '}
                    {mine && (
                      <span className="ml-1 text-xs font-medium text-muted">(ton service)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {t.membres} membres · {t.cartes} cartes collectées
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-extrabold text-navy">{t.moyenne}</p>
                  <p className="text-[11px] text-muted">XP moyen / membre</p>
                </div>
              </motion.div>
            );
          })}
          <p className="flex items-start gap-2 px-5 py-4 text-xs text-muted">
            <Info size={14} className="mt-0.5 shrink-0" /> Le score d’un service est la moyenne de
            ses membres, pour ne pas avantager les plus grandes équipes.
          </p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="mb-6 grid grid-cols-3 items-end gap-2 sm:gap-4">
            {PODIUM.map((p) => {
              const r = rows[p.place - 1];
              if (!r) return <div key={p.place} />;
              return (
                <motion.div
                  key={`${tab}-${p.place}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1 * (3 - p.place),
                    type: 'spring',
                    stiffness: 160,
                    damping: 18,
                  }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    {p.place === 1 && (
                      <Crown
                        size={22}
                        className="absolute -top-6 left-1/2 -translate-x-1/2 fill-sun text-sun-dark"
                      />
                    )}
                    <Avatar
                      user={r.user}
                      size={p.place === 1 ? 64 : 52}
                      ring={r.user.id === user.id}
                    />
                  </div>
                  <p className="mt-2 w-full truncate text-center text-sm font-semibold text-navy-950">
                    {r.user.prenom}
                  </p>
                  <p className="text-xs text-muted">{r.xp} XP</p>
                  <div
                    className={cx(
                      'mt-3 grid w-full place-items-center rounded-t-2xl font-display text-2xl font-extrabold text-navy-950/80',
                      p.h,
                    )}
                    style={{ background: p.bg }}
                  >
                    {p.place}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <ol className="panel divide-y divide-line">
            {rows.slice(3).map((r, i) => (
              <RowItem
                key={r.user.id}
                r={r}
                rank={i + 4}
                me={r.user.id === user.id}
                unit={unit}
                delay={i * 0.03}
              />
            ))}
          </ol>

          {me >= 0 && (
            <div className="sticky bottom-20 mt-4 md:bottom-6">
              <div className="flex items-center gap-4 rounded-2xl bg-navy px-5 py-4 text-white shadow-lift">
                <span className="font-display text-xl font-extrabold text-sun">
                  {me + 1}
                  <sup className="text-xs">{me === 0 ? 'er' : 'e'}</sup>
                </span>
                <Avatar user={user} size={40} />
                <div className="flex-1">
                  <p className="font-semibold">Ta position</p>
                  <p className="text-xs text-white/70">
                    {me === 0
                      ? 'Tu mènes la course, bravo !'
                      : `${rows[me - 1].xp - rows[me].xp + 1} XP pour gagner une place`}
                  </p>
                </div>
                <p className="font-display text-lg font-extrabold">{rows[me].xp} XP</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RowItem({
  r,
  rank,
  me,
  unit,
  delay,
}: {
  r: Row;
  rank: number;
  me: boolean;
  unit: string;
  delay: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className={cx('flex items-center gap-4 px-4 py-3 sm:px-5', me && 'bg-sun/15')}
    >
      <span className="w-7 text-center font-display font-bold text-muted">{rank}</span>
      <Avatar user={r.user} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-navy-950">
          {r.user.prenom} {r.user.nom}{' '}
          {me && <span className="text-xs font-medium text-muted">(toi)</span>}
        </p>
        <p className="text-xs text-muted">
          Niveau {r.niveau} · {r.user.service} · {r.cartes} cartes
        </p>
      </div>
      <div className="text-right">
        <p className="font-display font-extrabold text-navy">{r.xp}</p>
        <p className="text-[11px] text-muted">{unit}</p>
      </div>
    </motion.li>
  );
}
