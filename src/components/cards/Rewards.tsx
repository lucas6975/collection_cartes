import { ChevronsUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORY_BY_ID, RARITY_BY_ID } from '../../content/categories';
import { ACHIEVEMENTS, niveauDepuisXp } from '../../domain/engine';
import type { RewardSummary } from '../../domain/types';
import { useSession } from '../../data/store';
import { useToast } from '../ui/overlay';
import { Button } from '../ui/primitives';
import { GameCard, RARITY_STYLE } from './GameCard';

type Step = { kind: 'card'; cardId: string } | { kind: 'level'; niveau: number };

const RewardsContext = createContext<(s: RewardSummary) => void>(() => {});

/** Orchestration des récompenses : découverte des cartes, passage de niveau, succès. */
export function RewardsProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Step[]>([]);
  const toast = useToast();

  const celebrate = useCallback(
    (s: RewardSummary) => {
      const steps: Step[] = s.nouvellesCartes.map((cardId) => ({ kind: 'card', cardId }));
      if (s.niveauApres > s.niveauAvant) steps.push({ kind: 'level', niveau: s.niveauApres });
      setQueue((q) => [...q, ...steps]);
      s.nouveauxSucces.forEach((id, i) => {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (a) setTimeout(() => toast(`Succès débloqué : ${a.titre}`), 400 + i * 600);
      });
    },
    [toast],
  );

  const next = () => setQueue((q) => q.slice(1));
  const current = queue[0];

  return (
    <RewardsContext.Provider value={celebrate}>
      {children}
      {createPortal(
        <AnimatePresence mode="wait">
          {current?.kind === 'card' && (
            <CardReveal
              key={`c-${current.cardId}`}
              cardId={current.cardId}
              remaining={queue.length - 1}
              onDone={next}
            />
          )}
          {current?.kind === 'level' && (
            <LevelUp key={`l-${current.niveau}`} niveau={current.niveau} onDone={next} />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </RewardsContext.Provider>
  );
}

export const useCelebrate = () => useContext(RewardsContext);

function Backdrop({ children, glow }: { children: ReactNode; glow: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-navy-950/90 px-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Rayons lumineux en rotation lente */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 opacity-40"
        style={{
          background: `repeating-conic-gradient(from 0deg, ${glow} 0deg 8deg, transparent 8deg 24deg)`,
          maskImage: 'radial-gradient(circle, black 10%, transparent 60%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: glow, opacity: 0.35 }}
      />
      {children}
    </motion.div>
  );
}

function CardReveal({
  cardId,
  remaining,
  onDone,
}: {
  cardId: string;
  remaining: number;
  onDone: () => void;
}) {
  const { catalog } = useSession();
  const [flipped, setFlipped] = useState(false);
  const card = catalog.cards.find((c) => c.id === cardId);
  if (!card) return null;
  const total = catalog.cards.filter((c) => c.publie).length;
  const style = RARITY_STYLE[card.rarete];
  const glow = card.rarete === 'commune' ? '#9FB3CC' : style.accent;

  return (
    <Backdrop glow={glow}>
      <div className="relative flex flex-col items-center text-center">
        <motion.p
          className="eyebrow text-sun"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Nouvelle carte débloquée
        </motion.p>
        <motion.h2
          className="mt-2 text-2xl font-extrabold text-white sm:text-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: flipped ? 1 : 0 }}
        >
          {card.nom}
        </motion.h2>
        <motion.p
          className="mt-1 text-sm font-semibold text-white/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: flipped ? 1 : 0 }}
        >
          {RARITY_BY_ID[card.rarete].nom} · {CATEGORY_BY_ID[card.categorie].nom}
        </motion.p>

        <motion.div
          className="relative mt-6 [perspective:1200px]"
          initial={{ scale: 0.6, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18 }}
        >
          <motion.div
            className="relative h-[364px] w-[260px] [transform-style:preserve-3d]"
            initial={{ rotateY: 0 }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Dos de la carte */}
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="absolute inset-0 grid place-items-center overflow-hidden rounded-[22px] border-[3px] border-sun/80 [backface-visibility:hidden]"
              style={{ background: 'linear-gradient(160deg, #2563A6, #153E75 55%, #0B2347)' }}
              aria-label="Retourner la carte"
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #F5C542 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, #F5C542 0 1px, transparent 1px 14px)',
                }}
              />
              <motion.div
                className="relative flex flex-col items-center gap-3"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                <Logo size={72} />
                <span className="font-display text-lg font-extrabold tracking-[0.3em] text-white">
                  VIGIE
                </span>
                <span className="text-xs font-medium text-white/70">Touchez pour révéler</span>
              </motion.div>
            </button>
            {/* Face */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <GameCard card={card} total={total} size="lg" className="w-full" tilt={false} />
            </div>
          </motion.div>
        </motion.div>

        <div className="mt-8 h-12">
          {flipped ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button variant="accent" size="lg" onClick={onDone}>
                {remaining > 0 ? `Carte suivante (${remaining})` : 'Ajouter à ma collection'}
              </Button>
            </motion.div>
          ) : (
            <Button variant="secondary" size="lg" onClick={() => setFlipped(true)}>
              Révéler la carte
            </Button>
          )}
        </div>
      </div>
    </Backdrop>
  );
}

function LevelUp({ niveau, onDone }: { niveau: number; onDone: () => void }) {
  const titre = niveauDepuisXp(50 * (niveau - 1) * niveau).titre;
  return (
    <Backdrop glow="#F5C542">
      <motion.div
        className="relative flex flex-col items-center text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      >
        <div className="relative grid size-36 place-items-center rounded-full bg-gradient-to-br from-sun-light to-sun-dark shadow-[0_0_60px_rgba(245,197,66,0.6)]">
          <div className="grid size-28 place-items-center rounded-full bg-navy">
            <span className="font-display text-5xl font-extrabold text-white">{niveau}</span>
          </div>
          <motion.div
            className="absolute -top-3 grid size-9 place-items-center rounded-full bg-white text-navy shadow-lg"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          >
            <ChevronsUp size={20} />
          </motion.div>
        </div>
        <p className="eyebrow mt-6 text-sun">Niveau supérieur</p>
        <h2 className="mt-1 text-3xl font-extrabold text-white">{titre}</h2>
        <p className="mt-2 max-w-xs text-sm text-white/70">
          Ta progression témoigne de connaissances solides. Continue sur cette lancée !
        </p>
        <Button variant="accent" size="lg" className="mt-8" onClick={onDone}>
          Continuer
        </Button>
      </motion.div>
    </Backdrop>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#153E75" />
      <path
        d="M16 5.5l8.5 3.2v6.1c0 5.3-3.6 9.8-8.5 11.6-4.9-1.8-8.5-6.3-8.5-11.6V8.7z"
        fill="none"
        stroke="#F5C542"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 16.2l3 3 5.2-6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
