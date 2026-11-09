import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clapperboard,
  GraduationCap,
  Layers,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { GameCard } from '../components/cards/GameCard';
import { Icon } from '../components/ui/Icon';
import { Button, PageHeader, ProgressBar, Reveal, SectionTitle } from '../components/ui/primitives';
import { CATEGORY_BY_ID } from '../content/categories';
import { useSession } from '../data/store';
import {
  XP,
  fileDeRevision,
  maitrise,
  ownsCard,
  parcoursValide,
  published,
  questionsParcours,
} from '../domain/engine';

export function Learn() {
  const { catalog, progress } = useSession();
  const navigate = useNavigate();
  if (!progress) return null;
  const total = published(catalog.cards).length;
  const revision = fileDeRevision(catalog, progress);

  return (
    <div>
      <PageHeader
        eyebrow="Apprendre"
        title="Parcours thématiques"
        description="Des mini-parcours pour maîtriser un thème. Valide-les avec au moins 80 % de bonnes réponses pour gagner une carte rare."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {published(catalog.parcours).map((p, i) => {
          const cat = CATEGORY_BY_ID[p.categorie];
          const valide = parcoursValide(catalog, progress, p.id);
          const tries = progress.parcours.filter((x) => x.id === p.id);
          const best = tries.length ? Math.max(...tries.map((x) => x.score)) : null;
          const reward = catalog.cards.find(
            (c) => c.obtention.type === 'parcours' && c.obtention.parcoursId === p.id && c.publie,
          );
          const m = maitrise(catalog, progress, p.categorie);
          return (
            <Reveal key={p.id} delay={i * 0.05}>
              <article className="panel group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lift">
                <div
                  className="relative flex h-28 items-end justify-between overflow-hidden px-5 pb-4"
                  style={{ background: `linear-gradient(135deg, ${cat.couleur}, #153E75 85%)` }}
                >
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'radial-gradient(#fff 1px, transparent 1.2px)',
                      backgroundSize: '12px 12px',
                    }}
                  />
                  <div className="relative">
                    <span className="grid size-11 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
                      <Icon name={cat.icone} size={22} />
                    </span>
                  </div>
                  {reward && (
                    <div className="relative translate-y-8 rotate-6 transition-transform duration-300 group-hover:translate-y-6 group-hover:rotate-3">
                      <GameCard
                        card={reward}
                        total={total}
                        size="sm"
                        locked={!ownsCard(progress, reward.id)}
                        tilt={false}
                        width={84}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold" style={{ color: cat.couleur }}>
                    {cat.nom}
                  </p>
                  <h3 className="mt-1 text-lg font-bold leading-snug text-navy-950">{p.titre}</h3>
                  <p className="mt-1 text-sm text-muted">{p.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-lg bg-canvas px-2 py-1 text-ink/70">
                      {questionsParcours(catalog, p).length} questions
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-navy/5 px-2 py-1 text-navy">
                      <Sparkles size={12} className="text-sun-dark" /> +{XP.parcours} XP
                    </span>
                    {reward && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-light px-2 py-1 text-navy">
                        <Layers size={12} /> Carte {reward.rarete === 'rare' ? 'rare' : ''}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs text-muted">
                      <span>Maîtrise du thème</span>
                      <span className="font-semibold text-navy">{Math.round(m * 100)} %</span>
                    </div>
                    <ProgressBar value={m} tone={cat.couleur} height={6} />
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    {valide ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                        <CheckCircle2 size={17} /> Validé
                      </span>
                    ) : best !== null ? (
                      <span className="text-sm text-muted">
                        Meilleur score :{' '}
                        <strong className="text-navy">{Math.round(best * 100)} %</strong>
                      </span>
                    ) : (
                      <span className="text-sm text-muted">Pas encore tenté</span>
                    )}
                    <Button
                      variant={valide ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => navigate(`/quiz/parcours/${p.id}`)}
                    >
                      {valide ? 'Rejouer' : best !== null ? 'Réessayer' : 'Commencer'}{' '}
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      {/* ───── Révision ───── */}
      <section id="revision" className="mt-10 scroll-mt-24">
        <SectionTitle
          title="Révision"
          subtitle="Les questions manquées reviennent ici jusqu’à ce que tu les maîtrises."
        />
        <div className="panel p-5 sm:p-6">
          {revision.length === 0 ? (
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-success/10 text-success">
                <CheckCircle2 size={24} />
              </span>
              <div>
                <p className="font-semibold text-navy-950">Rien à réviser</p>
                <p className="text-sm text-muted">Toutes tes dernières réponses sont correctes.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-danger/10 text-danger">
                    <RotateCcw size={22} />
                  </span>
                  <div>
                    <p className="font-semibold text-navy-950">
                      {revision.length} question{revision.length > 1 ? 's' : ''} à revoir
                    </p>
                    <p className="text-sm text-muted">
                      Une bonne réponse en révision rapporte l’XP qui n’avait pas été gagnée.
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/quiz/revision')}>
                  Lancer la révision <ArrowRight size={16} />
                </Button>
              </div>
              <ul className="mt-5 divide-y divide-line border-t border-line">
                {revision.slice(0, 5).map((q) => (
                  <li key={q.id} className="flex items-center gap-3 py-3 text-sm">
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-lg"
                      style={{
                        background: CATEGORY_BY_ID[q.categorie].fond,
                        color: CATEGORY_BY_ID[q.categorie].couleur,
                      }}
                    >
                      <Icon name={CATEGORY_BY_ID[q.categorie].icone} size={15} />
                    </span>
                    <span className="text-ink/85">{q.enonce}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* ───── Comment gagner des cartes ───── */}
      <section className="mt-10">
        <SectionTitle title="Comment gagner des cartes ?" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Target,
              t: 'Réponds juste',
              d: 'Les cartes communes se débloquent en réussissant des questions de chaque famille.',
            },
            {
              icon: GraduationCap,
              t: 'Valide un parcours',
              d: 'Chaque parcours validé à 80 % rapporte une carte rare.',
            },
            {
              icon: Clapperboard,
              t: 'Réussis une situation',
              d: 'Les mises en situation réussies sans faute donnent une carte épique.',
            },
            {
              icon: BookOpenCheck,
              t: 'Complète une famille',
              d: 'La carte légendaire récompense une famille entièrement collectionnée.',
            },
          ].map(({ icon: I, t, d }) => (
            <div key={t} className="rounded-2xl border border-line bg-white/60 p-4">
              <I size={20} className="text-blue" />
              <p className="mt-3 font-semibold text-navy-950">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
