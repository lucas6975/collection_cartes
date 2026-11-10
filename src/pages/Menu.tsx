import { ArrowRight, CalendarDays, Gift, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { MASCOTTE_URL } from '../components/cards/CardBack';
import { PackArt } from '../components/cards/Pack';
import { ANNEE_AVENT, JOURS, PHASE_TEST } from '../avent/jours';
import { caseDuJour, jourJouable, joursAvantDebut } from '../avent/logic';
import { useAvent } from '../avent/progress';
import { NOEL, Neige } from '../avent/ui';
import { useGame } from '../data/store';
import { packDuJourOuvert } from '../domain/packs';

const FOND_NOEL = `${import.meta.env.BASE_URL}avent/fond-noel.webp`;

export function Menu() {
  const { progress, cards } = useGame();
  const avent = useAvent();
  const [now] = useState(() => new Date());
  const packOuvert = packDuJourOuvert(progress, now);
  const duJour = caseDuJour(ANNEE_AVENT, now);
  const avantDebut = joursAvantDebut(ANNEE_AVENT, now);
  const caseFaite = duJour ? !!avent[duJour] : false;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Accueil d'Ulysse */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex items-center gap-4 overflow-hidden rounded-3xl px-5 py-5 text-white sm:gap-8 sm:px-10 sm:py-6"
        style={{ background: 'linear-gradient(125deg, #2563A6 0%, #153E75 55%, #0B2347 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(#fff 1px, transparent 1.2px)',
            backgroundSize: '18px 18px',
          }}
        />
        <motion.img
          src={MASCOTTE_URL}
          alt="Ulysse, la mascotte"
          className="relative h-28 w-auto shrink-0 drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)] sm:h-40"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 0.1 }}
        />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sun">
            Bienvenue dans la
          </p>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Team Ulysse</h1>
          <p className="mt-1 max-w-md text-sm text-white/75 sm:text-[15px]">
            La sécurité au travail, en jouant un peu chaque jour. Choisis ton jeu !
          </p>
        </div>
      </motion.section>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Cartes à collectionner */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <Link
            to="/cartes"
            className="group relative flex h-full min-h-72 flex-col overflow-hidden rounded-3xl bg-[#15171C] p-6 text-white shadow-lift transition-transform hover:-translate-y-1"
          >
            <div
              className="absolute inset-0 opacity-90"
              style={{
                background:
                  'repeating-linear-gradient(135deg, rgba(245,197,66,0.14) 0 18px, transparent 18px 36px)',
              }}
            />
            <motion.div
              className="absolute -right-6 bottom-[-28px] w-40 rotate-[10deg] transition-transform duration-300 group-hover:rotate-[4deg] sm:w-48"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <PackArt opened={packOuvert} />
            </motion.div>
            <div className="relative max-w-[60%]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sun px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-navy-950">
                <Layers size={12} /> Tous les jours
              </span>
              <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                Cartes à collectionner
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Un pack de 5 cartes sécurité à ouvrir chaque jour.
              </p>
            </div>
            <div className="relative mt-auto pt-6">
              <p className="text-sm font-semibold text-white/90">
                {progress.cards.length}/{cards.length} cartes ·{' '}
                {packOuvert ? 'pack du jour ouvert' : 'ton pack t’attend !'}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sun px-4 py-2.5 text-sm font-bold text-navy-950 shadow-lg shadow-sun/20">
                {packOuvert ? 'Voir ma collection' : 'Ouvrir mon pack'}{' '}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Calendrier de l'Avent */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <Link
            to="/avent"
            className="group relative flex h-full min-h-72 flex-col overflow-hidden rounded-3xl p-6 text-white shadow-lift transition-transform hover:-translate-y-1"
            style={{ background: `linear-gradient(170deg, #173A6B, ${NOEL.nuit})` }}
          >
            <img
              src={FOND_NOEL}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-45 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3F] via-[#0B1F3F]/60 to-transparent" />
            <Neige flocons={22} />
            <div className="relative">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white"
                style={{ background: NOEL.rouge }}
              >
                <Gift size={12} /> Décembre {ANNEE_AVENT}
              </span>
              <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                Calendrier de l’Avent
              </h2>
              <p className="mt-2 max-w-xs text-sm text-white/80">
                Une case par jour, un défi sécurité à relever.
              </p>
            </div>
            <div className="relative mt-auto pt-6">
              <p className="text-sm font-semibold text-white/90">
                {PHASE_TEST
                  ? `Phase de test : ${JOURS.filter(jourJouable).length} défis à essayer · ${Object.keys(avent).length} relevé${Object.keys(avent).length > 1 ? 's' : ''}`
                  : duJour
                    ? caseFaite
                      ? `Case du ${duJour} déjà relevée · ${Object.keys(avent).length}/24`
                      : `La case du ${duJour} décembre est ouverte !`
                    : avantDebut > 0
                      ? `Ouverture dans ${avantDebut} jour${avantDebut > 1 ? 's' : ''}`
                      : `${Object.keys(avent).length}/24 cases relevées`}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-navy-950 shadow-lg">
                <CalendarDays size={16} /> Voir le calendrier{' '}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
