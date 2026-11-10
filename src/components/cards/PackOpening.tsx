import { ArrowRight, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Confetti } from '../../avent/ui';
import { RARITY_BY_ID } from '../../content/categories';
import type { PackResult } from '../../domain/packs';
import type { Card, Rarity } from '../../domain/types';
import { useGame } from '../../data/store';
import { Button, cx } from '../ui/primitives';
import { CardBack } from './CardBack';
import { CardFace } from './GameCard';
import { PackArt } from './Pack';

type Phase = 'pack' | 'tear' | 'cards' | 'secrete' | 'recap';

/** Couleurs de la bannière et du halo selon la rareté (rare et au-delà). */
const EFFET: Partial<Record<Rarity, { halo: string; banniere: string; texte: string }>> = {
  rare: {
    halo: 'rgba(214,222,235,0.75)',
    banniere: 'linear-gradient(135deg, #F4F6F9, #A9B3C2 50%, #EEF1F5)',
    texte: '#2B3647',
  },
  epique: {
    halo: 'rgba(245,197,66,0.85)',
    banniere: 'linear-gradient(135deg, #FFE58A, #D9A21B)',
    texte: '#3B2600',
  },
  legendaire: {
    halo: 'rgba(190,150,255,0.85)',
    banniere: 'linear-gradient(90deg, #FFE58A, #FF8FB1, #9B8CFF, #6FE3FF)',
    texte: '#1B1240',
  },
};

/** Largeur de la grande carte : tient sur un petit téléphone sans défiler. */
const GRANDE: CSSProperties = { width: 'min(76vw, 300px, calc((100dvh - 300px) * 0.714))' };

