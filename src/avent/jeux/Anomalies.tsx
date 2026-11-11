import { Camera, Check, HelpCircle, Search, Star, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState, type MouseEvent } from 'react';
import { MASCOTTE_URL } from '../../components/cards/CardBack';
import { Button, cx } from '../../components/ui/primitives';
import { etoilesAnomalies } from '../logic';
import type { Jeu, ResultatJeu } from '../types';

type Props = { jeu: Extract<Jeu, { type: 'anomalies' }>; onFini: (r: ResultatJeu) => void };

interface Rate {
  id: number;
  x: number;
  y: number;
}

export function Anomalies({ jeu, onFini }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [trouvees, setTrouvees] = useState<string[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [nbRates, setNbRates] = useState(0);
  const [derniere, setDerniere] = useState<string | null>(null);
  const [fini, setFini] = useState(false);
  const total = jeu.anomalies.length;

  const toucher = (e: MouseEvent<HTMLDivElement>) => {
    if (fini || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    // Distance en pourcentage de la largeur, en tenant compte des proportions de l'image.
    const dist = (c: { x: number; y: number }) =>
      Math.hypot(x - c.x, (y - c.y) * (rect.height / rect.width));
    let meilleure: { id: string; d: number } | null = null;
    for (const a of jeu.anomalies) {
      for (const c of a.cibles) {
        const d = dist(c);
        if (d <= c.r && (!meilleure || d < meilleure.d)) meilleure = { id: a.id, d };
      }
    }
    if (meilleure) {
      if (!trouvees.includes(meilleure.id)) {
        const next = [...trouvees, meilleure.id];
        setTrouvees(next);
        setDerniere(meilleure.id);
        if (next.length === total) {
          setFini(true);
          setTimeout(() => onFini(etoilesAnomalies(total, total, nbRates, false)), 900);
        }
      } else {
        setDerniere(meilleure.id);
      }
      return;
    }
    const id = Date.now();
    setRates((r) => [...r, { id, x, y }]);
    setNbRates((n) => n + 1);
    setTimeout(() => setRates((r) => r.filter((m) => m.id !== id)), 900);
  };

  const abandonner = () => {
    setFini(true);
    const n = trouvees.length;
    setTrouvees(jeu.anomalies.map((a) => a.id));
    onFini(etoilesAnomalies(n, total, nbRates, true));
  };

  const labelDerniere = jeu.anomalies.find((a) => a.id === derniere)?.label;

  return (
    <div className="space-y-5">
      <Briefing jeu={jeu} total={total} />
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
        <div>
          <div className="relative mx-auto w-full max-w-[480px] rounded-[22px] bg-[#15171C] p-2 shadow-lift">
            {/* Viseur d'inspection */}
            {[
              'left-0 top-0 border-l-4 border-t-4 rounded-tl-[22px]',
              'right-0 top-0 border-r-4 border-t-4 rounded-tr-[22px]',
              'left-0 bottom-0 border-b-4 border-l-4 rounded-bl-[22px]',
              'right-0 bottom-0 border-b-4 border-r-4 rounded-br-[22px]',
            ].map((c) => (
              <span
                key={c}
                className={cx('pointer-events-none absolute z-10 size-10 border-sun', c)}
              />
            ))}
            <span className="pointer-events-none absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
              <Camera size={12} /> Scène à inspecter
            </span>
            <span className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-sun px-2.5 py-1 font-display text-xs font-extrabold text-navy-950 shadow">
              {trouvees.length}/{total}
            </span>
            <div
              ref={ref}
              onClick={toucher}
              className={cx(
                'relative w-full cursor-crosshair select-none overflow-hidden rounded-2xl',
                fini && 'cursor-default',
              )}
              style={{ aspectRatio: jeu.ratio }}
              role="img"
              aria-label="Image de la scène : touche les erreurs"
            >
              <img
                src={jeu.image}
                alt=""
                className="absolute inset-0 size-full object-cover"
                draggable={false}
              />
              {/* Repères des anomalies trouvées */}
              {jeu.anomalies.map((a, i) => {
                if (!trouvees.includes(a.id)) return null;
                const c = a.cibles[0];
                return (
                  <motion.span
                    key={a.id}
                    className="absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white bg-success font-display text-sm font-extrabold text-white shadow-lg"
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.35, 1] }}
                    transition={{ duration: 0.45 }}
                  >
                    {i + 1}
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-success"
                      initial={{ scale: 1, opacity: 0.9 }}
                      animate={{ scale: 2.4, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                    />
                  </motion.span>
                );
              })}
              {/* Touches à côté */}
              <AnimatePresence>
                {rates.map((r) => (
                  <motion.span
                    key={r.id}
                    className="absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-danger/85 text-white"
                    style={{ left: `${r.x}%`, top: `${r.y}%` }}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: [0, -12, 12, 0] }}
                    exit={{ scale: 0.6, opacity: 0 }}
                  >
                    <X size={16} strokeWidth={3} />
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {labelDerniere && !fini && (
              <motion.p
                key={derniere}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mx-auto mt-3 max-w-[480px] rounded-xl bg-success/10 px-4 py-2.5 text-center text-sm font-semibold text-success"
              >
                Bien vu : {labelDerniere}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-display text-lg font-extrabold text-navy-950">
              <Search size={18} className="text-blue" /> {trouvees.length}/{total} trouvées
            </p>
            {nbRates > 0 && (
              <span className="text-xs font-medium text-muted">{nbRates} à côté</span>
            )}
          </div>
          <ol className="space-y-2">
            {jeu.anomalies.map((a, i) => {
              const ok = trouvees.includes(a.id);
              return (
                <li
                  key={a.id}
                  className={cx(
                    'flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors',
                    ok
                      ? 'border-success/30 bg-success/[0.07] text-navy-950'
                      : 'border-dashed border-navy/15 text-muted',
                  )}
                >
                  <span
                    className={cx(
                      'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                      ok ? 'bg-success text-white' : 'bg-navy/[0.06] text-navy/40',
                    )}
                  >
                    {ok ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </span>
                  {ok ? a.label : 'Anomalie à trouver…'}
                </li>
              );
            })}
          </ol>
          {!fini && (
            <Button variant="ghost" size="sm" onClick={abandonner} className="w-full">
              <HelpCircle size={16} /> Je donne ma langue au chat
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Ulysse présente la mission : titre, consigne et règle des étoiles. */
function Briefing({ jeu, total }: { jeu: Props['jeu']; total: number }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#173A6B] to-[#0B1F3F] text-white shadow-lift">
      <div
        className="h-2"
        style={{
          background: 'repeating-linear-gradient(135deg, #F5C542 0 12px, #15171C 12px 24px)',
        }}
      />
      <div className="flex items-end gap-3 px-4 pt-4 sm:gap-5 sm:px-6">
        <motion.img
          src={MASCOTTE_URL}
          alt="Ulysse"
          className="-mb-1 h-32 w-auto shrink-0 self-end drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)] sm:h-40"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 140, damping: 14 }}
        />
        <div className="min-w-0 pb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sun">
            Mission du jour
          </p>
          {jeu.mission && (
            <p className="mt-0.5 font-display text-xl font-extrabold leading-tight sm:text-2xl">
              {jeu.mission}
            </p>
          )}
          <p className="relative mt-2 rounded-2xl rounded-bl-sm bg-white/10 px-3.5 py-2.5 text-[14px] italic leading-relaxed text-white/90">
            « {jeu.consigne} »
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-white/10 bg-black/15 px-4 py-3 text-xs font-semibold sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
          <Search size={13} /> {total} anomalies à trouver
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
          👆 Touche l’image
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
          <Star size={13} className="fill-sun text-sun" /> 3 étoiles : 2 erreurs max
        </span>
      </div>
    </div>
  );
}
