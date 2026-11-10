import { AlertOctagon, ArrowRight, Check, Clapperboard, FileText, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Button, cx } from '../../components/ui/primitives';
import { etoilesScore } from '../logic';
import type { Jeu, ResultatJeu } from '../types';
import { Retour } from '../ui';

/**
 * Moteur commun aux jeux « une question, un bon choix, une explication » :
 * l'intrus, les scènes chocs et l'erreur dans la consigne.
 */
function useSerie(total: number, onFini: (r: ResultatJeu) => void) {
  const [index, setIndex] = useState(0);
  const [choix, setChoix] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [bonnes, setBonnes] = useState<boolean[]>([]);
  const choisi = choix[index];
  const dernier = index === total - 1;

  const choisir = (i: number, correct: boolean) => {
    if (choisi !== null) return;
    setChoix((c) => c.map((v, k) => (k === index ? i : v)));
    const b = [...bonnes, correct];
    setBonnes(b);
    if (b.length === total)
      setTimeout(() => onFini(etoilesScore(b.filter(Boolean).length, total)), 600);
  };
  return { index, choisi, dernier, bonnes, choisir, suivant: () => setIndex((i) => i + 1) };
}

function Progression({
  total,
  bonnes,
  index,
}: {
  total: number;
  bonnes: boolean[];
  index: number;
}) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cx(
            'h-2 flex-1 rounded-full transition-colors',
            i < bonnes.length
              ? bonnes[i]
                ? 'bg-success'
                : 'bg-danger'
              : i === index
                ? 'bg-sun'
                : 'bg-navy/10',
          )}
        />
      ))}
    </div>
  );
}

function Pied({
  montrer,
  dernier,
  onSuivant,
  total,
  bonnes,
}: {
  montrer: boolean;
  dernier: boolean;
  onSuivant: () => void;
  total: number;
  bonnes: boolean[];
}) {
  if (!montrer) return null;
  if (dernier)
    return (
      <p className="text-center font-display text-lg font-extrabold text-navy-950">
        Score : {bonnes.filter(Boolean).length}/{total}
      </p>
    );
  return (
    <div className="flex justify-end">
      <Button size="lg" onClick={onSuivant}>
        Suivant <ArrowRight size={18} />
      </Button>
    </div>
  );
}