/**
 * Ouverture d'un pack : le pack se déchire, puis les cartes sont révélées une par une, en grand.
 * Avant une carte rare ou mieux, le dos tremble et s'illumine. Un récap termine l'ouverture.
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
  const [index, setIndex] = useState(0);
  const [revelee, setRevelee] = useState(false);
  const n = result.cards.length;

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
  const apresCartes = () => setPhase(result.debloquee ? 'secrete' : 'recap');
  const suivante = () => {
    if (index < n - 1) {
      setIndex(index + 1);
      setRevelee(false);
    } else apresCartes();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-navy-950/95 px-4 py-6 backdrop-blur-md"
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

      {(phase === 'pack' || phase === 'tear') && <OuverturePack phase={phase} onTear={tear} />}

      {phase === 'cards' && (
        <UneCarte
          key={index}
          card={result.cards[index]}
          nouvelle={result.nouvelles[index]}
          index={index}
          n={n}
          total={total}
          revelee={revelee}
          onReveler={() => setRevelee(true)}
          onSuivante={suivante}
          onToutReveler={apresCartes}
        />
      )}

      {phase === 'secrete' && result.debloquee && (
        <CarteSecrete card={result.debloquee} total={total} onSuite={() => setPhase('recap')} />
      )}

      {phase === 'recap' && (
        <Recap result={result} total={total} onClose={onClose} onCollection={onCollection} />
      )}
    </motion.div>
  );
}

// ───────────── 1. Le pack se déchire ─────────────

function OuverturePack({ phase, onTear }: { phase: 'pack' | 'tear'; onTear: () => void }) {
  return (
    <div className="relative flex flex-col items-center">
      <p className="eyebrow mb-5 text-sun">
        {phase === 'pack' ? 'Touche le pack pour l’ouvrir' : 'Ouverture…'}
      </p>
      <motion.button
        type="button"
        onClick={onTear}
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
        <div className="relative">
          <PackArt />
          {phase === 'tear' && (
            <motion.div
              className="absolute inset-x-0 top-0 h-[14%] overflow-hidden rounded-t-[26px]"
              initial={{ y: 0, rotate: 0, opacity: 1 }}
              animate={{ y: -160, rotate: -18, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                background: 'repeating-linear-gradient(135deg, #F5C542 0 14px, #15171C 14px 28px)',
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
  );
}

// ───────────── 2 et 3. Une carte à la fois, en grand ─────────────

function Points({ n, index, revelee }: { n: number; index: number; revelee: boolean }) {
  return (
    <div className="flex justify-center gap-2" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={cx(
            'h-1.5 w-7 rounded-full transition-colors',
            i < index || (i === index && revelee)
              ? 'bg-white'
              : i === index
                ? 'bg-sun'
                : 'bg-white/20',
          )}
        />
      ))}
    </div>
  );
}

function Banniere({ rarete }: { rarete: Rarity }) {
  const e = EFFET[rarete];
  if (!e) return null;
  return (
    <motion.div
      className="whitespace-nowrap rounded-xl px-5 py-1.5 font-display text-lg font-extrabold uppercase tracking-[0.14em] shadow-lg"
      style={{ background: e.banniere, color: e.texte }}
      initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
      animate={{ scale: 1, rotate: -3, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.45 }}
    >
      ★ {RARITY_BY_ID[rarete].nom} ★
    </motion.div>
  );
}

function UneCarte({
  card,
  nouvelle,
  index,
  n,
  total,
  revelee,
  onReveler,
  onSuivante,
  onToutReveler,
}: {
  card: Card;
  nouvelle: boolean;
  index: number;
  n: number;
  total: number;
  revelee: boolean;
  onReveler: () => void;
  onSuivante: () => void;
  onToutReveler: () => void;
}) {
  const effet = EFFET[card.rarete];
  const legendaire = card.rarete === 'legendaire';
  const titre = revelee
    ? nouvelle
      ? 'Nouvelle carte !'
      : 'Déjà dans ta collection'
    : effet
      ? 'Oh… elle brille !'
      : 'Touche la carte pour la retourner';

  const glisser = (_: unknown, info: PanInfo) => {
    if (revelee && info.offset.x < -70) onSuivante();
  };

  return (
    <div className="relative flex h-full w-full max-w-md flex-col items-center justify-center gap-4">
      {revelee && legendaire && <Confetti count={60} />}
      <div className="text-center">
        <p className="eyebrow text-sun">
          Carte {index + 1} / {n}
        </p>
        <motion.h2
          key={titre}
          className="mt-1 font-display text-xl font-extrabold text-white sm:text-2xl"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {titre}
        </motion.h2>
      </div>

      <div className="flex h-10 items-center">{revelee && <Banniere rarete={card.rarete} />}</div>

      <div className="relative" style={GRANDE}>
        {effet && (
          <motion.div
            className="pointer-events-none absolute -inset-10 rounded-full blur-2xl"
            style={{ background: `radial-gradient(circle, ${effet.halo}, transparent 70%)` }}
            animate={revelee ? { opacity: [0.9, 0.55] } : { opacity: [0.35, 0.8, 0.35] }}
            transition={revelee ? { duration: 1.2 } : { duration: 1.1, repeat: Infinity }}
          />
        )}
        <motion.button
          type="button"
          onClick={revelee ? undefined : onReveler}
          drag={revelee ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={glisser}
          className="relative block aspect-[5/7] w-full [perspective:1200px]"
          initial={{ y: 70, opacity: 0, scale: 0.8 }}
          animate={
            !revelee && effet
              ? { y: 0, opacity: 1, scale: 1, rotate: [0, -2.5, 2.5, -2.5, 2.5, 0] }
              : { y: 0, opacity: 1, scale: 1, rotate: 0 }
          }
          transition={
            !revelee && effet
              ? {
                  y: { type: 'spring', stiffness: 170, damping: 17 },
                  rotate: { duration: 0.55, repeat: Infinity, repeatDelay: 0.5 },
                }
              : { type: 'spring', stiffness: 170, damping: 17 }
          }
          aria-label={revelee ? card.nom : 'Retourner la carte'}
        >
          <motion.div
            className="relative size-full [transform-style:preserve-3d]"
            animate={{ rotateY: revelee ? 180 : 0, scale: revelee ? [1, 1.06, 1] : 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="absolute inset-0 rounded-[22px] [backface-visibility:hidden]"
              style={
                effet && !revelee
                  ? { boxShadow: `0 0 0 3px ${effet.halo}, 0 0 50px 12px ${effet.halo}` }
                  : undefined
              }
            >
              <CardBack size="lg" />
            </div>
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <CardFace card={card} total={total} size="lg" />
            </div>
          </motion.div>
        </motion.button>
      </div>

      <div className="flex h-8 items-center">
        {revelee && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
              nouvelle ? 'bg-sun text-navy-950' : 'bg-white/10 text-white/70',
            )}
          >
            {nouvelle && <Sparkles size={12} />}
            {nouvelle ? 'Nouvelle carte' : 'Doublon'}
          </motion.span>
        )}
      </div>

      <Points n={n} index={index} revelee={revelee} />

      <div className="flex w-full max-w-xs flex-col items-center gap-2">
        {revelee ? (
          <Button variant="accent" size="lg" className="h-13 w-full" onClick={onSuivante}>
            {index < n - 1 ? 'Carte suivante' : 'Voir mon pack'} <ArrowRight size={18} />
          </Button>
        ) : (
          <Button variant="accent" size="lg" className="h-13 w-full" onClick={onReveler}>
            {effet ? <Sparkles size={18} /> : null} Retourner
          </Button>
        )}
        <button
          type="button"
          onClick={onToutReveler}
          className="text-xs font-semibold text-white/55 hover:text-white"
        >
          {revelee && index < n - 1 ? 'Glisse la carte ou ' : ''}Tout révéler d’un coup
        </button>
      </div>
    </div>
  );
}

// ───────────── Carte secrète : Ulysse débloqué ─────────────

function CarteSecrete({
  card,
  total,
  onSuite,
}: {
  card: Card;
  total: number;
  onSuite: () => void;
}) {
  const [revelee, setRevelee] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevelee(true), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="relative flex w-full max-w-md flex-col items-center gap-4 text-center">
      {revelee && <Confetti count={90} />}
      <div>
        <p className="eyebrow text-sun">Carte secrète débloquée</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white">
          Les 5 règles sont réunies !
        </h2>
        <p className="mt-1 text-sm text-white/70">Ulysse rejoint ta collection.</p>
      </div>
      <div className="flex h-10 items-center">{revelee && <Banniere rarete="legendaire" />}</div>
      <div className="relative" style={GRANDE}>
        <motion.div
          className="pointer-events-none absolute -inset-12 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${EFFET.legendaire!.halo}, transparent 70%)`,
          }}
          animate={{ opacity: [0.4, 0.9, 0.6], scale: [0.9, 1.1, 1] }}
          transition={{ duration: 1.6 }}
        />
        <motion.div
          className="relative aspect-[5/7] w-full [perspective:1200px]"
          initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12 }}
        >
          <motion.div
            className="relative size-full [transform-style:preserve-3d]"
            animate={{ rotateY: revelee ? 180 : 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 [backface-visibility:hidden]">
              <CardBack size="lg" />
            </div>
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <CardFace card={card} total={total} size="lg" />
            </div>
          </motion.div>
        </motion.div>
      </div>
      <Button variant="accent" size="lg" className="mt-2 w-full max-w-xs" onClick={onSuite}>
        Voir mon pack <ArrowRight size={18} />
      </Button>
    </div>
  );
}

// ───────────── 4. Le récap du pack ─────────────

function Recap({
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
  const { progress } = useGame();
  const cartes = [...result.cards, ...(result.debloquee ? [result.debloquee] : [])];
  const nouvelles = result.nouvelles.filter(Boolean).length + (result.debloquee ? 1 : 0);
  const doublons = result.cards.length - result.nouvelles.filter(Boolean).length;
  const meilleure = cartes.reduce((m, c) =>
    RARITY_BY_ID[c.rarete].rang > RARITY_BY_ID[m.rarete].rang ? c : m,
  );
  const possedees = progress.cards.length;
  // La plus rare au centre de l'éventail.
  const ordre = [...cartes].sort(
    (a, b) => RARITY_BY_ID[a.rarete].rang - RARITY_BY_ID[b.rarete].rang,
  );
  const milieu = Math.floor(ordre.length / 2);
  const eventail = [...ordre.slice(0, -1)];
  eventail.splice(milieu, 0, ordre[ordre.length - 1]);

  return (
    <div className="relative flex w-full max-w-md flex-col items-center gap-5 text-center">
      <div>
        <p className="eyebrow text-sun">Pack ouvert</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white">
          {nouvelles > 0 ? 'Bien joué !' : 'Que des doublons cette fois'}
        </h2>
      </div>

      <div className="relative h-[210px] w-full">
        {eventail.map((c, i) => {
          const centre = (eventail.length - 1) / 2;
          const d = i - centre;
          const estCentre = i === milieu;
          return (
            <motion.div
              key={`${c.id}-${i}`}
              className="absolute left-1/2 top-2 w-[112px]"
              style={{
                marginLeft: -56,
                zIndex: 10 - Math.round(Math.abs(d) * 2),
                transformOrigin: '50% 300px',
              }}
              initial={{ opacity: 0, y: 60, rotate: 0 }}
              animate={{ opacity: 1, y: estCentre ? -10 : 0, rotate: d * 10 }}
              transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 160, damping: 16 }}
            >
              <div className="aspect-[5/7] w-full">
                <CardFace card={c} total={total} size="sm" />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid w-full grid-cols-3 gap-2">
        {[
          { n: nouvelles, l: nouvelles > 1 ? 'nouvelles' : 'nouvelle' },
          { n: doublons, l: doublons > 1 ? 'doublons' : 'doublon' },
          { n: RARITY_BY_ID[meilleure.rarete].nom, l: 'meilleure carte' },
        ].map((b) => (
          <div key={b.l} className="rounded-2xl bg-white/10 px-2 py-3">
            <p className="font-display text-lg font-extrabold leading-tight text-sun">{b.n}</p>
            <p className="text-[11px] text-white/70">{b.l}</p>
          </div>
        ))}
      </div>

      <div className="w-full text-left">
        <p className="text-sm text-white/80">
          Ta collection : <b className="text-white">{possedees}</b> / {total}
        </p>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-sun to-[#FFE58A]"
            initial={{ width: 0 }}
            animate={{ width: `${(possedees / total) * 100}%` }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row-reverse">
        <Button variant="accent" size="lg" className="w-full" onClick={onCollection}>
          Voir ma collection
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full border border-white/25 text-white hover:bg-white/10"
          onClick={onClose}
        >
          Fermer
        </Button>
      </div>
    </div>
  );
}
