import { HardHat, Lightbulb, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button, cx } from '../../components/ui/primitives';
import { etoilesPendu } from '../logic';
import type { Jeu, ResultatJeu } from '../types';
import { Retour } from '../ui';

type Props = {
  jeu: Extract<Jeu, { type: 'pendu' }>;
  graine: number;
  onFini: (r: ResultatJeu) => void;
};

const VIES = 7;
const CLAVIER = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'];

export function Pendu({ jeu, graine, onFini }: Props) {
  const [partie, setPartie] = useState(0);
  const { mot, indice } = jeu.mots[(graine + partie) % jeu.mots.length];
  const [lettres, setLettres] = useState<string[]>([]);
  const [termine, setTermine] = useState(false);
  const erreurs = lettres.filter((l) => !mot.includes(l)).length;
  const gagne = [...mot].every((c) => c === ' ' || lettres.includes(c));
  const perdu = erreurs >= VIES;

  const jouer = (l: string) => {
    if (termine || lettres.includes(l)) return;
    const next = [...lettres, l];
    setLettres(next);
    const err = next.filter((x) => !mot.includes(x)).length;
    const win = [...mot].every((c) => c === ' ' || next.includes(c));
    if (win || err >= VIES) {
      setTermine(true);
      onFini(etoilesPendu(win, err));
    }
  };

  // Clavier physique
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (/^[A-Z]$/.test(k)) jouer(k);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const rejouer = () => {
    setPartie((p) => p + 1);
    setLettres([]);
    setTermine(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl bg-sun/15 p-4">
        <Lightbulb size={18} className="mt-0.5 shrink-0 text-sun-dark" />
        <p className="text-[15px] font-medium text-navy-950">{indice}</p>
      </div>

      {/* Vies : un casque perdu par erreur */}
      <div
        className="flex items-center justify-center gap-1.5"
        aria-label={`${VIES - erreurs} vies restantes`}
      >
        {Array.from({ length: VIES }, (_, i) => (
          <motion.span
            key={i}
            animate={
              i < erreurs
                ? { scale: [1, 1.3, 0.85], rotate: [0, -20, 0], opacity: 0.25 }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.4 }}
          >
            <HardHat size={26} className={i < erreurs ? 'text-navy/40' : 'text-sun-dark'} />
          </motion.span>
        ))}
      </div>

      {/* Mot à trouver */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-3">
        {mot.split(' ').map((m, wi) => (
          <div key={wi} className="flex gap-1.5">
            {[...m].map((c, ci) => {
              const visible = lettres.includes(c) || termine;
              return (
                <span
                  key={ci}
                  className={cx(
                    'grid h-12 w-9 place-items-end justify-center border-b-[3px] pb-1 font-display text-2xl font-extrabold sm:w-10',
                    visible && !lettres.includes(c)
                      ? 'border-danger/60 text-danger'
                      : 'border-navy/30 text-navy-950',
                  )}
                >
                  <AnimatePresence>
                    {visible && (
                      <motion.span
                        initial={{ y: -14, opacity: 0, scale: 0.6 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                      >
                        {c}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {termine ? (
        <div className="space-y-3">
          <Retour ok={gagne}>
            {gagne ? `Bravo ! Le mot était bien « ${mot} ».` : `Perdu… Le mot était « ${mot} ».`}
          </Retour>
          {perdu && (
            <Button variant="secondary" className="w-full" onClick={rejouer}>
              <RotateCcw size={16} /> Essayer un autre mot
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {CLAVIER.map((ligne) => (
            <div key={ligne} className="flex justify-center gap-1 sm:gap-1.5">
              {[...ligne].map((l) => {
                const joue = lettres.includes(l);
                const bon = joue && mot.includes(l);
                return (
                  <motion.button
                    key={l}
                    type="button"
                    onClick={() => jouer(l)}
                    disabled={joue}
                    whileTap={{ scale: 0.9 }}
                    className={cx(
                      'grid h-12 w-[9%] max-w-11 place-items-center rounded-lg font-display text-base font-extrabold shadow-sm transition-colors sm:text-lg',
                      !joue && 'bg-white text-navy-950 ring-1 ring-line hover:bg-blue-light',
                      bon && 'bg-success text-white',
                      joue && !bon && 'bg-navy/10 text-navy/30',
                    )}
                    aria-label={`Lettre ${l}`}
                  >
                    {l}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
