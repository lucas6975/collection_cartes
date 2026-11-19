import { Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useIdentite } from '../../data/identite';
import { game, useGame } from '../../data/store';
import { CASES, JOUR_ROUE, momentRoue } from '../../domain/roue';
import { RoueEcran, Roue } from './RoueEcran';

const [A, M, J] = JOUR_ROUE.split('-').map(Number);
const DEBUT = new Date(A, M - 1, J).getTime();

/** Le flou de la roue diminue chaque jour (20 → 23 novembre). */
export const FLOUS = [16, 10, 6, 1.8];

/** Un indice de plus chaque jour. */
export const INDICES = [
  '🎰 Mardi 24, tout le monde repart gagnant : 1 tour gratuit par personne, 0 perdant. Et le gros lot ? 👑 Ulysse en Or, une carte collector numérotée : le 1er gagnant aura le n° 001, le 2e le n° 002… Joue tôt !',
  '🛟 Collection à plat ? Demain dès 8 h 30, tourne la Roue de Secours : Ulysse en Or, Joker, légendaire, LSR qui te manque… À toi de jouer !',
];

/** Indice du jour : vendredi (et week-end) le 1er, lundi le 2e (le nom). */
export const INDICE_DU_JOUR = [0, 0, 0, 1];

/** « 4 j 13 h 05 min 09 s » */
export function compteARebours(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const j = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { j, h: pad(h), m: pad(m), s: pad(s % 60) };
}

function useMaintenant(pas: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), pas);
    return () => clearInterval(t);
  }, [pas]);
  return now;
}

/** Accueil : teaser mystère (19-23 nov.), puis la Roue de Secours (24 nov.). */
export function RoueAccueil() {
  const now = useMaintenant(1000);
  const { identite, codeAdmin } = useIdentite();
  const { progress } = useGame();
  const [ouvert, setOuvert] = useState(false);
  const moment = momentRoue(now);
  if (!identite && !codeAdmin) return null;

  const testAdmin = codeAdmin ? (
    <button
      type="button"
      onClick={() => {
        if (progress.roue) game.remettreRoue();
        setOuvert(true);
      }}
      className="relative mt-2 text-[11px] font-bold text-white/60 underline"
    >
      🔧 Tester la roue (admin)
    </button>
  ) : null;

  if (moment?.type === 'jour') {
    const gain = progress.roue && CASES.find((c) => c.id === progress.roue!.gain);
    const aRecuperer = progress.roue && !progress.roue.recupere;
    return (
      <>
        <motion.button
          type="button"
          onClick={() => setOuvert(true)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative block w-full overflow-hidden rounded-3xl p-5 text-left text-white shadow-lift"
          style={{ background: 'linear-gradient(135deg, #C8283A, #E8590C 55%, #F5C542)' }}
        >
          <motion.div
            className="absolute -bottom-10 -right-10 opacity-90"
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          >
            <Roue angle={0} taille={150} />
          </motion.div>
          <span className="relative rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-extrabold tracking-[0.12em]">
            🛟 AUJOURD’HUI SEULEMENT
          </span>
          <p className="relative mt-2 max-w-[62%] font-display text-[26px] font-extrabold leading-[1.05]">
            La Roue de Secours !
          </p>
          <p className="relative mt-1.5 max-w-[60%] text-sm text-white/95">
            {gain
              ? `Tu as gagné : ${gain.emoji} ${gain.label}`
              : 'Ta collection crève ? Ulysse a la roue de secours 🛟'}
          </p>
          <span className="relative mt-3 inline-block rounded-xl bg-white px-3.5 py-2 text-sm font-extrabold text-[#C8283A]">
            {!progress.roue
              ? '🎡 Tourner la roue'
              : aRecuperer
                ? '🎁 Récupérer mon gain'
                : '👀 Voir mon gain'}
          </span>
          {testAdmin}
        </motion.button>
        <RoueEcran ouvert={ouvert} onClose={() => setOuvert(false)} />
      </>
    );
  }

  if (moment?.type !== 'teaser') return null;
  const etape = Math.min(moment.jour, FLOUS.length - 1);
  const jour = INDICE_DU_JOUR[etape];
  const dernier = jour === INDICES.length - 1;
  const r = compteARebours(DEBUT - now.getTime());

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-4 text-white shadow-lift sm:p-5"
        style={{ background: 'linear-gradient(140deg, #0B2347 0%, #153E75 60%, #1F5AA6 100%)' }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-2"
          style={{
            background: 'repeating-linear-gradient(135deg, #F5C542 0 12px, #15171C 12px 24px)',
          }}
        />
        <div className="flex items-center gap-4 pt-1">
          <div className="relative shrink-0">
            <motion.div
              style={{ filter: `blur(${FLOUS[etape]}px)` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            >
              <Roue angle={0} taille={112} />
            </motion.div>
            {!dernier && (
              <span className="absolute inset-0 grid place-items-center font-display text-5xl font-extrabold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                ?
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-sun">
              {!dernier ? 'Quelque chose arrive…' : 'C’est demain !'}
            </p>
            <p className="mt-0.5 font-display text-lg font-extrabold leading-tight">
              {!dernier ? 'Mardi 24, ça va tourner 👀' : '🛟 La Roue de Secours'}
            </p>
            <div className="mt-2 flex gap-1.5 font-display font-extrabold">
              {[
                [r.j, 'j'],
                [r.h, 'h'],
                [r.m, 'min'],
                [r.s, 's'],
              ].map(([v, u]) => (
                <span
                  key={u as string}
                  className="flex min-w-[42px] flex-col items-center rounded-lg bg-white/12 px-1.5 py-1"
                >
                  <span className="text-lg leading-none tabular-nums">{v}</span>
                  <span className="text-[9px] font-bold uppercase text-white/70">{u}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {INDICES.map((t, i) =>
            i <= jour ? (
              <motion.li
                key={i}
                initial={i === jour ? { opacity: 0, x: -8 } : false}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl bg-white/10 px-3 py-2 text-[13px] font-semibold leading-snug"
              >
                <span className="mr-1.5 text-sun">Indice {i + 1}</span> {t}
              </motion.li>
            ) : (
              <li
                key={i}
                className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/20 px-3 py-2 text-[12.5px] text-white/50"
              >
                <Lock size={12} /> Indice {i + 1} · dévoilé{' '}
                {i === INDICES.length - 1 ? 'lundi' : 'demain'}
              </li>
            ),
          )}
        </ul>
        {testAdmin}
      </motion.section>
      <RoueEcran ouvert={ouvert} onClose={() => setOuvert(false)} />
    </>
  );
}
