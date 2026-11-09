import {
  ArrowRight,
  Award,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Layers,
  RotateCcw,
  Sparkles,
  Swords,
  Trophy,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { CardDetail } from '../components/cards/CardDetail';
import { GameCard } from '../components/cards/GameCard';
import { Icon } from '../components/ui/Icon';
import {
  Avatar,
  Button,
  CountUp,
  ProgressBar,
  Reveal,
  Ring,
  SectionTitle,
  cx,
} from '../components/ui/primitives';
import { CATEGORIES, CATEGORY_BY_ID } from '../content/categories';
import { classement } from '../data/selectors';
import { useSession } from '../data/store';
import {
  ACHIEVEMENTS,
  XP,
  collectionCategorie,
  defiDuJour,
  fileDeRevision,
  niveauDepuisXp,
  parcoursValide,
  prochaineCarteMaitrise,
  published,
} from '../domain/engine';
import type { Card } from '../domain/types';

function greeting() {
  const h = new Date().getHours();
  return h < 18 ? 'Bonjour' : 'Bonsoir';
}

export function Dashboard() {
  const { db, user, progress, catalog } = useSession();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<Card | null>(null);
  const [now] = useState(() => Date.now());
  if (!user || !progress) return null;

  const lvl = niveauDepuisXp(progress.xp);
  const cards = published(catalog.cards);
  const total = cards.length;
  const owned = progress.cards.length;
  const recent = [...progress.cards].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  const recentCards = recent
    .map((r) => catalog.cards.find((c) => c.id === r.cardId))
    .filter((c): c is Card => !!c);
  const daily = defiDuJour(catalog, new Date());
  const dailyDone = progress.quotidiens.includes(daily.jour);
  const dailyCat = CATEGORY_BY_ID[daily.categorie];
  const dailyCard = prochaineCarteMaitrise(catalog, progress, daily.categorie);
  const revision = fileDeRevision(catalog, progress);
  const defisRealises =
    catalog.parcours.filter((p) => parcoursValide(catalog, progress, p.id)).length +
    new Set(progress.scenarios.filter((s) => s.score === 1).map((s) => s.id)).size +
    progress.quotidiens.length;
  const board = classement(db, 'semaine');
  const myRank = board.findIndex((r) => r.user.id === user.id);
  const newIds = new Set(
    progress.cards.filter((c) => now - Date.parse(c.at) < 3 * 86_400_000).map((c) => c.cardId),
  );

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ───── Bandeau personnalisé ───── */}
      <Reveal>
        <section
          className="relative overflow-hidden rounded-3xl p-5 text-white sm:p-8"
          style={{ background: 'linear-gradient(125deg, #2563A6 0%, #153E75 50%, #0B2347 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(#fff 1px, transparent 1.2px)',
              backgroundSize: '18px 18px',
            }}
          />
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-sun/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <Avatar user={user} size={56} ring />
                <div>
                  <p className="text-sm text-white/70">{greeting()},</p>
                  <h1 className="text-2xl font-extrabold sm:text-3xl">
                    {user.prenom} {user.nom}
                  </h1>
                </div>
              </div>
              <div className="mt-6 max-w-md">
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-10 place-items-center rounded-xl bg-sun font-display text-lg font-extrabold text-navy-950 shadow-lg shadow-sun/30">
                      {lvl.niveau}
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-sun">
                        Niveau {lvl.niveau}
                      </p>
                      <p className="font-display text-lg font-bold leading-tight">{lvl.titre}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/75">
                    <span className="font-semibold text-white">
                      <CountUp value={progress.xp} />
                    </span>{' '}
                    XP
                  </p>
                </div>
                <ProgressBar
                  value={lvl.progression}
                  tone="sun"
                  height={10}
                  className="mt-3 bg-white/15"
                  delay={0.2}
                />
                <p className="mt-2 text-xs text-white/65">
                  Plus que {lvl.xpPourSuivant - lvl.xpDansNiveau} XP avant le niveau{' '}
                  {lvl.niveau + 1}
                </p>
              </div>
            </div>

            {/* Éventail des dernières cartes */}
            {recentCards.length > 0 && (
              <div className="relative hidden h-[200px] w-[300px] shrink-0 sm:block lg:mr-6">
                {recentCards
                  .slice(0, 3)
                  .reverse()
                  .map((c, i, arr) => {
                    const k = i - (arr.length - 1) / 2;
                    return (
                      <motion.div
                        key={c.id}
                        className="absolute left-1/2 top-1/2"
                        initial={{ opacity: 0, y: 30, x: '-50%' }}
                        animate={{
                          opacity: 1,
                          y: '-50%',
                          x: `calc(-50% + ${k * 78}px)`,
                          rotate: k * 9,
                        }}
                        transition={{
                          delay: 0.2 + i * 0.1,
                          type: 'spring',
                          stiffness: 140,
                          damping: 16,
                        }}
                        style={{ zIndex: i }}
                      >
                        <GameCard card={c} total={total} size="sm" onClick={() => setDetail(c)} />
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>
        </section>
      </Reveal>

      {/* ───── Indicateurs ───── */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Reveal delay={0.05}>
          <Link
            to="/collection"
            className="panel flex h-full items-center gap-4 p-4 transition-shadow hover:shadow-lift sm:p-5"
          >
            <Ring value={owned / total} size={58} stroke={6}>
              <span className="text-xs font-bold text-navy">
                {Math.round((owned / total) * 100)}%
              </span>
            </Ring>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Collection</p>
              <p className="font-display text-xl font-extrabold text-navy-950 sm:text-2xl">
                {owned}
                <span className="text-base font-bold text-muted">/{total}</span>
              </p>
            </div>
          </Link>
        </Reveal>
        <StatTile
          delay={0.1}
          icon={<Swords size={20} />}
          tint="#2563A6"
          label="Défis réalisés"
          value={defisRealises}
          to="/defis"
        />
        <StatTile
          delay={0.15}
          icon={<Award size={20} />}
          tint="#C99A17"
          label="Succès"
          value={progress.achievements.length}
          suffix={`/${ACHIEVEMENTS.length}`}
          to="/profil"
        />
        <StatTile
          delay={0.2}
          icon={<RotateCcw size={20} />}
          tint={revision.length ? '#DC4444' : '#22A06B'}
          label="À réviser"
          value={revision.length}
          to="/apprendre#revision"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 [&>*]:min-w-0">
        {/* ───── Défi du jour ───── */}
        <Reveal delay={0.1} className="lg:col-span-7">
          <section className="panel relative h-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-sun" />
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
              <div
                className="grid size-16 shrink-0 place-items-center rounded-2xl"
                style={{ background: dailyCat.fond, color: dailyCat.couleur }}
              >
                <Icon name={dailyCat.icone} size={30} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sun/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-navy-950">
                    <Flame size={12} className="text-sun-dark" /> Défi du jour
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <Clock size={12} /> 2 min · {daily.questions.length} questions
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-extrabold text-navy-950">
                  {dailyCat.nom} : le réflexe du jour
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {daily.questions.length} questions pour vérifier tes acquis. Réussis-en au moins{' '}
                  {Math.ceil(daily.questions.length * 0.75)} pour valider le défi.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-2.5 py-1.5 text-xs font-bold text-white">
                    <Sparkles size={13} className="text-sun" /> +{XP.quotidien} XP
                  </span>
                  {dailyCard && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-light px-2.5 py-1.5 text-xs font-semibold text-navy">
                      <Layers size={13} /> Carte à débloquer : {dailyCard.nom}
                    </span>
                  )}
                </div>
                <div className="mt-5">
                  {dailyDone ? (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-success/10 px-4 py-2.5 text-sm font-semibold text-success">
                      <CheckCircle2 size={18} /> Défi réussi, rendez-vous demain !
                    </div>
                  ) : (
                    <Button variant="accent" size="lg" onClick={() => navigate('/quiz/quotidien')}>
                      Commencer le défi <ArrowRight size={18} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {revision.length > 0 && (
              <Link
                to="/quiz/revision"
                className="flex items-center justify-between border-t border-line bg-canvas/60 px-5 py-3.5 text-sm transition-colors hover:bg-blue-light/60 sm:px-6"
              >
                <span className="flex items-center gap-2 text-ink/80">
                  <RotateCcw size={16} className="text-danger" />
                  <span>
                    <strong className="text-navy-950">
                      {revision.length} question{revision.length > 1 ? 's' : ''}
                    </strong>{' '}
                    à revoir pour consolider tes connaissances
                  </span>
                </span>
                <ChevronRight size={18} className="text-muted" />
              </Link>
            )}
          </section>
        </Reveal>

        {/* ───── Classement ───── */}
        <Reveal delay={0.15} className="lg:col-span-5">
          <section className="panel h-full p-5 sm:p-6">
            <SectionTitle
              title="Les plus actifs cette semaine"
              action={
                <Link to="/classement" className="text-sm font-semibold text-blue hover:underline">
                  Voir tout
                </Link>
              }
            />
            <ol className="space-y-1">
              {board.slice(0, 5).map((r, i) => (
                <li
                  key={r.user.id}
                  className={cx(
                    'flex items-center gap-3 rounded-xl px-2 py-2',
                    r.user.id === user.id && 'bg-sun/15',
                  )}
                >
                  <span
                    className={cx(
                      'w-6 text-center font-display text-sm font-extrabold',
                      i === 0 ? 'text-sun-dark' : 'text-muted',
                    )}
                  >
                    {i + 1}
                  </span>
                  <Avatar user={r.user} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-950">
                      {r.user.prenom} {r.user.nom}
                    </p>
                    <p className="text-xs text-muted">
                      Niveau {r.niveau} · {r.user.service}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-navy">+{r.xp} XP</span>
                </li>
              ))}
            </ol>
            {myRank >= 5 && (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-line px-2 py-2">
                <span className="w-6 text-center font-display text-sm font-extrabold text-muted">
                  {myRank + 1}
                </span>
                <Avatar user={user} size={34} />
                <p className="flex-1 text-sm font-semibold text-navy-950">Toi</p>
                <span className="text-sm font-bold text-navy">+{board[myRank].xp} XP</span>
              </div>
            )}
          </section>
        </Reveal>

        {/* ───── Dernières acquisitions ───── */}
        <Reveal delay={0.2} className="lg:col-span-7">
          <section className="panel h-full p-5 sm:p-6">
            <SectionTitle
              title="Dernières acquisitions"
              subtitle={`${owned} cartes sur ${total} dans ton album`}
              action={
                <Link
                  to="/collection"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue hover:underline"
                >
                  Ma collection <ChevronRight size={15} />
                </Link>
              }
            />
            {recentCards.length ? (
              <div className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 pt-2 sm:-mx-6 sm:px-6">
                {recentCards.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                  >
                    <GameCard
                      card={c}
                      total={total}
                      size="sm"
                      isNew={newIds.has(c.id)}
                      onClick={() => setDetail(c)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Réponds à ta première question pour obtenir ta première carte.
              </p>
            )}
          </section>
        </Reveal>

        {/* ───── Progression des collections ───── */}
        <Reveal delay={0.25} className="lg:col-span-5">
          <section className="panel h-full p-5 sm:p-6">
            <SectionTitle title="Progression des familles" />
            <ul className="space-y-4">
              {CATEGORIES.map((cat, i) => {
                const col = collectionCategorie(catalog, progress, cat.id);
                return (
                  <li key={cat.id}>
                    <Link
                      to={`/collection?cat=${cat.id}`}
                      className="group flex items-center gap-3"
                    >
                      <span
                        className="grid size-10 shrink-0 place-items-center rounded-xl"
                        style={{ background: cat.fond, color: cat.couleur }}
                      >
                        <Icon name={cat.icone} size={19} />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                          <p className="text-sm font-semibold text-navy-950 group-hover:text-blue">
                            {cat.nom}
                          </p>
                          <p className="text-xs font-semibold text-muted">
                            {col.ratio === 1 ? (
                              <span className="inline-flex items-center gap-1 text-success">
                                <Trophy size={12} /> Complète
                              </span>
                            ) : (
                              `${col.obtenues}/${col.total}`
                            )}
                          </p>
                        </div>
                        <ProgressBar
                          value={col.ratio}
                          tone={cat.couleur}
                          height={6}
                          className="mt-2"
                          delay={0.3 + i * 0.05}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </Reveal>
      </div>

      {progress.quotidiens.length > 0 && (
        <p className="flex items-center justify-center gap-2 text-center text-sm text-muted">
          <CalendarCheck size={16} className="text-success" /> {progress.quotidiens.length} défi
          {progress.quotidiens.length > 1 ? 's' : ''} du jour réussi
          {progress.quotidiens.length > 1 ? 's' : ''} depuis ton arrivée
        </p>
      )}

      <CardDetail
        card={detail}
        catalog={catalog}
        owned
        obtainedAt={progress.cards.find((c) => c.cardId === detail?.id)?.at}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

function StatTile({
  icon,
  tint,
  label,
  value,
  suffix,
  to,
  delay,
}: {
  icon: ReactNode;
  tint: string;
  label: string;
  value: number;
  suffix?: string;
  to: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <Link
        to={to}
        className="panel flex h-full items-center gap-4 p-4 transition-shadow hover:shadow-lift sm:p-5"
      >
        <span
          className="grid size-[58px] shrink-0 place-items-center rounded-2xl"
          style={{ background: `${tint}14`, color: tint }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="font-display text-xl font-extrabold text-navy-950 sm:text-2xl">
            <CountUp value={value} />
            {suffix && <span className="text-base font-bold text-muted">{suffix}</span>}
          </p>
        </div>
      </Link>
    </Reveal>
  );
}
