import { Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORY_BY_ID, RARITY_BY_ID } from '../../content/categories';
import type { PackResult } from '../../domain/packs';
import { Button, cx } from '../ui/primitives';
import { CardBack } from './CardBack';
import { CardFace, RARITY_STYLE } from './GameCard';
import { PackArt } from './Pack';

type Phase = 'pack' | 'tear' | 'cards';

/**
 * Ouverture d'un pack en trois temps : le pack tremble et se déchire, les cinq cartes
 * apparaissent face cachée (verso à la mascotte), puis on les retourne une à une.
 */
export function PackOpening({
  result,
  total,
  onClose,
  onCollection,
}: {
  result: PackResult | null;
  total: number;
  onClose: () => void;
  onCollection: () => void;
}) {
  return createPortal(
    <AnimatePresence>
      {result && (
        <Opening
          key={result.progress.packs.length}
          result={result}
          total={total}
          onClose={onClose}
          onCollection={onCollection}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Opening({
  result,
  total,
  onClose,
  onCollection,
}: {
  result: PackResult;
  total: number;
  onClose: () => void;
  onCollection: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('pack');
  const [flipped, setFlipped] = useState<boolean[]>(() => result.cards.map(() => false));
  const [big] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const allFlipped = flipped.every(Boolean);
  const nouvelles = result.nouvelles.filter(Boolean).length;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const tear = () => {
    if (phase !== 'pack') return;
    setPhase('tear');
    setTimeout(() => setPhase('cards'), 900);
  };
  const flip = (i: number) => setFlipped((f) => f.map((v, j) => (j === i ? true : v)));
  const flipAll = () => setFlipped(result.cards.map(() => true));

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-y-auto bg-navy-950/92 px-4 py-10 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Ouverture du pack"
    >
      <motion.div
        className="pointer-events-none fixed left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 opacity-30"
        style={{
          background:
            'repeating-conic-gradient(from 0deg, #F5C542 0deg 8deg, transparent 8deg 24deg)',
          maskImage: 'radial-gradient(circle, black 10%, transparent 60%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
      />
      <button
        onClick={onClose}
        className="fixed right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Fermer"
      >
        <X size={20} />
      </button>

      {phase !== 'cards' ? (
        <div className="relative flex flex-col items-center">
          <p className="eyebrow mb-5 text-sun">
            {phase === 'pack' ? 'Touchez le pack pour l’ouvrir' : 'Ouverture…'}
          </p>
          <motion.button
            type="button"
            onClick={tear}
            className="relative w-[240px] sm:w-[280px]"
            initial={{ scale: 0.7, y: 40, opacity: 0 }}
            animate={
              phase === 'pack'
                ? { scale: 1, y: 0, opacity: 1, rotate: [0, -2, 2, -2, 0] }
                : {
                    rotate: [0, -6, 6, -6, 6, 0],
                    scale: [1, 1.04, 1.04, 1.08, 1.1, 0.4],
                    opacity: [1, 1, 1, 1, 1, 0],
                  }
            }
            transition={
              phase === 'pack'
                ? {
                    scale: { type: 'spring', stiffness: 160, damping: 16 },
                    rotate: { duration: 0.6, delay: 0.6, repeat: Infinity, repeatDelay: 1.8 },
                  }
                : { duration: 0.9, ease: 'easeIn' }
            }
            aria-label="Ouvrir le pack"
          >
            {/* Le haut du pack se détache lors de l'ouverture */}
            <div className="relative">
              <PackArt />
              {phase === 'tear' && (
                <motion.div
                  className="absolute inset-x-0 top-0 h-[14%] overflow-hidden rounded-t-[26px]"
                  initial={{ y: 0, rotate: 0, opacity: 1 }}
                  animate={{ y: -160, rotate: -18, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    background:
                      'repeating-linear-gradient(135deg, #F5C542 0 14px, #15171C 14px 28px)',
                  }}
                />
              )}
            </div>
            {phase === 'tear' && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-[26px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0] }}
                transition={{ duration: 0.9 }}
                style={{ background: 'radial-gradient(circle, #FFF6D6, transparent 70%)' }}
              />
            )}
          </motion.button>
        </div>
      ) : (
        <div className="relative flex w-full max-w-5xl flex-col items-center">
          <p className="eyebrow text-sun">
            {allFlipped ? 'Pack ouvert' : 'Touchez une carte pour la retourner'}
          </p>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-white sm:text-3xl">
            {allFlipped
              ? nouvelles > 0
                ? `${nouvelles} nouvelle${nouvelles > 1 ? 's' : ''} carte${nouvelles > 1 ? 's' : ''} !`
                : 'Que des doublons cette fois'
              : '5 cartes sécurité'}
          </h2>

          <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-5">
            {result.cards.map((card, i) => {
              const isFlipped = flipped[i];
              const rarete = RARITY_BY_ID[card.rarete];
              const special = rarete.rang >= 3;
              const width = big ? 168 : 110;
              return (
                <motion.div
                  key={`${card.id}-${i}`}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 60, rotate: (i - 2) * 6, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                  transition={{ delay: i * 0.12, type: 'spring', stiffness: 170, damping: 17 }}
                >
                  <button
                    type="button"
                    onClick={() => flip(i)}
                    className="relative [perspective:1000px]"
                    style={{ width, aspectRatio: '5 / 7' }}
                    aria-label={isFlipped ? card.nom : `Retourner la carte ${i + 1}`}
                  >
                    {special && isFlipped && (
                      <motion.div
                        className="pointer-events-none absolute -inset-6 rounded-full blur-2xl"
                        style={{ background: RARITY_STYLE[card.rarete].accent }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 0.8, 0.45], scale: [0.5, 1.2, 1] }}
                        transition={{ duration: 0.9 }}
                      />
                    )}
                    <motion.div
                      className="relative size-full [transform-style:preserve-3d]"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      whileHover={isFlipped ? undefined : { y: -6 }}
                      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="absolute inset-0 [backface-visibility:hidden]">
                        <CardBack size={big ? 'md' : 'sm'} />
                      </div>
                      <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <CardFace card={card} total={total} size={big ? 'md' : 'sm'} />
                      </div>
                    </motion.div>
                  </button>
                  <div className="mt-3 h-6">
                    {isFlipped && (
                      <motion.span
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className={cx(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                          result.nouvelles[i]
                            ? 'bg-sun text-navy-950'
                            : 'bg-white/10 text-white/70',
                        )}
                      >
                        {result.nouvelles[i] && <Sparkles size={11} />}
                        {result.nouvelles[i] ? 'Nouvelle' : 'Doublon'}
                      </motion.span>
                    )}
                  </div>
                  {isFlipped && special && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="-mt-0.5 text-[11px] font-semibold text-white/75"
                    >
                      {rarete.nom} · {CATEGORY_BY_ID[card.categorie].court}
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {allFlipped ? (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onClose}
                  className="border border-white/25 text-white hover:bg-white/10"
                >
                  Fermer
                </Button>
                <Button variant="accent" size="lg" onClick={onCollection}>
                  Voir ma collection
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="lg" onClick={flipAll}>
                Tout révéler
              </Button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
