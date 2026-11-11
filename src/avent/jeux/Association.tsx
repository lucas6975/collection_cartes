import { Check, Eye, Hand } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState, type PointerEvent as PE } from 'react';
import { createPortal } from 'react-dom';
import { Button, cx } from '../../components/ui/primitives';
import { melanger } from '../logic';
import type { Jeu, ResultatJeu } from '../types';
import { Retour } from '../ui';

type Props = {
  jeu: Extract<Jeu, { type: 'association' }>;
  graine: number;
  onFini: (r: ResultatJeu) => void;
};

/** Étoiles selon le nombre de pictogrammes posés au mauvais endroit. */
export function etoilesGlisser(erreurs: number, abandon: boolean): ResultatJeu {
  if (abandon) return { etoiles: 0, resume: 'Correction affichée' };
  const etoiles = erreurs <= 1 ? 3 : erreurs <= 3 ? 2 : 1;
  return {
    etoiles,
    resume: erreurs === 0 ? 'Sans aucune erreur !' : `${erreurs} erreur${erreurs > 1 ? 's' : ''}`,
  };
}

interface Glisse {
  picto: number;
  x: number;
  y: number;
  /** Décalage entre le doigt et le coin du pictogramme. */
  dx: number;
  dy: number;
  departX: number;
  departY: number;
  bouge: boolean;
}

/**
 * Glisser-déposer : on attrape un pictogramme et on le pose sur le danger qui lui correspond.
 * Fonctionne au doigt comme à la souris. Toucher un pictogramme puis un danger marche aussi.
 */
