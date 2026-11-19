import { Recycle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { game, useGame, type PackResultat } from '../data/store';
import {
  RECYCLAGE_COUT,
  RecyclageImpossible,
  choixParDefaut,
  copiesEnTrop,
  recyclagesDuJour,
  RECYCLAGES_PAR_JOUR,
  totalEnTrop,
} from '../domain/recyclage';
import { GameCard } from './cards/GameCard';
import { PackOpening } from './cards/PackOpening';
import { Modal, useToast } from './ui/overlay';
import { Button, cx } from './ui/primitives';

/** Encadré compact de la page Collection : 5 doublons = 1 pack bonus (une fois par jour). */
export function Recyclage() {
  const { progress, cards } = useGame();
  const toast = useToast();
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const [choix, setChoix] = useState<Record<string, number>>({});
  const [pack, setPack] = useState<PackResultat | null>(null);

  const enTrop = totalEnTrop(progress, cards);
  const fait = recyclagesDuJour(progress, new Date()) >= RECYCLAGES_PAR_JOUR;
  const possible = enTrop >= RECYCLAGE_COUT && !fait;
  const liste = copiesEnTrop(progress, cards);
  const nChoisis = Object.values(choix).reduce((n, x) => n + x, 0);

  const ouvrir = () => {
    setChoix(choixParDefaut(progress, cards));
    setOuvert(true);
  };

  // Toucher une carte ajoute une copie ; arrivé au maximum, on repart de zéro.
  const toucher = (id: string, max: number) =>
    setChoix((c) => {
      const n = c[id] ?? 0;
      const total = Object.values(c).reduce((s, x) => s + x, 0);
      const suivant = n < max && total < RECYCLAGE_COUT ? n + 1 : 0;
      const next = { ...c, [id]: suivant };
      if (!suivant) delete next[id];
      return next;
    });

  const recycler = () => {
    try {
      const r = game.recycler(choix);
      setOuvert(false);
      setPack(r);
    } catch (e) {
      toast(e instanceof RecyclageImpossible ? e.message : 'Erreur, réessaie.', 'error');
    }
  };

  if (!enTrop) return null;

  return (
    <>
      <section className="panel mb-6 flex items-center gap-3 px-4 py-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
          <Recycle size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-navy-950">Recycler mes doublons</p>
          <p className="text-xs text-muted">
            {fait
              ? 'Déjà recyclé aujourd’hui : prochain pack bonus demain !'
              : enTrop >= RECYCLAGE_COUT
                ? `${RECYCLAGE_COUT} doublons = 1 pack bonus · tu en as ${enTrop}`
                : `Encore ${RECYCLAGE_COUT - enTrop} doublon${RECYCLAGE_COUT - enTrop > 1 ? 's' : ''} pour un pack bonus`}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={ouvrir} disabled={!possible}>
          <Recycle size={15} /> Recycler
        </Button>
      </section>

      <Modal open={ouvert} onClose={() => setOuvert(false)} title="Recycler 5 doublons" size="lg">
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm text-muted">
            Les plus courants sont déjà choisis. <b className="text-navy-950">Touche une carte</b>{' '}
            pour en ajouter ou en retirer. Tu gardes toujours un exemplaire de chaque carte.
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {liste.map(({ card, enTrop: max }) => {
              const n = choix[card.id] ?? 0;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => toucher(card.id, max)}
                  className={cx(
                    'relative rounded-2xl p-1 transition-all',
                    n ? 'bg-success/15 ring-[3px] ring-success' : 'opacity-75 hover:opacity-100',
                  )}
                >
                  <GameCard
                    card={card}
                    total={cards.length}
                    size="sm"
                    className="w-full"
                    tilt={false}
                  />
                  <span className="mt-1 block text-center text-[11px] font-bold text-muted">
                    {max} en trop
                  </span>
                  {n > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex items-center gap-0.5 rounded-full bg-success px-2 py-0.5 text-xs font-extrabold text-white shadow">
                      <Recycle size={11} /> {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="sticky bottom-0 -mx-5 border-t border-line bg-white px-5 pt-3 sm:-mx-6 sm:px-6">
            <p className="mb-2 text-center text-sm font-semibold text-navy-950">
              {nChoisis} / {RECYCLAGE_COUT} doublons choisis
            </p>
            <Button
              variant="accent"
              size="lg"
              className="w-full"
              onClick={recycler}
              disabled={nChoisis !== RECYCLAGE_COUT}
            >
              <Recycle size={18} /> Recycler et ouvrir mon pack bonus
            </Button>
            <p className="mt-2 text-center text-xs text-muted">
              Le pack bonus contient au moins une nouvelle carte si ta collection n’est pas
              complète. 1 recyclage par jour.
            </p>
          </div>
        </div>
      </Modal>

      <PackOpening
        result={pack}
        total={cards.length}
        onClose={() => setPack(null)}
        onCollection={() => {
          setPack(null);
          navigate('/collection');
        }}
      />
    </>
  );
}
