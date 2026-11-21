import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { Confetti } from '../../avent/ui';
import { api } from '../../data/api';
import { game, useGame, type PackResultat } from '../../data/store';
import { appareil } from '../../data/visites';
import { CASES, angleFinal, choixJoker, type Gain } from '../../domain/roue';
import type { Card } from '../../domain/types';
import { MASCOTTE_URL } from '../cards/CardBack';
import { GameCard } from '../cards/GameCard';
import { PackOpening } from '../cards/PackOpening';
import { CarteOr } from './CarteOr';
import { noterRoue } from '../../data/suiviRoue';

const FOND = 'radial-gradient(circle at 50% 30%, #2F74C4 0%, #153E75 55%, #0B2347 100%)';
const PART = 360 / CASES.length;

/** La roue elle-même : 6 cases colorées, Ulysse au centre. */
export function Roue({ angle, taille = 300 }: { angle: number; taille?: number }) {
  const fond = `conic-gradient(from ${-PART / 2}deg, ${CASES.map(
    (c, i) => `${c.couleur} ${i * PART}deg ${(i + 1) * PART}deg`,
  ).join(', ')})`;
  return (
    <div className="relative" style={{ width: taille, height: taille }}>
      <span
        className="absolute left-1/2 z-20 -translate-x-1/2 drop-shadow-[0_3px_3px_rgba(0,0,0,0.4)]"
        style={{
          top: -18,
          width: 0,
          height: 0,
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderTop: '30px solid #fff',
        }}
      />
      <motion.div
        className="size-full rounded-full"
        style={{
          background: fond,
          border: '9px solid #F5C542',
          boxShadow: '0 0 0 5px #fff, 0 0 40px rgba(245,197,66,.6)',
        }}
        animate={{ rotate: angle }}
        transition={{ duration: angle ? 4.8 : 0, ease: [0.12, 0.75, 0.15, 1] }}
      >
        {CASES.map((c, i) => (
          <div
            key={c.id}
            className="absolute inset-0"
            style={{ transform: `rotate(${i * PART}deg)` }}
          >
            <span
              className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center text-center font-extrabold leading-[1.1]"
              style={{
                top: '7%',
                width: taille * 0.3,
                color: c.couleur === '#F8FAFC' || c.couleur === '#F5C542' ? '#0B2347' : '#fff',
                fontSize: taille * 0.04,
              }}
            >
              <span style={{ fontSize: taille * 0.09, lineHeight: 1.15 }}>{c.emoji}</span>
              {c.label}
            </span>
          </div>
        ))}
      </motion.div>
      <div className="absolute left-1/2 top-1/2 z-10 grid size-[23%] -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full border-[5px] border-sun bg-white">
        <img src={MASCOTTE_URL} alt="" className="mt-[30%] w-[90%]" />
      </div>
    </div>
  );
}

type Tour = { index: number; carte: Card | null; debloquee: Card | null };

/** Écran plein de la Roue de Secours : tourner, puis récupérer son gain. */
export function RoueEcran({
  ouvert,
  onClose,
  forcer,
}: {
  ouvert: boolean;
  onClose: () => void;
  /** Administrateur : case imposée pour tester. */
  forcer?: Gain;
}) {
  return createPortal(
    <AnimatePresence>{ouvert && <Contenu onClose={onClose} forcer={forcer} />}</AnimatePresence>,
    document.body,
  );
}

