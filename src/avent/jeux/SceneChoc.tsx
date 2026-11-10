import { ArrowLeft, CalendarDays, Check, Clapperboard, Eye, Lightbulb, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/primitives';
import type { JourTermine } from '../progress';
import type { Jeu } from '../types';
import { Confetti, Etoiles, NOEL, Neige } from '../ui';

const ULYSSE_NOEL = `${import.meta.env.BASE_URL}avent/ulysse-noel.webp`;

/** Le jour de la scène choc : pas de jeu, une mise en situation réelle préparée par l'équipe. */
export function SceneChoc({
  jeu,
  deja,
  onDefi,
}: {
  jeu: Extract<Jeu, { type: 'scenechoc' }>;
  deja?: JourTermine;
  onDefi: () => void;
}) {
  const [fete, setFete] = useState(false);
  const releve = !!deja;

  const relever = () => {
    onDefi();
    setFete(true);
    setTimeout(() => setFete(false), 3800);
  };

  return (
    <div className="space-y-5">
      {fete && <Confetti />}

      {/* Ulysse en Père Noël et la scène choc */}
      <section
        className="relative overflow-hidden rounded-3xl p-5 text-white sm:p-7"
        style={{ background: `linear-gradient(150deg, ${NOEL.rouge}, #7A1622)` }}
      >
        <Neige flocons={20} />
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-end">
          <motion.img
            src={ULYSSE_NOEL}
            alt="Ulysse avec son bonnet de Père Noël et son gilet haute visibilité"
            className="h-64 w-auto shrink-0 drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)] sm:h-80"
            initial={{ y: 24, opacity: 0, rotate: -4 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          />
          <div className="pb-2 text-center sm:text-left">
            <motion.span
              className="inline-flex items-center gap-1.5 rounded-full bg-[#15171C] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-sun"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <Clapperboard size={12} /> En vrai, pas sur l’écran
            </motion.span>
            <p className="mt-3 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
              Aujourd’hui, pas de jeu : place à la scène choc !
            </p>
            <p className="mt-2 text-[15px] text-white/85">
              La Team Ulysse met en place une situation réelle à IMECA. La personne tirée au sort
              pour ce jour vient intervenir sur le cas préparé par l’équipe.
            </p>
            <Link
              to="/moi"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-navy-950 shadow-lg"
            >
              <Ticket size={16} /> Suis-je tiré au sort ?
            </Link>
          </div>
        </div>
      </section>

      {/* L'anecdote du jour, pour tout le monde */}
      <section className="panel p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sun-dark">
          <Lightbulb size={15} /> L’anecdote d’Ulysse
        </p>
        <h2 className="mt-2 font-display text-xl font-extrabold text-navy-950">
          {jeu.anecdote.titre}
        </h2>
        {/* Pyramide 1 / 29 / 300 */}
        <div className="mx-auto mt-4 flex max-w-sm flex-col items-center gap-1.5">
          {[
            { n: '1', label: 'accident grave', w: '34%', bg: NOEL.rouge },
            { n: '29', label: 'accidents légers', w: '64%', bg: '#E08A2C' },
            { n: '300', label: 'incidents sans blessure', w: '100%', bg: '#F5C542' },
          ].map((e, i) => (
            <motion.div
              key={e.n}
              className="rounded-lg px-3 py-2 text-center text-sm font-bold text-navy-950"
              style={{ width: e.w, background: e.bg, color: i === 0 ? '#fff' : undefined }}
              initial={{ opacity: 0, scaleX: 0.6 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4 + 0.15 * (2 - i) }}
            >
              <span className="font-display text-lg font-extrabold">{e.n}</span>{' '}
              <span className="text-xs font-semibold">{e.label}</span>
            </motion.div>
          ))}
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-ink/85">{jeu.anecdote.texte}</p>
      </section>

      {/* Le défi au poste */}
      <section className="panel p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue">
          <Eye size={15} /> Le défi du jour, pour tous
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/85">{jeu.defi}</p>
        {releve ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-success/[0.08] px-4 py-3 font-semibold text-navy-950">
            <Check size={18} className="text-success" /> Défi relevé, merci !
            <Etoiles n={deja!.etoiles} size={18} />
          </div>
        ) : (
          <Button variant="accent" size="lg" className="mt-4" onClick={relever}>
            <Check size={18} /> J’ai relevé le défi
          </Button>
        )}
      </section>

      <div className="flex justify-center">
        <Link
          to="/avent"
          className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-navy hover:bg-navy/5"
        >
          {releve ? <CalendarDays size={16} /> : <ArrowLeft size={16} />} Retour au calendrier
        </Link>
      </div>
    </div>
  );
}
