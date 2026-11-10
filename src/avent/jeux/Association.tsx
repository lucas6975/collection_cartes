import { Check, Eye, MousePointerClick, X } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useState } from 'react';
import { Button, cx } from '../../components/ui/primitives';
import { etoilesEssais, melanger } from '../logic';
import type { Jeu, ResultatJeu } from '../types';
import { Retour } from '../ui';

type Props = {
  jeu: Extract<Jeu, { type: 'association' }>;
  graine: number;
  onFini: (r: ResultatJeu) => void;
};

export function Association({ jeu, graine, onFini }: Props) {
  const n = jeu.paires.length;
  const [ordrePictos] = useState(() => melanger([...Array(n).keys()], graine));
  const [affect, setAffect] = useState<(string | null)[]>(() => Array(n).fill(null));
  const [choisi, setChoisi] = useState<string | null>(null);
  const [verifs, setVerifs] = useState<(boolean | null)[]>(() => Array(n).fill(null));
  const [essais, setEssais] = useState(0);
  const [fini, setFini] = useState<'gagne' | 'corrige' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [ordreLabels] = useState(() =>
    melanger(
      jeu.paires.map((p) => p.label),
      graine + 17,
    ),
  );
  const reserve = ordreLabels.filter((l) => !affect.includes(l));
  const toutPlace = affect.every(Boolean);

  const toucherPicto = (i: number) => {
    if (fini) return;
    setMessage(null);
    if (choisi) {
      setAffect((a) => a.map((v, j) => (j === i ? choisi : v === choisi ? null : v)));
      setVerifs((v) => v.map((x, j) => (j === i ? null : x)));
      setChoisi(null);
    } else if (affect[i]) {
      // Retirer l'étiquette pour la replacer ailleurs.
      setChoisi(affect[i]);
      setAffect((a) => a.map((v, j) => (j === i ? null : v)));
      setVerifs((v) => v.map((x, j) => (j === i ? null : x)));
    }
  };

  const valider = () => {
    const nb = essais + 1;
    setEssais(nb);
    const res = affect.map((l, i) => l === jeu.paires[i].label);
    setVerifs(res);
    const bons = res.filter(Boolean).length;
    if (bons === n) {
      setFini('gagne');
      onFini(etoilesEssais(nb, false));
      return;
    }
    setMessage(`${bons}/${n} bonnes associations. Les erreurs retournent dans la réserve.`);
    // Les mauvaises réponses retournent dans la réserve après un court instant.
    setTimeout(() => {
      setAffect((a) => a.map((l, i) => (res[i] ? l : null)));
      setVerifs((v) => v.map((x) => (x ? true : null)));
    }, 1100);
  };

  const voirCorrection = () => {
    setAffect(jeu.paires.map((p) => p.label));
    setVerifs(Array(n).fill(true));
    setFini('corrige');
    setChoisi(null);
    onFini(etoilesEssais(essais, true));
  };

  return (
    <LayoutGroup>
      <div className="space-y-5">
        {!fini && (
          <p className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-navy">
            <MousePointerClick size={16} />
            {choisi ? `Touche le pictogramme « ${choisi} »` : 'Choisis un danger dans la réserve'}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 min-[520px]:grid-cols-3 md:grid-cols-4">
          {ordrePictos.map((i) => {
            const p = jeu.paires[i];
            const label = affect[i];
            const v = verifs[i];
            return (
              <motion.button
                key={p.image}
                type="button"
                onClick={() => toucherPicto(i)}
                whileTap={fini ? undefined : { scale: 0.97 }}
                animate={v === false ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                className={cx(
                  'flex flex-col items-center gap-2 rounded-2xl border-2 bg-white p-3 text-center shadow-soft transition-colors',
                  v === true && 'border-success bg-success/[0.06]',
                  v === false && 'border-danger bg-danger/[0.05]',
                  v === null &&
                    (choisi && !fini
                      ? 'border-dashed border-blue/50 hover:border-blue hover:bg-blue-light/40'
                      : 'border-line'),
                )}
                aria-label={label ? `Pictogramme associé à ${label}` : 'Pictogramme sans réponse'}
              >
                <img
                  src={p.image}
                  alt=""
                  className="h-20 w-auto object-contain sm:h-24"
                  draggable={false}
                />
                <div className="flex min-h-10 w-full items-center justify-center">
                  <AnimatePresence mode="popLayout">
                    {label ? (
                      <motion.span
                        layoutId={`etiquette-${label}`}
                        key={label}
                        className={cx(
                          'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold leading-tight',
                          v === true
                            ? 'bg-success text-white'
                            : v === false
                              ? 'bg-danger text-white'
                              : 'bg-navy text-white',
                        )}
                      >
                        {v === true && <Check size={12} strokeWidth={3} />}
                        {v === false && <X size={12} strokeWidth={3} />}
                        {label}
                      </motion.span>
                    ) : (
                      <span className="rounded-lg border border-dashed border-navy/20 px-3 py-1 text-xs text-muted">
                        ?
                      </span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>

        {!fini && (
          <div className="rounded-2xl bg-canvas p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Réserve</p>
            <div className="flex min-h-10 flex-wrap gap-2">
              {reserve.length === 0 && !choisi && (
                <span className="text-sm text-muted">Tout est placé : valide !</span>
              )}
              {reserve.map((l) => (
                <motion.button
                  layoutId={`etiquette-${l}`}
                  key={l}
                  type="button"
                  onClick={() => setChoisi((c) => (c === l ? null : l))}
                  whileTap={{ scale: 0.95 }}
                  className={cx(
                    'rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition-colors',
                    choisi === l
                      ? 'bg-sun text-navy-950 ring-2 ring-sun-dark'
                      : 'bg-white text-navy-950 hover:bg-blue-light',
                  )}
                >
                  {l}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {message && !fini && <Retour ok={false}>{message}</Retour>}
        {fini === 'gagne' && (
          <Retour ok>Parfait, tous les pictogrammes sont bien associés !</Retour>
        )}
        {fini === 'corrige' && <Retour ok>Voici les bonnes associations.</Retour>}

        {!fini && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="accent"
              size="lg"
              className="flex-1"
              onClick={valider}
              disabled={!toutPlace}
            >
              <Check size={18} /> Valider
            </Button>
            {essais >= 2 && (
              <Button variant="ghost" size="lg" onClick={voirCorrection}>
                <Eye size={17} /> Voir la correction
              </Button>
            )}
          </div>
        )}
      </div>
    </LayoutGroup>
  );
}
