import { ArrowRight, Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Button, cx } from '../../components/ui/primitives';
import { etoilesScore } from '../logic';
import type { Jeu, ResultatJeu } from '../types';
import { Retour } from '../ui';

type Props = { jeu: Extract<Jeu, { type: 'quiz' }>; onFini: (r: ResultatJeu) => void };

export function Quiz({ jeu, onFini }: Props) {
  const [index, setIndex] = useState(0);
  const [reponses, setReponses] = useState<number[]>([]);
  const q = jeu.questions[index];
  const choisi = reponses[index];
  const repondu = choisi !== undefined;
  const fini = reponses.length === jeu.questions.length && index === jeu.questions.length - 1;
  const bonnes = reponses.filter((r, i) => r === jeu.questions[i].bonne).length;

  const choisir = (c: number) => {
    if (repondu) return;
    const next = [...reponses, c];
    setReponses(next);
    if (next.length === jeu.questions.length) {
      const total = next.filter((r, i) => r === jeu.questions[i].bonne).length;
      setTimeout(() => onFini(etoilesScore(total, jeu.questions.length)), 700);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1.5"
        aria-label={`Question ${index + 1} sur ${jeu.questions.length}`}
      >
        {jeu.questions.map((qq, i) => (
          <span
            key={i}
            className={cx(
              'h-2 flex-1 rounded-full transition-colors',
              reponses[i] === undefined
                ? i === index
                  ? 'bg-sun'
                  : 'bg-navy/10'
                : reponses[i] === qq.bonne
                  ? 'bg-success'
                  : 'bg-danger',
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Question {index + 1} / {jeu.questions.length}
          </p>
          <h3 className="font-display text-xl font-extrabold leading-snug text-navy-950">
            {q.question}
          </h3>
          <div className="grid gap-3">
            {q.choix.map((c, i) => {
              const etat = !repondu ? 'idle' : i === q.bonne ? 'ok' : i === choisi ? 'ko' : 'dim';
              return (
                <motion.button
                  key={c}
                  type="button"
                  onClick={() => choisir(i)}
                  disabled={repondu}
                  whileHover={repondu ? undefined : { y: -2 }}
                  whileTap={repondu ? undefined : { scale: 0.98 }}
                  animate={
                    etat === 'ko'
                      ? { x: [0, -7, 7, -4, 4, 0] }
                      : etat === 'ok' && i === choisi
                        ? { scale: [1, 1.03, 1] }
                        : {}
                  }
                  className={cx(
                    'flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-semibold transition-colors',
                    etat === 'idle' &&
                      'border-line bg-white text-navy-950 hover:border-blue/50 hover:bg-blue-light/40',
                    etat === 'ok' && 'border-success bg-success/[0.08] text-navy-950',
                    etat === 'ko' && 'border-danger bg-danger/[0.07] text-navy-950',
                    etat === 'dim' && 'border-line bg-white text-navy-950/50',
                  )}
                >
                  <span
                    className={cx(
                      'grid size-9 shrink-0 place-items-center rounded-xl font-display font-extrabold',
                      etat === 'ok'
                        ? 'bg-success text-white'
                        : etat === 'ko'
                          ? 'bg-danger text-white'
                          : 'bg-canvas text-navy',
                    )}
                  >
                    {etat === 'ok' ? (
                      <Check size={17} strokeWidth={3} />
                    ) : etat === 'ko' ? (
                      <X size={17} strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  {c}
                </motion.button>
              );
            })}
          </div>
          {repondu && (
            <Retour ok={choisi === q.bonne}>
              {choisi === q.bonne
                ? 'Bonne réponse !'
                : `Raté ! La bonne réponse était : ${q.choix[q.bonne]}`}
            </Retour>
          )}
        </motion.div>
      </AnimatePresence>

      {repondu && !fini && (
        <div className="flex justify-end">
          <Button size="lg" onClick={() => setIndex((i) => i + 1)}>
            Question suivante <ArrowRight size={18} />
          </Button>
        </div>
      )}
      {fini && (
        <p className="text-center font-display text-lg font-extrabold text-navy-950">
          Score : {bonnes}/{jeu.questions.length}
        </p>
      )}
    </div>
  );
}
