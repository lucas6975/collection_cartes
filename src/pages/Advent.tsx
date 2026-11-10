import { CalendarClock, Eye, Lock, Star } from 'lucide-react';
import { motion, useAnimationControls } from 'motion/react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useToast } from '../components/ui/overlay';
import { cx } from '../components/ui/primitives';
import { ANNEE_AVENT, JOURS } from '../avent/jours';
import { caseDuJour, estOuverte, joursAvantDebut } from '../avent/logic';
import { modeApercu, useAvent, type JourTermine } from '../avent/progress';
import { Etoiles, NOEL, Neige } from '../avent/ui';

const FOND = `${import.meta.env.BASE_URL}avent/fond-noel.webp`;

/** Couleurs des cases, comme sur l'affiche du calendrier. */
function couleur(jour: number) {
  if (jour === 24)
    return { fond: `linear-gradient(160deg, ${NOEL.or}, #D9A21F)`, texte: '#5A3B00' };
  const c = [NOEL.rouge, NOEL.vert, NOEL.kraft][(jour * 7) % 3];
  return { fond: `linear-gradient(160deg, ${c}, ${c}D9)`, texte: '#FFFFFF' };
}

function Porte({
  jour,
  ouverte,
  aujourdhui,
  termine,
  onOuvrir,
  onFermee,
}: {
  jour: number;
  ouverte: boolean;
  aujourdhui: boolean;
  termine?: JourTermine;
  onOuvrir: () => void;
  onFermee: () => void;
}) {
  const controls = useAnimationControls();
  const [ouverture, setOuverture] = useState(false);
  const c = couleur(jour);

  const toucher = () => {
    if (!ouverte) {
      controls.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } });
      onFermee();
      return;
    }
    setOuverture(true);
    setTimeout(onOuvrir, 480);
  };

  return (
    <motion.button
      type="button"
      onClick={toucher}
      animate={controls}
      whileHover={ouverte ? { y: -3 } : undefined}
      className="group relative aspect-square w-full text-left [perspective:700px]"
      aria-label={
        ouverte
          ? `Ouvrir la case du ${jour} décembre${termine ? ', déjà terminée' : ''}`
          : `Case du ${jour} décembre, pas encore ouverte`
      }
    >
      {/* Intérieur de la case, visible quand la porte s'ouvre */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#FFF8E6] shadow-inner ring-1 ring-black/10">
        {termine ? (
          <>
            <Etoiles n={termine.etoiles} size={16} clair />
            <span className="mt-1 font-display text-lg font-extrabold text-navy-950">{jour}</span>
          </>
        ) : (
          <Star size={22} className="fill-sun text-sun-dark" />
        )}
      </div>

      {/* Porte */}
      <motion.div
        className="absolute inset-0 origin-left rounded-2xl shadow-[0_6px_16px_-6px_rgba(0,0,0,0.5)] [backface-visibility:hidden] [transform-style:preserve-3d]"
        style={{ background: c.fond }}
        animate={{ rotateY: ouverture || termine ? -110 : 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 14 }}
      >
        {/* Neige sur le dessus */}
        <div className="absolute -top-1 left-1 right-1 h-3 rounded-full bg-white shadow-sm" />
        <div className="absolute left-2 top-1 h-4 w-5 rounded-b-full bg-white" />
        <div className="absolute right-4 top-1 h-3 w-4 rounded-b-full bg-white" />
        {/* Ruban */}
        {jour % 4 === 0 && (
          <div className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 bg-white/25" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cx(
              'font-display font-extrabold drop-shadow',
              jour === 24 ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl',
            )}
            style={{ color: c.texte }}
          >
            {jour}
          </span>
          {!ouverte && (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-black/25 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
              <Lock size={9} /> {jour} déc.
            </span>
          )}
        </div>
        {/* Poignée */}
        <div className="absolute right-2 top-1/2 size-2 -translate-y-1/2 rounded-full bg-white/70 shadow" />
        {!ouverte && <div className="absolute inset-0 rounded-2xl bg-[#0B1F3F]/35" />}
      </motion.div>

      {/* Mise en avant de la case du jour */}
      {aujourdhui && !termine && (
        <>
          <motion.div
            className="pointer-events-none absolute -inset-1 rounded-[20px] ring-4 ring-sun"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-sun px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-navy-950 shadow">
            Aujourd’hui
          </span>
        </>
      )}
    </motion.button>
  );
}

