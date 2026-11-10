import { Check, Inbox, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { cx } from '../../components/ui/primitives';
import { etoilesScore, melanger } from '../logic';
import type { Jeu, ResultatJeu } from '../types';

type Props = {
  jeu: Extract<Jeu, { type: 'tri' }>;
  graine: number;
  onFini: (r: ResultatJeu) => void;
};

const COULEURS = ['#2563A6', '#C49A62'];

export function Tri({ jeu, graine, onFini }: Props) {
  const [ordre] = useState(() => melanger(jeu.elements, graine));
  const [index, setIndex] = useState(0);
  const [reponses, setReponses] = useState<{ ok: boolean; bac: 0 | 1 }[]>([]);
  const [retour, setRetour] = useState<{ ok: boolean; bac: 0 | 1 } | null>(null);
  const fini = index >= ordre.length;
  const el = ordre[index];
  const dansBac = (b: 0 | 1) => reponses.filter((_, i) => ordre[i].bac === b).length;

  const ranger = (bac: 0 | 1) => {
    if (fini || retour) return;
    const ok = el.bac === bac;
    setRetour({ ok, bac });
    setTimeout(
      () => {
        const next = [...reponses, { ok, bac }];
        setReponses(next);
        setRetour(null);
        setIndex((i) => i + 1);
        if (next.length === ordre.length)
          onFini(etoilesScore(next.filter((r) => r.ok).length, ordre.length));
      },
      ok ? 900 : 2600,
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-1.5">
        {ordre.map((_, i) => (
          <span
            key={i}
            className={cx(
              'h-2 w-6 rounded-full',
              i < reponses.length
                ? reponses[i].ok
                  ? 'bg-success'
                  : 'bg-danger'
                : i === index
                  ? 'bg-sun'
                  : 'bg-navy/10',
            )}
          />
        ))}
      </div>

      {/* Élément à ranger */}
      <div className="relative mx-auto flex min-h-40 max-w-sm items-center justify-center">
        <AnimatePresence mode="wait">
          {!fini && (
            <motion.div
              key={index}
              initial={{ y: -30, opacity: 0, scale: 0.9, rotate: -3 }}
              animate={
                retour?.ok
                  ? {
                      x: retour.bac === 0 ? -140 : 140,
                      y: 120,
                      scale: 0.4,
                      opacity: 0,
                      rotate: retour.bac === 0 ? -20 : 20,
                    }
                  : { y: 0, opacity: 1, scale: 1, rotate: 0, x: retour ? [0, -8, 8, -5, 5, 0] : 0 }
              }
              exit={{ opacity: 0 }}
              transition={{ duration: retour?.ok ? 0.6 : 0.35 }}
              className={cx(
                'w-full rounded-3xl border-2 bg-white p-5 text-center shadow-lift',
                retour && !retour.ok ? 'border-danger' : 'border-line',
              )}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {index + 1} / {ordre.length}
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-navy-950">{el.texte}</p>
              {retour && !retour.ok && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-sm font-medium text-danger"
                >
                  Non : {jeu.bacs[el.bac].toLowerCase()}.{' '}
                  <span className="text-ink/75">{el.explication}</span>
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {fini && (
          <p className="font-display text-xl font-extrabold text-navy-950">
            Score : {reponses.filter((r) => r.ok).length}/{ordre.length}
          </p>
        )}
      </div>

      {/* Les deux bacs */}
      <div className="grid grid-cols-2 gap-3">
        {jeu.bacs.map((b, i) => (
          <motion.button
            key={b}
            type="button"
            onClick={() => ranger(i as 0 | 1)}
            disabled={fini || !!retour}
            whileTap={{ scale: 0.95 }}
            animate={retour?.ok && retour.bac === i ? { scale: [1, 1.08, 1] } : {}}
            className="relative flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-3xl p-3 text-white shadow-md disabled:cursor-default"
            style={{ background: `linear-gradient(160deg, ${COULEURS[i]}, ${COULEURS[i]}CC)` }}
          >
            <Inbox size={26} />
            <span className="font-display text-[15px] font-extrabold leading-tight">{b}</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
              {dansBac(i as 0 | 1)}
            </span>
          </motion.button>
        ))}
      </div>

      {fini && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {ordre.map((e, i) => (
            <li
              key={e.texte}
              className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm"
            >
              {reponses[i]?.ok ? (
                <Check size={15} className="shrink-0 text-success" />
              ) : (
                <X size={15} className="shrink-0 text-danger" />
              )}
              <span className="font-semibold text-navy-950">{e.texte}</span>
              <span className="ml-auto text-xs text-muted">{jeu.bacs[e.bac]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
