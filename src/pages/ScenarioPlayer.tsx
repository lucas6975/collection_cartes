import { ArrowRight, CheckCircle2, MapPin, RotateCcw, Sparkles, X, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { SourcesBlock } from '../components/cards/CardDetail';
import { useCelebrate } from '../components/cards/Rewards';
import { Icon } from '../components/ui/Icon';
import { Button, CountUp, cx } from '../components/ui/primitives';
import { CATEGORY_BY_ID } from '../content/categories';
import { backend, useSession } from '../data/store';
import type { ScenarioResult } from '../domain/engine';

export function ScenarioPlayer() {
  const { id } = useParams<{ id: string }>();
  const { catalog } = useSession();
  const navigate = useNavigate();
  const celebrate = useCelebrate();
  const scenario = catalog.scenarios.find((s) => s.id === id && s.publie);
  const [step, setStep] = useState(0);
  const [choix, setChoix] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  if (!scenario) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <p className="font-semibold text-navy-950">Mise en situation introuvable.</p>
        <Button className="mt-4" onClick={() => navigate('/defis')}>
          Retour aux défis
        </Button>
      </div>
    );
  }

  const cat = CATEGORY_BY_ID[scenario.categorie];
  const etape = scenario.etapes[step];
  const picked = etape ? choix[etape.id] : undefined;
  const option = etape?.options.find((o) => o.id === picked);
  const last = step === scenario.etapes.length - 1;

  const next = () => {
    if (!last) return setStep((s) => s + 1);
    const res = backend.submitScenario(scenario.id, choix);
    setResult(res);
    setTimeout(() => celebrate(res.summary), 600);
  };

  const restart = () => {
    setStep(0);
    setChoix({});
    setResult(null);
    setAttempt((a) => a + 1);
  };

  return (
    <div className="mx-auto max-w-3xl" key={attempt}>
      <div
        className="relative overflow-hidden rounded-3xl p-6 text-white sm:p-8"
        style={{ background: `linear-gradient(135deg, ${cat.couleur}, #153E75 70%)` }}
      >
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 18px)',
          }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
              <Icon name={cat.icone} size={12} /> Mise en situation
            </p>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{scenario.titre}</h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/75">
              <MapPin size={14} /> {scenario.lieu}
            </p>
          </div>
          <Link
            to="/defis"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/25"
            aria-label="Quitter"
          >
            <X size={18} />
          </Link>
        </div>
        {!result && (
          <div className="relative mt-6 flex gap-2">
            {scenario.etapes.map((e, i) => (
              <span
                key={e.id}
                className={cx(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  i < step || (i === step && picked)
                    ? 'bg-sun'
                    : i === step
                      ? 'bg-white/50'
                      : 'bg-white/20',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {result ? (
        <motion.div
          className="panel mt-5 p-6 text-center sm:p-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {result.valide ? (
            <CheckCircle2 size={48} className="mx-auto text-success" />
          ) : (
            <RotateCcw size={44} className="mx-auto text-sun-dark" />
          )}
          <h2 className="mt-4 text-2xl font-extrabold text-navy-950">
            {result.valide ? 'Situation maîtrisée !' : 'Situation à retravailler'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">
            {result.valide
              ? 'Tu as pris les bonnes décisions à chaque étape.'
              : `${Math.round(result.score * scenario.etapes.length)} bonne(s) décision(s) sur ${scenario.etapes.length}. Relis les conséquences et retente pour obtenir la carte.`}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 font-display font-bold text-white">
            <Sparkles size={17} className="text-sun" /> +<CountUp value={result.summary.xpGagne} />{' '}
            XP
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="secondary" onClick={restart}>
              <RotateCcw size={17} /> Rejouer
            </Button>
            <Button variant="accent" onClick={() => navigate('/defis')}>
              Autres défis <ArrowRight size={17} />
            </Button>
          </div>
          <div className="mt-8 text-left">
            <SourcesBlock item={scenario} compact />
          </div>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={etape.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="panel mt-5 p-5 sm:p-7">
              <p className="eyebrow">
                Étape {step + 1} sur {scenario.etapes.length}
              </p>
              <p className="mt-3 text-lg font-semibold leading-relaxed text-navy-950">
                {etape.situation}
              </p>
              <p className="mt-5 text-sm font-semibold text-muted">Que fais-tu ?</p>
              <div className="mt-3 grid gap-3">
                {etape.options.map((o) => {
                  const isPicked = picked === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={!!picked}
                      onClick={() => setChoix((c) => ({ ...c, [etape.id]: o.id }))}
                      className={cx(
                        'rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] font-medium transition-all',
                        !picked &&
                          'border-line bg-white hover:-translate-y-0.5 hover:border-blue/50 hover:shadow-soft',
                        picked && isPicked && o.correct && 'border-success bg-success/[0.08]',
                        picked && isPicked && !o.correct && 'border-danger bg-danger/[0.07]',
                        picked &&
                          !isPicked &&
                          (o.correct
                            ? 'border-success/40 bg-white'
                            : 'border-line bg-white opacity-50'),
                      )}
                    >
                      {o.texte}
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {option && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cx(
                      'mt-5 rounded-2xl p-5',
                      option.correct ? 'bg-success/[0.07]' : 'bg-danger/[0.06]',
                    )}
                  >
                    <p
                      className={cx(
                        'flex items-center gap-2 font-display font-bold',
                        option.correct ? 'text-success' : 'text-danger',
                      )}
                    >
                      {option.correct ? <CheckCircle2 size={19} /> : <XCircle size={19} />}
                      {option.correct ? 'Bonne décision' : 'Conséquence'}
                    </p>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink/85">
                      {option.consequence}
                    </p>
                    {!option.correct && (
                      <p className="mt-3 text-sm text-ink/70">
                        <strong>La bonne décision :</strong>{' '}
                        {etape.options.find((o) => o.correct)?.texte}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="sticky bottom-20 mt-4 flex justify-end md:bottom-6">
              <Button
                size="lg"
                onClick={next}
                disabled={!picked}
                className="w-full shadow-lift sm:w-auto"
              >
                {last ? 'Terminer' : 'Étape suivante'} <ArrowRight size={18} />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
