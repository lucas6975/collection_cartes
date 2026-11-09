import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { NatureBadge, SourcesBlock } from '../components/cards/CardDetail';
import { GameCard } from '../components/cards/GameCard';
import { useCelebrate } from '../components/cards/Rewards';
import { Icon } from '../components/ui/Icon';
import { Button, CountUp, ProgressBar, Ring, cx } from '../components/ui/primitives';
import { CATEGORY_BY_ID } from '../content/categories';
import { backend, useSession } from '../data/store';
import {
  defiDuJour,
  fileDeRevision,
  published,
  questionsParcours,
  type QuizResult,
} from '../domain/engine';
import type { Question } from '../domain/types';

type Mode = 'parcours' | 'quotidien' | 'revision';

export function QuizPlayer() {
  const { mode, id } = useParams<{ mode: Mode; id?: string }>();
  const { catalog, progress } = useSession();
  const navigate = useNavigate();
  const celebrate = useCelebrate();

  // La liste des questions est figée au démarrage de la session.
  const [setup] = useState(() => {
    if (!progress) return null;
    if (mode === 'parcours') {
      const p = catalog.parcours.find((x) => x.id === id && x.publie);
      if (!p) return null;
      return {
        titre: p.titre,
        categorie: p.categorie,
        questions: questionsParcours(catalog, p),
        seuil: p.seuil,
      };
    }
    if (mode === 'quotidien') {
      const d = defiDuJour(catalog, new Date());
      return {
        titre: 'Défi du jour',
        categorie: d.categorie,
        questions: d.questions,
        seuil: 0.75,
        dejaFait: progress.quotidiens.includes(d.jour),
      };
    }
    if (mode === 'revision') {
      const qs = fileDeRevision(catalog, progress).slice(0, 8);
      return {
        titre: 'Révision',
        categorie: qs[0]?.categorie ?? 'incendie',
        questions: qs,
        seuil: 1,
      };
    }
    return null;
  });

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = setup?.questions[index];
  const chosen = q ? answers[q.id] : undefined;
  const isLast = setup ? index === setup.questions.length - 1 : false;

  const choose = (choiceId: string) => {
    if (!q || chosen) return;
    setAnswers((a) => ({ ...a, [q.id]: choiceId }));
  };

  const next = () => {
    if (!setup || !chosen) return;
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    try {
      const res = backend.submitQuiz({
        contexte:
          mode === 'quotidien' ? 'quotidien' : mode === 'revision' ? 'revision' : 'parcours',
        parcoursId: mode === 'parcours' ? id : undefined,
        reponses: setup.questions.map((x) => ({ questionId: x.id, choixId: answers[x.id] })),
      });
      setResult(res);
      setTimeout(() => celebrate(res.summary), 700);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue');
    }
  };

  // Raccourcis clavier : 1-4 pour répondre, Entrée pour continuer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (result || !q) return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.choix.length) choose(q.choix[n - 1].id);
      if (e.key === 'Enter' && chosen) next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!setup || setup.questions.length === 0) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <CheckCircle2 size={40} className="mx-auto text-success" />
        <h1 className="mt-4 text-xl font-bold text-navy-950">
          {mode === 'revision' ? 'Rien à réviser pour le moment' : 'Quiz introuvable'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === 'revision'
            ? 'Toutes tes réponses récentes sont correctes. Bravo !'
            : 'Ce contenu n’est pas disponible.'}
        </p>
        <Button className="mt-6" onClick={() => navigate('/apprendre')}>
          Retour aux parcours
        </Button>
      </div>
    );
  }

  if (result) return <QuizResults setup={setup} result={result} answers={answers} mode={mode!} />;

  const cat = CATEGORY_BY_ID[setup.categorie];
  const correct = q && chosen ? chosen === q.bonneReponse : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* En-tête du quiz */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          to={mode === 'quotidien' ? '/defis' : '/apprendre'}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white text-navy hover:bg-blue-light"
          aria-label="Quitter le quiz"
        >
          <X size={18} />
        </Link>
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5" style={{ color: cat.couleur }}>
              <Icon name={cat.icone} size={14} /> {setup.titre}
            </span>
            <span className="text-muted">
              {index + 1} / {setup.questions.length}
            </span>
          </div>
          <ProgressBar
            value={(index + (chosen ? 1 : 0)) / setup.questions.length}
            tone="sun"
            height={8}
          />
        </div>
      </div>

      {'dejaFait' in setup && setup.dejaFait && index === 0 && !chosen && (
        <p className="mb-4 rounded-xl bg-blue-light px-4 py-3 text-sm text-navy">
          Tu as déjà réussi le défi du jour : cette session sert d’entraînement, sans XP
          supplémentaire.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      <AnimatePresence mode="wait">
        {q && (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <div className="panel p-5 sm:p-8">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Question {index + 1}
                </span>
                <span className="flex gap-0.5" aria-label={`Difficulté ${q.difficulte} sur 3`}>
                  {[1, 2, 3].map((d) => (
                    <span
                      key={d}
                      className={cx(
                        'h-1.5 w-3 rounded-full',
                        d <= q.difficulte ? 'bg-navy/60' : 'bg-navy/10',
                      )}
                    />
                  ))}
                </span>
              </div>
              <h1 className="mt-3 text-xl font-bold leading-snug text-navy-950 sm:text-2xl">
                {q.enonce}
              </h1>

              <div className="mt-6 grid gap-3" role="radiogroup">
                {q.choix.map((c, i) => {
                  const isChosen = chosen === c.id;
                  const isRight = c.id === q.bonneReponse;
                  const state = !chosen ? 'idle' : isRight ? 'right' : isChosen ? 'wrong' : 'dim';
                  return (
                    <motion.button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={isChosen}
                      onClick={() => choose(c.id)}
                      disabled={!!chosen}
                      animate={
                        state === 'wrong'
                          ? { x: [0, -6, 6, -4, 4, 0] }
                          : state === 'right' && isChosen
                            ? { scale: [1, 1.02, 1] }
                            : {}
                      }
                      transition={{ duration: 0.4 }}
                      className={cx(
                        'flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-medium transition-colors',
                        state === 'idle' &&
                          'border-line bg-white hover:border-blue/50 hover:bg-blue-light/40',
                        state === 'right' && 'border-success bg-success/[0.08] text-navy-950',
                        state === 'wrong' && 'border-danger bg-danger/[0.07] text-navy-950',
                        state === 'dim' && 'border-line bg-white opacity-55',
                      )}
                    >
                      <span
                        className={cx(
                          'grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold',
                          state === 'idle' && 'bg-canvas text-navy',
                          state === 'right' && 'bg-success text-white',
                          state === 'wrong' && 'bg-danger text-white',
                          state === 'dim' && 'bg-canvas text-muted',
                        )}
                      >
                        {state === 'right' ? (
                          <Check size={16} />
                        ) : state === 'wrong' ? (
                          <X size={16} />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      {c.texte}
                    </motion.button>
                  );
                })}
              </div>

              {/* Explication pédagogique */}
              <AnimatePresence>
                {chosen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div
                      className={cx(
                        'mt-6 rounded-2xl p-5',
                        correct ? 'bg-success/[0.07]' : 'bg-danger/[0.06]',
                      )}
                    >
                      <p
                        className={cx(
                          'flex items-center gap-2 font-display text-lg font-bold',
                          correct ? 'text-success' : 'text-danger',
                        )}
                      >
                        {correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                        {correct ? 'Bonne réponse' : 'Ce n’est pas la bonne réponse'}
                      </p>
                      {!correct && (
                        <p className="mt-1 text-sm text-ink/80">
                          La bonne réponse était :{' '}
                          <strong>{q.choix.find((c) => c.id === q.bonneReponse)?.texte}</strong>
                        </p>
                      )}
                      <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
                        {q.explication}
                      </p>
                      <div className="mt-3">
                        <NatureBadge nature={q.nature} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <SourcesBlock item={q} compact />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="sticky bottom-20 mt-4 flex justify-end md:bottom-6">
              <Button
                variant={chosen ? 'primary' : 'secondary'}
                size="lg"
                onClick={next}
                disabled={!chosen}
                className="w-full shadow-lift sm:w-auto"
              >
                {isLast ? 'Voir mon résultat' : 'Question suivante'} <ArrowRight size={18} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuizResults({
  setup,
  result,
  answers,
  mode,
}: {
  setup: { titre: string; questions: Question[]; seuil: number };
  result: QuizResult;
  answers: Record<string, string>;
  mode: Mode;
}) {
  const { catalog } = useSession();
  const navigate = useNavigate();
  const total = useMemo(() => published(catalog.cards).length, [catalog]);
  const bonnes = result.corrections.filter((c) => c.correct).length;
  const erreurs = result.corrections.length - bonnes;
  const cards = result.summary.nouvellesCartes
    .map((id) => catalog.cards.find((c) => c.id === id))
    .filter((c) => !!c);
  const titre = result.valide
    ? mode === 'revision'
      ? 'Erreurs corrigées !'
      : mode === 'quotidien'
        ? 'Défi du jour réussi !'
        : 'Parcours validé !'
    : 'Encore un petit effort';

  return (
    <motion.div
      className="mx-auto max-w-3xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="panel overflow-hidden">
        <div
          className="relative px-6 py-10 text-center text-white"
          style={{
            background: result.valide
              ? 'linear-gradient(135deg, #2563A6, #153E75 60%, #0B2347)'
              : 'linear-gradient(135deg, #475569, #1E293B)',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(#fff 1px, transparent 1.2px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="relative flex flex-col items-center">
            <Ring
              value={result.score}
              size={120}
              stroke={10}
              color={result.valide ? '#F5C542' : '#94A3B8'}
              track="rgba(255,255,255,0.12)"
            >
              <div>
                <p className="font-display text-3xl font-extrabold">
                  {Math.round(result.score * 100)}%
                </p>
                <p className="text-xs text-white/70">
                  {bonnes}/{result.corrections.length}
                </p>
              </div>
            </Ring>
            <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">{titre}</h1>
            <p className="mt-2 max-w-md text-sm text-white/75">
              {result.valide
                ? `Tu as réussi « ${setup.titre} ».`
                : `Il faut au moins ${Math.round(setup.seuil * 100)} % de bonnes réponses pour valider. Tes erreurs sont ajoutées à ta liste de révision.`}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-display text-lg font-bold">
              <Sparkles size={18} className="text-sun" /> +
              <CountUp value={result.summary.xpGagne} /> XP
            </div>
            {result.summary.xpGagne === 0 && (
              <p className="mt-2 text-xs text-white/60">
                L’XP est accordée à la première réussite de chaque question et de chaque défi.
              </p>
            )}
          </div>
        </div>

        {cards.length > 0 && (
          <div className="border-b border-line px-6 py-6">
            <p className="eyebrow mb-4">Cartes obtenues</p>
            <div className="flex flex-wrap gap-3">
              {cards.map((c) => (
                <GameCard key={c.id} card={c} total={total} size="sm" />
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-6">
          <p className="eyebrow mb-3">Récapitulatif</p>
          <ul className="divide-y divide-line">
            {setup.questions.map((q) => {
              const ok = answers[q.id] === q.bonneReponse;
              return (
                <li key={q.id} className="flex gap-3 py-3">
                  {ok ? (
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
                  ) : (
                    <XCircle size={20} className="mt-0.5 shrink-0 text-danger" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-navy-950">{q.enonce}</p>
                    {!ok && (
                      <p className="mt-0.5 text-sm text-muted">
                        Réponse attendue : {q.choix.find((c) => c.id === q.bonneReponse)?.texte}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-3 border-t border-line bg-canvas/50 px-6 py-5 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={() => navigate(mode === 'quotidien' ? '/defis' : '/apprendre')}
          >
            <ArrowLeft size={17} /> Retour
          </Button>
          {erreurs > 0 && mode !== 'revision' && (
            <Button variant="secondary" onClick={() => navigate('/quiz/revision')}>
              <RotateCcw size={17} /> Réviser mes erreurs
            </Button>
          )}
          <Button variant="accent" onClick={() => navigate('/collection')}>
            Voir ma collection <ArrowRight size={17} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