export function Advent() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const progression = useAvent();
  const apercu = modeApercu(location.search);
  const [now] = useState(() => new Date());
  const duJour = caseDuJour(ANNEE_AVENT, now);
  const avantDebut = joursAvantDebut(ANNEE_AVENT, now);
  const terminees = Object.keys(progression).length;
  const etoiles = Object.values(progression).reduce((s, j) => s + j.etoiles, 0);

  return (
    <div className="space-y-6">
      {/* Bandeau : l'affiche du calendrier */}
      <section className="relative overflow-hidden rounded-3xl shadow-lift">
        <img
          src={FOND}
          alt="Ulysse devant le sapin du calendrier de l’Avent"
          className="block aspect-[16/9] w-full object-cover brightness-110"
        />
        <div className="absolute left-[29%] top-[18%] flex h-[70%] w-[49%] flex-col items-center justify-center px-2 text-center">
          <p className="font-display text-[15px] font-extrabold leading-tight text-navy-950 min-[480px]:text-xl sm:text-3xl md:text-4xl">
            Calendrier de l’Avent IMECA {ANNEE_AVENT}
          </p>
          <p className="mt-1 text-[10px] font-bold text-navy sm:mt-3 sm:text-base">
            Par la Team Ulysse
          </p>
          <p className="mt-2 hidden rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white sm:mt-4 sm:block sm:text-sm">
            {duJour
              ? `Case du jour : ${duJour}`
              : avantDebut > 0
                ? `Ouverture dans ${avantDebut} jour${avantDebut > 1 ? 's' : ''}`
                : 'Joyeuses fêtes en toute sécurité !'}
          </p>
        </div>
      </section>

      {apercu && (
        <p className="flex items-center gap-2 rounded-2xl bg-sun/20 px-4 py-3 text-sm font-semibold text-navy-950">
          <Eye size={17} /> Mode aperçu : toutes les cases sont ouvertes pour tester le calendrier.
        </p>
      )}

      {/* Calendrier */}
      <section
        className="relative overflow-hidden rounded-3xl px-4 pb-6 pt-5 sm:px-8 sm:pb-8"
        style={{ background: `linear-gradient(170deg, #173A6B, ${NOEL.nuit} 70%)` }}
      >
        <Neige />
        <div className="relative mb-5 flex flex-wrap items-center justify-between gap-3 text-white">
          <div>
            <h2 className="font-display text-xl font-extrabold sm:text-2xl">
              Ouvre une case chaque jour
            </h2>
            <p className="text-sm text-white/70">
              Chaque case cache un défi sécurité. Une nouvelle s’ouvre chaque matin de décembre.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
              <CalendarClock size={15} /> {terminees}/24
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
              <Star size={15} className="fill-sun text-sun" /> {etoiles}
            </span>
          </div>
        </div>

        {!duJour && avantDebut > 0 && !apercu && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-5 rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white"
          >
            🎄 Première case le 1er décembre : encore {avantDebut} jour{avantDebut > 1 ? 's' : ''}{' '}
            de patience !
          </motion.p>
        )}

        <div className="relative grid grid-cols-4 gap-3 sm:grid-cols-6 sm:gap-4">
          {JOURS.map((j) => (
            <Porte
              key={j.jour}
              jour={j.jour}
              ouverte={apercu || estOuverte(ANNEE_AVENT, j.jour, now)}
              aujourdhui={duJour === j.jour}
              termine={progression[j.jour]}
              onOuvrir={() => navigate(`/avent/${j.jour}${apercu ? '?apercu' : ''}`)}
              onFermee={() =>
                toast(`Patience ! La case ${j.jour} s’ouvre le ${j.jour} décembre.`, 'info')
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