export function Association({ jeu, graine, onFini }: Props) {
  const n = jeu.paires.length;
  const [ordrePictos] = useState(() => melanger([...Array(n).keys()], graine));
  const [ordreDangers] = useState(() => melanger([...Array(n).keys()], graine + 17));
  const [places, setPlaces] = useState<boolean[]>(() => Array(n).fill(false));
  const [erreurs, setErreurs] = useState(0);
  const [glisse, setGlisse] = useState<Glisse | null>(null);
  const [survol, setSurvol] = useState<number | null>(null);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [rate, setRate] = useState<{ danger: number; picto: number; cle: number } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [fini, setFini] = useState<'gagne' | 'corrige' | null>(null);
  const cases = useRef<(HTMLDivElement | null)[]>([]);

  const restants = ordrePictos.filter((i) => !places[i]);

  const caseSous = (x: number, y: number): number | null => {
    for (const d of ordreDangers) {
      if (places[d]) continue;
      const r = cases.current[d]?.getBoundingClientRect();
      if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return d;
    }
    return null;
  };

  const poser = (picto: number, danger: number) => {
    setChoisi(null);
    if (picto === danger) {
      const next = places.map((v, i) => (i === picto ? true : v));
      setPlaces(next);
      setMessage({ ok: true, texte: `Bien vu : ${jeu.paires[danger].label}` });
      if (next.every(Boolean)) {
        setFini('gagne');
        setTimeout(() => onFini(etoilesGlisser(erreurs, false)), 600);
      }
    } else {
      setErreurs((e) => e + 1);
      setRate({ danger, picto, cle: erreurs + 1 });
      setMessage({ ok: false, texte: 'Pas ici ! Ce pictogramme annonce un autre danger.' });
    }
  };

  // ───── Glisser au doigt ou à la souris ─────
  const debut = (e: PE<HTMLButtonElement>, picto: number) => {
    if (fini) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    setGlisse({
      picto,
      x: e.clientX,
      y: e.clientY,
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
      departX: e.clientX,
      departY: e.clientY,
      bouge: false,
    });
  };

  const deplacer = (e: PE<HTMLButtonElement>) => {
    if (!glisse) return;
    const bouge =
      glisse.bouge || Math.hypot(e.clientX - glisse.departX, e.clientY - glisse.departY) > 8;
    setGlisse({ ...glisse, x: e.clientX, y: e.clientY, bouge });
    if (bouge) {
      setSurvol(caseSous(e.clientX, e.clientY));
      // Fait défiler la page quand on approche du haut ou du bas de l'écran.
      if (e.clientY > window.innerHeight - 140) window.scrollBy(0, 14);
      else if (e.clientY < 150) window.scrollBy(0, -14);
    }
  };

  const fin = (e: PE<HTMLButtonElement>) => {
    if (!glisse) return;
    const g = glisse;
    setGlisse(null);
    setSurvol(null);
    if (!g.bouge) {
      // Simple toucher : on sélectionne le pictogramme, puis on touche un danger.
      setChoisi((c) => (c === g.picto ? null : g.picto));
      setMessage(null);
      return;
    }
    const d = caseSous(e.clientX, e.clientY);
    if (d !== null) poser(g.picto, d);
  };

  const voirCorrection = () => {
    setPlaces(Array(n).fill(true));
    setFini('corrige');
    setChoisi(null);
    onFini(etoilesGlisser(erreurs, true));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg font-extrabold text-navy-950">
          {places.filter(Boolean).length} / {n} placés
        </p>
        <p className="text-xs font-semibold text-muted">
          {erreurs > 0 ? `${erreurs} erreur${erreurs > 1 ? 's' : ''} · ` : ''}3 étoiles : 1 erreur
          max
        </p>
      </div>

      {/* Réserve de pictogrammes (reste visible en faisant défiler) */}
      {!fini && (
        <div className="sticky top-[4.5rem] z-20 rounded-2xl border border-dashed border-navy/20 bg-white/95 p-3 shadow-soft backdrop-blur">
          <p className="mb-2 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-navy">
            <Hand size={14} />
            {choisi !== null
              ? 'Touche maintenant le bon danger'
              : 'Glisse chaque pictogramme sur le bon danger'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <AnimatePresence>
              {restants.map((i) => {
                const enMain = glisse?.picto === i && glisse.bouge;
                return (
                  <motion.button
                    key={jeu.paires[i].image}
                    type="button"
                    layout
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={
                      rate?.picto === i
                        ? { scale: 1, opacity: 1, x: [0, -7, 7, -5, 5, 0] }
                        : { scale: 1, opacity: enMain ? 0.25 : 1 }
                    }
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    onPointerDown={(e) => debut(e, i)}
                    onPointerMove={deplacer}
                    onPointerUp={fin}
                    onPointerCancel={() => {
                      setGlisse(null);
                      setSurvol(null);
                    }}
                    className={cx(
                      'grid size-[68px] cursor-grab touch-none select-none place-items-center rounded-2xl border-2 bg-white shadow-soft active:cursor-grabbing',
                      choisi === i ? 'border-sun ring-4 ring-sun/35' : 'border-line',
                    )}
                    aria-label={`Pictogramme ${ordrePictos.indexOf(i) + 1}`}
                    aria-pressed={choisi === i}
                  >
                    <img
                      src={jeu.paires[i].image}
                      alt=""
                      draggable={false}
                      className="pointer-events-none h-12 w-auto"
                    />
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Les dangers : cases où poser les pictogrammes */}
      <div className="grid gap-2 sm:grid-cols-2">
        {ordreDangers.map((d) => {
          const ok = places[d];
          const vise = survol === d;
          const erreur = rate?.danger === d;
          return (
            <motion.div
              key={`${d}-${erreur ? rate.cle : 0}`}
              ref={(el) => {
                cases.current[d] = el;
              }}
              onClick={() => choisi !== null && !ok && poser(choisi, d)}
              animate={erreur ? { x: [0, -8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={cx(
                'flex min-h-[64px] items-center gap-3 rounded-2xl border-2 p-2 pr-3 text-sm font-bold text-navy-950 transition-colors',
                ok
                  ? 'border-success bg-success/[0.07]'
                  : vise
                    ? 'border-sun bg-sun/15 ring-4 ring-sun/30'
                    : erreur
                      ? 'border-danger/60 bg-danger/[0.05]'
                      : choisi !== null
                        ? 'cursor-pointer border-dashed border-blue/40 bg-white'
                        : 'border-line bg-white',
              )}
            >
              <span
                className={cx(
                  'grid size-12 shrink-0 place-items-center rounded-xl',
                  ok ? 'bg-white' : 'border-2 border-dashed border-navy/20 bg-canvas',
                )}
              >
                <AnimatePresence>
                  {ok && (
                    <motion.img
                      src={jeu.paires[d].image}
                      alt=""
                      className="h-10 w-auto"
                      initial={{ scale: 1.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    />
                  )}
                </AnimatePresence>
              </span>
              <span className="flex-1 leading-tight">{jeu.paires[d].label}</span>
              {ok ? (
                <Check size={18} strokeWidth={3} className="shrink-0 text-success" />
              ) : vise ? (
                <span className="shrink-0 text-[11px] font-bold text-sun-dark">Lâche ici</span>
              ) : null}
            </motion.div>
          );
        })}
      </div>

      {message && !fini && <Retour ok={message.ok}>{message.texte}</Retour>}
      {fini === 'gagne' && (
        <Retour ok>Parfait, tous les pictogrammes sont à la bonne place !</Retour>
      )}
      {fini === 'corrige' && <Retour ok>Voici les bonnes associations.</Retour>}

      {!fini && erreurs >= 4 && (
        <Button variant="ghost" size="lg" className="w-full" onClick={voirCorrection}>
          <Eye size={17} /> Voir la correction
        </Button>
      )}

      {/* Le pictogramme qui suit le doigt */}
      {glisse?.bouge &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[90] grid size-[76px] place-items-center rounded-2xl border-2 border-sun bg-white shadow-[0_16px_32px_rgba(11,35,71,0.3)]"
            style={{
              left: glisse.x - glisse.dx,
              top: glisse.y - glisse.dy,
              transform: 'rotate(-6deg) scale(1.08)',
            }}
          >
            <img src={jeu.paires[glisse.picto].image} alt="" className="h-14 w-auto" />
          </div>,
          document.body,
        )}
    </div>
  );
}
