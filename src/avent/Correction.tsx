import { ArrowLeft, Download, FileCheck2, Gift, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../components/ui/primitives';
import { api } from '../data/api';
import { useIdentite } from '../data/identite';

/** Image de correction d'une case (générée avec la même maquette pour toutes les cases). */
export const imageCorrection = (jour: number) =>
  `${import.meta.env.BASE_URL}avent/corrections/jour-${jour}.webp`;

type Etat = 'verification' | 'visible' | 'bloquee';

/**
 * Bouton « Voir la correction », affiché à la fin d'une case.
 * La personne tirée au sort ce jour-là ne la voit qu'une fois débloquée par l'administrateur.
 */
export function Correction({ jour }: { jour: number }) {
  const { identite, codeAdmin } = useIdentite();
  const [etat, setEtat] = useState<Etat>(
    codeAdmin || !identite?.jeton ? 'visible' : 'verification',
  );
  const [ouverte, setOuverte] = useState(false);
  const [essai, setEssai] = useState(0);

  useEffect(() => {
    if (codeAdmin || !identite?.jeton) return;
    let actif = true;
    api
      .correctionBloquee(identite.jeton, jour)
      .then((b) => actif && setEtat(b ? 'bloquee' : 'visible'))
      // Base injoignable : on ne prive personne de sa correction.
      .catch(() => actif && setEtat('visible'));
    return () => {
      actif = false;
    };
  }, [codeAdmin, identite?.jeton, jour, essai]);

  if (etat === 'verification') {
    return <p className="text-sm text-white/70">Préparation de la correction…</p>;
  }

  if (etat === 'bloquee') {
    return (
      <div className="mx-auto max-w-sm rounded-2xl bg-white/12 px-4 py-3 text-left text-sm text-white">
        <p className="flex items-center gap-2 font-display font-extrabold">
          <Gift size={18} className="text-sun" /> Tu es tiré(e) au sort aujourd’hui !
        </p>
        <p className="mt-1 text-white/80">
          Ta correction sera débloquée par la Team Ulysse. Reviens un peu plus tard.
        </p>
        <button
          type="button"
          onClick={() => {
            setEtat('verification');
            setEssai((n) => n + 1);
          }}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-sun hover:underline"
        >
          <RefreshCw size={13} /> Vérifier à nouveau
        </button>
      </div>
    );
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOuverte(true)}>
        <FileCheck2 size={17} /> Voir la correction
      </Button>
      <AnimatePresence>
        {ouverte && <PleinEcran jour={jour} onClose={() => setOuverte(false)} />}
      </AnimatePresence>
    </>
  );
}

/** La correction en plein écran, avec un bouton Retour toujours visible en haut. */
function PleinEcran({ jour, onClose }: { jour: number; onClose: () => void }) {
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const touche = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', touche);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener('keydown', touche);
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col bg-[#0B2347]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Correction de la case ${jour}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 bg-[#0B2347]/95 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-bold text-navy-950 shadow"
        >
          <ArrowLeft size={18} /> Retour
        </button>
        <a
          href={imageCorrection(jour)}
          download={`correction-case-${jour}.webp`}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-white/85 hover:bg-white/10"
        >
          <Download size={16} /> Enregistrer
        </a>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        <img
          src={imageCorrection(jour)}
          alt={`Correction de la case ${jour}`}
          className="mx-auto block w-full max-w-3xl"
        />
      </div>
    </motion.div>,
    document.body,
  );
}
