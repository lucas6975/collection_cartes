import { Check, HelpCircle, Lightbulb, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState, type MouseEvent } from 'react';
import { MASCOTTE_URL } from '../../components/cards/CardBack';
import { cx } from '../../components/ui/primitives';
import { etoilesAnomalies } from '../logic';
import type { Jeu, ResultatJeu } from '../types';

type Props = { jeu: Extract<Jeu, { type: 'anomalies' }>; onFini: (r: ResultatJeu) => void };

interface Rate {
  id: number;
  x: number;
  y: number;
}

/**
 * Cherche et trouve : Ulysse raconte (contexte + consigne), on touche l'image.
 * Chaque erreur trouvée affiche une pastille numérotée, fait avancer la barre et explique
 * le bon réflexe. Quand il n'en reste qu'une, un indice est proposé.
 */
export function Anomalies({ jeu, onFini }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [trouvees, setTrouvees] = useState<string[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [nbRates, setNbRates] = useState(0);
  const [derniere, setDerniere] = useState<string | null>(null);
  const [indice, setIndice] = useState(false);
  const [fini, setFini] = useState<'gagne' | 'abandon' | null>(null);
  const total = jeu.anomalies.length;
  const restantes = jeu.anomalies.filter((a) => !trouvees.includes(a.id));

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
      setDerniere(meilleure.id);
      if (!trouvees.includes(meilleure.id)) {
        const next = [...trouvees, meilleure.id];
        setTrouvees(next);
        setIndice(false);
        if (next.length === total) {
          setFini('gagne');
          setTimeout(() => onFini(etoilesAnomalies(total, total, nbRates, false)), 1100);
        }
      }
      return;
    }
    const id = nbRates + 1;
    setRates((r) => [...r, { id, x, y }]);
    setNbRates(id);
    setTimeout(() => setRates((r) => r.filter((m) => m.id !== id)), 900);
  };

  const abandonner = () => {
    const n = trouvees.length;
    setFini('abandon');
    setTrouvees(jeu.anomalies.map((a) => a.id));
    onFini(etoilesAnomalies(n, total, nbRates, true));
  };

  const derniereA = jeu.anomalies.find((a) => a.id === derniere);
  const seule = restantes.length === 1 ? restantes[0] : null;

  return (
    <div className="mx-auto max-w-[520px] space-y-3">
      {/* Ulysse raconte : contexte et consigne */}
      <div className="flex items-end gap-2.5">
        <motion.img
          src={MASCOTTE_URL}
          alt="Ulysse"
          className="h-24 w-auto shrink-0 drop-shadow-[0_6px_10px_rgba(11,35,71,0.25)]"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 16 }}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="relative mb-2 flex-1 rounded-2xl rounded-bl-sm border border-line bg-white px-3.5 py-2.5 text-[13.5px] leading-snug text-ink/85 shadow-soft"
        >
          {jeu.contexte && (
            <p>
              <b className="text-navy-950">Contexte : </b>
              {jeu.contexte}
            </p>
          )}
          <p className={cx(jeu.contexte && 'mt-0.5')}>
            <b className="text-navy-950">Consigne : </b>
            {jeu.consigne}
          </p>
        </motion.div>
      </div>

      {/* La scène */}
      <div className="relative rounded-[22px] bg-[#15171C] p-1.5 shadow-lift">
        <span className="pointer-events-none absolute right-3.5 top-3.5 z-10 rounded-full bg-sun px-2.5 py-1 font-display text-xs font-extrabold text-navy-950 shadow">
          {trouvees.length} / {total}
        </span>
        <div
          ref={ref}
          onClick={toucher}
          className={cx(
            'relative w-full select-none overflow-hidden rounded-2xl',
            fini ? 'cursor-default' : 'cursor-crosshair',
          )}
          style={{ aspectRatio: jeu.ratio }}
          role="img"
          aria-label="Scène à inspecter : touche les erreurs"
        >
          <img
            src={jeu.image}
            alt=""
            className="absolute inset-0 size-full object-cover"
            draggable={false}
          />
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
                {fini === 'abandon' ? i + 1 : trouvees.indexOf(a.id) + 1}
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-success"
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 0.8 }}
                />
              </motion.span>
            );
          })}
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

      {/* Barre de progression */}
      <div className="flex gap-1.5" aria-label={`${trouvees.length} erreurs trouvées sur ${total}`}>
        {jeu.anomalies.map((a, i) => (
          <span
            key={a.id}
            className={cx(
              'h-2 flex-1 rounded-full transition-colors duration-500',
              i < trouvees.length ? 'bg-success' : 'bg-line',
            )}
          />
        ))}
      </div>

      {/* Explication de la dernière erreur trouvée */}
      <AnimatePresence mode="wait">
        {!fini && derniereA && (
          <motion.div
            key={derniereA.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 rounded-2xl border border-success/25 bg-success/[0.08] px-3.5 py-2.5 text-[13px] leading-snug text-[#14532D]"
          >
            <span className="text-xl leading-none">{derniereA.emoji ?? '✅'}</span>
            <span>
              <b className="block font-display text-[14px]">{derniereA.label}</b>
              {derniereA.explication}
              {seule && ' Plus qu’une erreur !'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {!fini && trouvees.length === 0 && (
        <p className="text-center text-sm font-semibold text-navy">
          👆 Touche l’image là où tu vois une erreur
        </p>
      )}

      {/* Indice pour la dernière */}
      {!fini && seule?.indice && (
        <div className="flex justify-center">
          {indice ? (
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 rounded-full bg-sun/20 px-4 py-2 text-sm font-semibold text-navy-950"
            >
              <Lightbulb size={16} className="text-sun-dark" /> {seule.indice}
            </motion.p>
          ) : (
            <button
              type="button"
              onClick={() => setIndice(true)}
              className="inline-flex items-center gap-2 rounded-full bg-sun/20 px-4 py-2 text-sm font-bold text-navy-950 hover:bg-sun/30"
            >
              <Lightbulb size={16} className="text-sun-dark" /> Un indice ?
            </button>
          )}
        </div>
      )}

      {/* Récapitulatif à la fin */}
      {fini && (
        <motion.ul
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white"
        >
          {jeu.anomalies.map((a, i) => (
            <li key={a.id} className="flex items-start gap-3 px-3.5 py-2.5 text-[13px]">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-success text-[11px] font-bold text-white">
                {fini === 'abandon' ? i + 1 : <Check size={13} strokeWidth={3} />}
              </span>
              <span className="leading-snug">
                <b className="text-navy-950">
                  {a.emoji} {a.label}
                </b>
                {a.explication && <span className="block text-muted">{a.explication}</span>}
              </span>
            </li>
          ))}
        </motion.ul>
      )}

      {!fini && nbRates >= 3 && (
        <button
          type="button"
          onClick={abandonner}
          className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy"
        >
          <HelpCircle size={14} /> Je donne ma langue au chat
        </button>
      )}
    </div>
  );
}