function Contenu({ onClose, forcer }: { onClose: () => void; forcer?: Gain }) {
  const { progress, cards } = useGame();
  const navigate = useNavigate();
  const deja = progress.roue;
  const [angle, setAngle] = useState(0);
  const [tour, setTour] = useState<Tour | null>(null);
  const [fini, setFini] = useState(!!deja);
  const [pack, setPack] = useState<PackResultat | null>(null);
  const [joker, setJoker] = useState<Card | null>(null);

  const index = tour?.index ?? (deja ? CASES.findIndex((c) => c.id === deja.gain) : -1);
  const gain = index >= 0 ? CASES[index] : null;
  const carte =
    joker ?? tour?.carte ?? (deja?.carteId ? cards.find((c) => c.id === deja.carteId) : null);

  // Ulysse en Or : numéro attribué par la base, dans l'ordre des gagnants.
  useEffect(() => {
    if (!progress.ulysseOr || progress.ulysseOr.numero || progress.ulysseOr.test) return;
    const id = appareil();
    if (id)
      api
        .numeroUlysseOr(id)
        .then((n) => n && game.numeroterOr(n))
        .catch(() => undefined);
  }, [progress.ulysseOr]);

  // Statistiques admin : la personne a ouvert la roue.
  useEffect(() => {
    if (!forcer) void noterRoue('ouverte');
  }, [forcer]);

  const tourner = () => {
    const r = game.tournerRoue(forcer);
    if (!forcer) void noterRoue('tournee', CASES[r.index].id);
    setTour(r);
    setAngle(angleFinal(r.index, (Math.random() - 0.5) * PART * 0.6));
    setTimeout(() => setFini(true), 5000);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] overflow-y-auto text-white"
      style={{ background: FOND }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(#fff 1.4px, transparent 2px)',
          backgroundSize: '30px 30px',
        }}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-30 grid size-10 place-items-center rounded-full bg-white/15"
        aria-label="Fermer"
      >
        <X size={20} />
      </button>

      <div className="relative mx-auto flex min-h-full max-w-md flex-col items-center px-5 pb-10 pt-[max(3.5rem,env(safe-area-inset-top))]">
        {!fini ? (
          <>
            <p className="font-display text-[26px] font-extrabold">🛟 La Roue de Secours</p>
            <p className="mt-1 text-center text-sm text-white/85">
              Ulysse ne tourne plus rond… à ton tour de tourner ! 0 perdant.
            </p>
            <div className="mt-9">
              <Roue angle={angle} taille={Math.min(320, window.innerWidth - 50)} />
            </div>
            <button
              type="button"
              onClick={tourner}
              disabled={!!tour}
              className="mt-9 h-14 w-full rounded-2xl bg-sun text-lg font-extrabold text-navy-950 shadow-lg transition-transform active:scale-95 disabled:opacity-70"
            >
              {tour ? 'Ulysse a la tête qui tourne… 😵‍💫' : '🎡 Tourner la roue !'}
            </button>
            <p className="mt-2 text-sm text-white/70">1 seul tour · aujourd’hui seulement</p>
          </>
        ) : (
          gain && (
            <motion.div
              className="flex w-full flex-col items-center text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {tour && <Confetti />}
              <p className="text-xs font-extrabold tracking-[0.16em] text-sun">
                {gain.id === 'or' ? '🎉 JACKPOT !' : '🎉 GAGNÉ !'}
              </p>
              <p className="mt-1 font-display text-[28px] font-extrabold leading-tight">
                {gain.emoji} {gain.label}
              </p>

              {gain.id === 'or' && (
                <>
                  <div className="mt-6 w-[62%]">
                    <CarteOr
                      numero={progress.ulysseOr?.numero ?? null}
                      test={progress.ulysseOr?.test}
                    />
                  </div>
                  <p className="mt-5 text-sm text-white/90">
                    Carte <b>collector</b> : on ne l’obtient qu’à la roue, et elle est{' '}
                    <b>numérotée</b> dans l’ordre des gagnants 🏆
                  </p>
                </>
              )}

              {gain.id === 'joker' && !carte && (
                <>
                  <p className="mt-2 text-sm text-white/90">
                    Choisis <b>la carte que tu veux</b> parmi celles qui te manquent !
                  </p>
                  <div className="mt-4 grid w-full grid-cols-3 gap-2.5">
                    {choixJoker(progress, cards).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          game.choisirJoker(c.id);
                          setJoker(c);
                        }}
                        className="rounded-xl transition-transform active:scale-95"
                      >
                        <GameCard
                          card={c}
                          total={cards.length}
                          size="sm"
                          className="w-full"
                          tilt={false}
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {carte && (
                <>
                  <div className="mt-6 w-[62%]">
                    <GameCard
                      card={carte}
                      total={cards.length}
                      size="lg"
                      className="w-full"
                      isNew
                    />
                  </div>
                  <p className="mt-4 text-sm text-white/90">
                    <b>{carte.nom}</b> rejoint ta collection 🗂️
                  </p>
                  {tour?.debloquee && (
                    <p className="mt-2 rounded-xl bg-white/15 px-3 py-2 text-sm">
                      ✨ Toutes les LSR réunies : <b>{tour.debloquee.nom}</b> est débloquée !
                    </p>
                  )}
                </>
              )}

              {gain.id === 'pack' && !progress.roue?.recupere && (
                <button
                  type="button"
                  onClick={() => setPack(game.ouvrirPackRoue())}
                  className="mt-8 h-14 w-full rounded-2xl bg-sun text-lg font-extrabold text-navy-950"
                >
                  🎁 Ouvrir mon pack bonus
                </button>
              )}
              {gain.id === 'pack' && progress.roue?.recupere && (
                <p className="mt-4 text-sm text-white/90">Ton pack bonus est ouvert 🎁</p>
              )}

              {(gain.id !== 'joker' || carte) &&
                (gain.id !== 'pack' || progress.roue?.recupere) && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/collection');
                    }}
                    className="mt-7 h-13 w-full rounded-2xl bg-sun py-3.5 text-base font-extrabold text-navy-950"
                  >
                    Voir ma collection
                  </button>
                )}
            </motion.div>
          )
        )}
      </div>

      <PackOpening
        result={pack}
        total={cards.length}
        onClose={() => setPack(null)}
        onCollection={() => {
          setPack(null);
          onClose();
          navigate('/collection');
        }}
      />
    </motion.div>
  );
}
