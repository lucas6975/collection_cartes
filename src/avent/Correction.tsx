import { Download, FileCheck2, Gift, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from '../components/ui/overlay';
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
      <Modal open={ouverte} onClose={() => setOuverte(false)} title="La correction" size="lg">
        <div className="max-h-[75dvh] overflow-y-auto bg-[#0B2347]">
          <img
            src={imageCorrection(jour)}
            alt={`Correction de la case ${jour}`}
            className="block w-full"
          />
        </div>
        <div className="flex justify-end p-3">
          <a
            href={imageCorrection(jour)}
            download={`correction-case-${jour}.webp`}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-navy hover:bg-canvas"
          >
            <Download size={15} /> Enregistrer l’image
          </a>
        </div>
      </Modal>
    </>
  );
}
