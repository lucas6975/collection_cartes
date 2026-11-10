import { Brain, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { cx } from '../../components/ui/primitives';
import { melanger } from '../logic';
import type { Jeu, ResultatJeu } from '../types';
import { Retour } from '../ui';

type Props = {
  jeu: Extract<Jeu, { type: 'memory' }>;
  graine: number;
  onFini: (r: ResultatJeu) => void;
};

interface Carte {
  id: string;
  paire: number;
  face: 'equipement' | 'risque';
}

const AVATAR = `${import.meta.env.BASE_URL}ulysse-avatar.webp`;

export function etoilesMemory(coups: number, paires: number): ResultatJeu {
  return {
    etoiles: coups <= paires + 3 ? 3 : coups <= paires + 7 ? 2 : 1,
    resume: `Toutes les paires trouvées en ${coups} coups`,
  };
}

export function Memory({ jeu, graine, onFini }: Props) {
  const [cartes] = useState<Carte[]>(() =>
    melanger(
      jeu.paires.flatMap((_, i) => [
        { id: `${i}-e`, paire: i, face: 'equipement' as const },
        { id: `${i}-r`, paire: i, face: 'risque' as const },
      ]),
      graine,
    ),
  );
  const [retournees, setRetournees] = useState<number[]>([]);
  const [trouvees, setTrouvees] = useState<number[]>([]);
  const [coups, setCoups] = useState(0);
  const [rate, setRate] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const fini = trouvees.length === jeu.paires.length;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const toucher = (i: number) => {
    if (
      fini ||
      retournees.length === 2 ||
      retournees.includes(i) ||
      trouvees.includes(cartes[i].paire)
    )
      return;
    const next = [...retournees, i];
    setRetournees(next);
    if (next.length < 2) return;
    const n = coups + 1;
    setCoups(n);
    const [a, b] = next.map((k) => cartes[k]);
    if (a.paire === b.paire) {
      const t = [...trouvees, a.paire];
      setTrouvees(t);
      setRetournees([]);
      if (t.length === jeu.paires.length) onFini(etoilesMemory(n, jeu.paires.length));
    } else {
      setRate(true);
      timer.current = window.setTimeout(() => {
        setRetournees([]);
        setRate(false);
      }, 950);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-semibold text-navy-950">
        <span className="flex items-center gap-1.5">
          <Brain size={16} className="text-blue" /> {trouvees.length}/{jeu.paires.length} paires
        </span>
        <span className="text-muted">{coups} coups</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {cartes.map((c, i) => {
          const p = jeu.paires[c.paire];
          const visible = retournees.includes(i) || trouvees.includes(c.paire);
          const ok = trouvees.includes(c.paire);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toucher(i)}
              className="relative aspect-[3/4] [perspective:800px]"
              aria-label={
                visible ? (c.face === 'equipement' ? p.nom : p.associe) : 'Carte retournée'
              }
            >
              <motion.div
                className="relative size-full [transform-style:preserve-3d]"
                animate={{
                  rotateY: visible ? 180 : 0,
                  scale: ok ? [1, 1.06, 1] : 1,
                  x: rate && retournees.includes(i) ? [0, -5, 5, -3, 3, 0] : 0,
                }}
                transition={{ duration: 0.45 }}
              >
                {/* Dos : Ulysse */}
                <div
                  className="absolute inset-0 grid place-items-center rounded-2xl shadow-soft [backface-visibility:hidden]"
                  style={{
                    background:
                      'repeating-linear-gradient(135deg, #F5C542 0 10px, #15171C 10px 20px)',
                  }}
                >
                  <div className="grid size-[78%] place-items-center rounded-xl bg-navy">
                    <img
                      src={AVATAR}
                      alt=""
                      className="size-14 rounded-full ring-2 ring-sun sm:size-16"
                      draggable={false}
                    />
                  </div>
                </div>
                {/* Face */}
                <div
                  className={cx(
                    'absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-2 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]',
                    ok ? 'border-success bg-success/[0.08]' : 'border-line bg-white',
                  )}
                >
                  {c.face === 'equipement' ? (
                    <>
                      <span className="grid size-12 place-items-center rounded-full bg-blue-light text-navy sm:size-14">
                        <Icon name={p.icone} size={26} />
                      </span>
                      <span className="font-display text-sm font-extrabold leading-tight text-navy-950">
                        {p.nom}
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={22} className="text-danger" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Protège de
                      </span>
                      <span className="text-[13px] font-bold leading-tight text-navy-950">
                        {p.associe}
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>

      {fini && <Retour ok>Bravo, chaque équipement a retrouvé son risque !</Retour>}
    </div>
  );
}
