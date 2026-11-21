import { useEffect, useState } from 'react';
import { Confetti } from '../avent/ui';
import { CARDS } from '../content/cards';
import { api } from '../data/api';
import { identiteStore, useIdentite } from '../data/identite';
import { game } from '../data/store';
import { GameCard } from './cards/GameCard';
import { CarteSpeciale } from './speciales/CarteSpeciale';
import { speciale } from '../content/speciales';
import { Modal } from './ui/overlay';
import { Button } from './ui/primitives';

let enCours = false;

/** Cartes offertes par l'administrateur : récupérées à l'ouverture de l'appli, puis affichées. */
export function CadeauxRecus() {
  const { identite } = useIdentite();
  const [recues, setRecues] = useState<string[]>([]);
  const jeton = identite?.synchro ? identite.jeton : undefined;

  useEffect(() => {
    if (!jeton) return;
    const verifier = async () => {
      if (enCours || identiteStore.get().identite?.jeton !== jeton) return;
      enCours = true;
      try {
        const cartes = await api.recupererCadeaux(jeton);
        if (cartes?.length) {
          cartes.forEach((id) => game.recevoirCarte(id));
          setRecues((r) => [...r, ...cartes]);
        }
      } catch {
        /* réessayé à la prochaine ouverture */
      } finally {
        enCours = false;
      }
    };
    void verifier();
    const auRetour = () => document.visibilityState === 'visible' && void verifier();
    document.addEventListener('visibilitychange', auRetour);
    return () => document.removeEventListener('visibilitychange', auRetour);
  }, [jeton]);

  const carte = CARDS.find((c) => c.id === recues[0]);
  const spe = recues[0] ? speciale(recues[0]) : undefined;
  return (
    <Modal open={!!carte || !!spe} onClose={() => setRecues((r) => r.slice(1))} size="sm">
      {spe && (
        <div className="relative overflow-hidden p-6 text-center">
          <Confetti />
          <p className="eyebrow text-[#C8283A]">✨ Carte unique</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-navy-950">
            {spe.de} t’envoie une carte spéciale !
          </h2>
          <div className="mx-auto mt-5 w-[66%]">
            <CarteSpeciale carte={spe} />
          </div>
          <p className="mt-4 text-sm text-muted">
            Un seul exemplaire au monde. Elle rejoint ta collection 🗂️
          </p>
          <Button
            variant="accent"
            size="lg"
            className="mt-5 w-full"
            onClick={() => setRecues((r) => r.slice(1))}
          >
            Merci {spe.de} ! 🙌
          </Button>
        </div>
      )}
      {carte && (
        <div className="relative overflow-hidden p-6 text-center">
          <Confetti />
          <p className="eyebrow text-[#C8283A]">🎁 Cadeau</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-navy-950">
            Une carte rien que pour toi !
          </h2>
          <div className="mx-auto mt-5 w-[62%]">
            <GameCard card={carte} total={CARDS.length} size="lg" className="w-full" isNew />
          </div>
          <p className="mt-4 text-sm text-muted">
            Offerte par la Team Ulysse. Elle rejoint ta collection 🗂️
          </p>
          <Button
            variant="accent"
            size="lg"
            className="mt-5 w-full"
            onClick={() => setRecues((r) => r.slice(1))}
          >
            Merci ! 🙌
          </Button>
        </div>
      )}
    </Modal>
  );
}