function Etape({ k, children }: { k: number; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={k}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ───────────── Trouve l'intrus ─────────────

export function Intrus({
  jeu,
  onFini,
}: {
  jeu: Extract<Jeu, { type: 'intrus' }>;
  onFini: (r: ResultatJeu) => void;
}) {
  const s = useSerie(jeu.series.length, onFini);
  const serie = jeu.series[s.index];
  return (
    <div className="space-y-4">
      <Progression total={jeu.series.length} bonnes={s.bonnes} index={s.index} />
      <Etape k={s.index}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Série {s.index + 1} / {jeu.series.length} · lequel n’a rien à faire là ?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {serie.elements.map((el, i) => {
            const etat =
              s.choisi === null
                ? 'idle'
                : i === serie.intrus
                  ? 'intrus'
                  : i === s.choisi
                    ? 'ko'
                    : 'dim';
            return (
              <motion.button
                key={el}
                type="button"
                onClick={() => s.choisir(i, i === serie.intrus)}
                disabled={s.choisi !== null}
                whileHover={s.choisi === null ? { y: -3, rotate: i % 2 ? 1 : -1 } : undefined}
                whileTap={s.choisi === null ? { scale: 0.96 } : undefined}
                animate={
                  etat === 'intrus' && s.choisi === i
                    ? { scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }
                    : etat === 'ko'
                      ? { x: [0, -6, 6, -3, 3, 0] }
                      : {}
                }
                className={cx(
                  'relative flex min-h-24 items-center justify-center rounded-2xl border-2 p-3 text-center font-display text-[15px] font-extrabold leading-snug shadow-soft transition-colors sm:min-h-28 sm:text-base',
                  etat === 'idle' && 'border-line bg-white text-navy-950 hover:border-blue/50',
                  etat === 'intrus' && 'border-success bg-success/[0.08] text-navy-950',
                  etat === 'ko' && 'border-danger bg-danger/[0.07] text-navy-950',
                  etat === 'dim' && 'border-line bg-white text-navy-950/45',
                )}
              >
                {etat === 'intrus' && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
                    Intrus
                  </span>
                )}
                {el}
              </motion.button>
            );
          })}
        </div>
        {s.choisi !== null && (
          <Retour ok={s.choisi === serie.intrus}>
            {s.choisi === serie.intrus
              ? 'Bien vu ! '
              : `Raté, l’intrus était « ${serie.elements[serie.intrus]} ». `}
            <span className="font-normal text-ink/80">{serie.explication}</span>
          </Retour>
        )}
      </Etape>
      <Pied
        montrer={s.choisi !== null}
        dernier={s.dernier}
        onSuivant={s.suivant}
        total={jeu.series.length}
        bonnes={s.bonnes}
      />
    </div>
  );
}

// ───────────── Scènes chocs ─────────────

export function Scenes({
  jeu,
  onFini,
}: {
  jeu: Extract<Jeu, { type: 'scenes' }>;
  onFini: (r: ResultatJeu) => void;
}) {
  const s = useSerie(jeu.scenes.length, onFini);
  const scene = jeu.scenes[s.index];
  const option = s.choisi !== null ? scene.options[s.choisi] : null;
  return (
    <div className="space-y-4">
      <Progression total={jeu.scenes.length} bonnes={s.bonnes} index={s.index} />
      <Etape k={s.index}>
        <motion.div
          className="relative overflow-hidden rounded-2xl bg-[#15171C] p-5 text-white"
          initial={{ scale: 0.97 }}
          animate={{ scale: 1 }}
        >
          <div
            className="absolute inset-x-0 top-0 h-1.5"
            style={{
              background: 'repeating-linear-gradient(135deg, #F5C542 0 10px, #15171C 10px 20px)',
            }}
          />
          <motion.span
            className="inline-flex items-center gap-1.5 rounded-full bg-danger px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider"
            animate={{ opacity: [1, 0.55, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <Clapperboard size={12} /> Scène {s.index + 1}
          </motion.span>
          <p className="mt-3 font-display text-lg font-extrabold leading-snug sm:text-xl">
            {scene.situation}
          </p>
          <p className="mt-2 text-sm font-semibold text-sun">Que fais-tu ?</p>
        </motion.div>
        <div className="grid gap-2.5">
          {scene.options.map((o, i) => {
            const etat =
              s.choisi === null ? 'idle' : o.correct ? 'ok' : i === s.choisi ? 'ko' : 'dim';
            return (
              <button
                key={o.texte}
                type="button"
                onClick={() => s.choisir(i, o.correct)}
                disabled={s.choisi !== null}
                className={cx(
                  'flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-semibold transition-all',
                  etat === 'idle' &&
                    'border-line bg-white text-navy-950 hover:-translate-y-0.5 hover:border-blue/50 hover:shadow-soft',
                  etat === 'ok' && 'border-success bg-success/[0.08] text-navy-950',
                  etat === 'ko' && 'border-danger bg-danger/[0.07] text-navy-950',
                  etat === 'dim' && 'border-line bg-white text-navy-950/45',
                )}
              >
                {etat === 'ok' ? (
                  <Check size={18} className="shrink-0 text-success" />
                ) : etat === 'ko' ? (
                  <X size={18} className="shrink-0 text-danger" />
                ) : (
                  <span className="size-[18px] shrink-0 rounded-full border-2 border-navy/20" />
                )}
                {o.texte}
              </button>
            );
          })}
        </div>
        {option && (
          <Retour ok={option.correct}>
            <span className="flex items-start gap-2">
              {!option.correct && <AlertOctagon size={18} className="mt-0.5 shrink-0" />}
              <span>
                <strong>{option.correct ? 'Bon réflexe ! ' : 'Danger ! '}</strong>
                <span className="font-normal text-ink/80">{option.consequence}</span>
              </span>
            </span>
          </Retour>
        )}
      </Etape>
      <Pied
        montrer={s.choisi !== null}
        dernier={s.dernier}
        onSuivant={s.suivant}
        total={jeu.scenes.length}
        bonnes={s.bonnes}
      />
    </div>
  );
}

// ───────────── Trouve l'erreur dans la consigne ─────────────

export function Erreur({
  jeu,
  onFini,
}: {
  jeu: Extract<Jeu, { type: 'erreur' }>;
  onFini: (r: ResultatJeu) => void;
}) {
  const s = useSerie(jeu.consignes.length, onFini);
  const c = jeu.consignes[s.index];
  return (
    <div className="space-y-4">
      <Progression total={jeu.consignes.length} bonnes={s.bonnes} index={s.index} />
      <Etape k={s.index}>
        {/* Une fiche consigne, comme celles affichées dans l'atelier */}
        <div className="overflow-hidden rounded-2xl border border-line bg-[#FFFDF5] shadow-soft">
          <div className="flex items-center gap-2 border-b border-dashed border-navy/15 bg-sun/20 px-4 py-2.5">
            <FileText size={16} className="text-navy" />
            <p className="font-display text-sm font-extrabold uppercase tracking-wide text-navy-950">
              Consigne · {c.titre}
            </p>
          </div>
          <ol className="divide-y divide-dashed divide-navy/10">
            {c.phrases.map((ph, i) => {
              const etat =
                s.choisi === null
                  ? 'idle'
                  : i === c.erreur
                    ? 'erreur'
                    : i === s.choisi
                      ? 'ko'
                      : 'ok';
              return (
                <li key={ph}>
                  <motion.button
                    type="button"
                    onClick={() => s.choisir(i, i === c.erreur)}
                    disabled={s.choisi !== null}
                    animate={etat === 'erreur' && s.choisi === i ? { x: [0, 4, -4, 0] } : {}}
                    className={cx(
                      'flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] transition-colors',
                      etat === 'idle' && 'text-navy-950 hover:bg-blue-light/50',
                      etat === 'erreur' &&
                        'bg-danger/[0.08] font-semibold text-danger line-through decoration-2',
                      etat === 'ko' && 'bg-navy/[0.04] text-navy-950',
                      etat === 'ok' && 'text-navy-950/70',
                    )}
                  >
                    <span
                      className={cx(
                        'grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold',
                        etat === 'erreur' ? 'bg-danger text-white' : 'bg-navy/10 text-navy',
                      )}
                    >
                      {etat === 'erreur' ? <X size={13} strokeWidth={3} /> : i + 1}
                    </span>
                    {ph}
                  </motion.button>
                </li>
              );
            })}
          </ol>
        </div>
        {s.choisi === null && (
          <p className="text-center text-sm font-medium text-muted">
            Touche la phrase qui contient l’erreur.
          </p>
        )}
        {s.choisi !== null && (
          <Retour ok={s.choisi === c.erreur}>
            {s.choisi === c.erreur ? 'Bien vu ! ' : 'Ce n’était pas celle-là. '}
            <span className="font-normal text-ink/80">{c.explication}</span>
          </Retour>
        )}
      </Etape>
      <Pied
        montrer={s.choisi !== null}
        dernier={s.dernier}
        onSuivant={s.suivant}
        total={jeu.consignes.length}
        bonnes={s.bonnes}
      />
    </div>
  );
}
