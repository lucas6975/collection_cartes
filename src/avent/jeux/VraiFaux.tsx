import { Check, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react';
import { useState } from 'react';
import { cx } from '../../components/ui/primitives';
import { etoilesScore } from '../logic';
import type { Jeu, ResultatJeu } from '../types';

type Props = { jeu: Extract<Jeu, { type: 'vraifaux' }>; onFini: (r: ResultatJeu) => void };

const SEUIL = 110;

/** Carte à faire glisser : à droite pour « vrai », à gauche pour « faux ». */
function CarteAffirmation({
  texte,
  numero,
  total,
  onReponse,
}: {
  texte: string;
  numero: number;
  total: number;
  onReponse: (v: boolean) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const vraiOpacity = useTransform(x, [20, SEUIL], [0, 1]);
  const fauxOpacity = useTransform(x, [-SEUIL, -20], [1, 0]);

  const finGlisse = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SEUIL) onReponse(true);
    else if (info.offset.x < -SEUIL) onReponse(false);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={finGlisse}
      style={{ x, rotate }}
      className="relative flex min-h-56 cursor-grab touch-pan-y flex-col items-center justify-center rounded-3xl border border-line bg-white p-6 text-center shadow-lift active:cursor-grabbing sm:min-h-64"
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <span className="absolute left-5 top-4 text-xs font-bold uppercase tracking-wider text-muted">
        {numero} / {total}
      </span>
      <motion.span
        style={{ opacity: vraiOpacity }}
        className="absolute right-5 top-4 rotate-12 rounded-lg border-2 border-success px-2 py-0.5 font-display text-sm font-extrabold uppercase text-success"
      >
        Vrai
      </motion.span>
      <motion.span
        style={{ opacity: fauxOpacity }}
        className="absolute left-5 top-10 -rotate-12 rounded-lg border-2 border-danger px-2 py-0.5 font-display text-sm font-extrabold uppercase text-danger"
      >
        Faux
      </motion.span>
      <p className="font-display text-xl font-extrabold leading-snug text-navy-950 sm:text-2xl">
        {texte}
      </p>
      <p className="mt-4 text-xs text-muted">← Faux · glisse la carte · Vrai →</p>
    </motion.div>
  );
}

export function VraiFaux({ jeu, onFini }: Props) {
  const [reponses, setReponses] = useState<boolean[]>([]);
  const [retour, setRetour] = useState<{ ok: boolean; bonne: boolean } | null>(null);
  const index = reponses.length;
  const fini = index >= jeu.questions.length;
  const bonnes = reponses.filter((r, i) => r === jeu.questions[i].reponse).length;

  const repondre = (v: boolean) => {
    if (fini || retour) return;
    const bonne = jeu.questions[index].reponse;
    setRetour({ ok: v === bonne, bonne });
    setTimeout(() => {
      const next = [...reponses, v];
      setReponses(next);
      setRetour(null);
      if (next.length === jeu.questions.length) {
        onFini(
          etoilesScore(
            next.filter((r, i) => r === jeu.questions[i].reponse).length,
            jeu.questions.length,
          ),
        );
      }
    }, 1300);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-2" aria-hidden>
        {jeu.questions.map((q, i) => (
          <span
            key={i}
            className={cx(
              'grid size-7 place-items-center rounded-full text-white transition-colors',
              i >= reponses.length
                ? i === index
                  ? 'bg-sun'
                  : 'bg-navy/10'
                : reponses[i] === q.reponse
                  ? 'bg-success'
                  : 'bg-danger',
            )}
          >
            {i < reponses.length &&
              (reponses[i] === q.reponse ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <X size={14} strokeWidth={3} />
              ))}
          </span>
        ))}
      </div>

      {!fini ? (
        <div className="relative mx-auto max-w-md">
          {/* Cartes suivantes en pile */}
          {index + 1 < jeu.questions.length && (
            <div
              className="absolute inset-x-4 -bottom-2 top-3 rounded-3xl bg-white/70 shadow-soft"
              aria-hidden
            />
          )}
          <AnimatePresence mode="wait">
            {retour ? (
              <motion.div
                key={`r-${index}`}
                initial={{ scale: 0.85, opacity: 0, rotate: retour.ok ? 4 : -4 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ x: retour.bonne ? 400 : -400, opacity: 0, rotate: retour.bonne ? 20 : -20 }}
                className={cx(
                  'relative flex min-h-56 flex-col items-center justify-center rounded-3xl p-6 text-center text-white shadow-lift sm:min-h-64',
                  retour.ok ? 'bg-success' : 'bg-danger',
                )}
              >
                <span className="grid size-16 place-items-center rounded-full bg-white/20">
                  {retour.ok ? (
                    <Check size={34} strokeWidth={3} />
                  ) : (
                    <X size={34} strokeWidth={3} />
                  )}
                </span>
                <p className="mt-4 font-display text-2xl font-extrabold">
                  {retour.ok ? 'Bien joué !' : 'Raté !'}
                </p>
                <p className="mt-1 text-white/90">C’était {retour.bonne ? 'VRAI' : 'FAUX'}.</p>
              </motion.div>
            ) : (
              <CarteAffirmation
                key={`q-${index}`}
                texte={jeu.questions[index].affirmation}
                numero={index + 1}
                total={jeu.questions.length}
                onReponse={repondre}
              />
            )}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-center font-display text-lg font-extrabold text-navy-950">
          Score : {bonnes}/{jeu.questions.length}
        </p>
      )}

      {!fini && (
        <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => repondre(false)}
            disabled={!!retour}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-danger font-display text-lg font-extrabold text-white shadow-md disabled:opacity-50"
          >
            <ThumbsDown size={20} /> Faux
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => repondre(true)}
            disabled={!!retour}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-success font-display text-lg font-extrabold text-white shadow-md disabled:opacity-50"
          >
            <ThumbsUp size={20} /> Vrai
          </motion.button>
        </div>
      )}

      {fini && (
        <ul className="space-y-2">
          {jeu.questions.map((q, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-canvas px-3 py-2.5 text-sm">
              <span
                className={cx(
                  'font-bold',
                  reponses[i] === q.reponse ? 'text-success' : 'text-danger',
                )}
              >
                {q.reponse ? 'VRAI' : 'FAUX'}
              </span>
              <span className="text-ink/85">{q.affirmation}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
