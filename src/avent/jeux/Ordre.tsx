import { ArrowDown, ArrowUp, Check, Eye, GripVertical, X } from 'lucide-react';
import { Reorder, motion, useDragControls } from 'motion/react';
import { useState } from 'react';
import { Button, cx } from '../../components/ui/primitives';
import { etoilesEssais, melangerSansPointFixe } from '../logic';
import type { Jeu, ResultatJeu } from '../types';
import { Retour } from '../ui';

type Props = {
  jeu: Extract<Jeu, { type: 'ordre' }>;
  graine: number;
  onFini: (r: ResultatJeu) => void;
};

type Etat = 'jeu' | 'verifie' | 'gagne' | 'corrige';

function Etape({
  texte,
  index,
  statut,
  verrouille,
  onMove,
  total,
}: {
  texte: string;
  index: number;
  statut: 'neutre' | 'ok' | 'ko';
  verrouille: boolean;
  onMove: (delta: -1 | 1) => void;
  total: number;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={texte}
      dragListener={false}
      dragControls={controls}
      className={cx(
        'relative flex items-center gap-2 rounded-2xl border-2 bg-white py-2.5 pl-2 pr-2 shadow-soft',
        statut === 'neutre' && 'border-line',
        statut === 'ok' && 'border-success bg-success/[0.06]',
        statut === 'ko' && 'border-danger/70 bg-danger/[0.05]',
      )}
      whileDrag={{ scale: 1.03, boxShadow: '0 18px 40px -12px rgba(16,47,90,0.45)', zIndex: 10 }}
      layout="position"
    >
      <button
        type="button"
        onPointerDown={(e) => !verrouille && controls.start(e)}
        className={cx(
          'grid h-11 w-8 shrink-0 touch-none place-items-center rounded-lg text-navy/40',
          !verrouille && 'cursor-grab hover:bg-canvas active:cursor-grabbing',
        )}
        aria-label="Faire glisser pour déplacer"
        disabled={verrouille}
      >
        <GripVertical size={20} />
      </button>
      <span
        className={cx(
          'grid size-8 shrink-0 place-items-center rounded-full font-display text-sm font-extrabold',
          statut === 'ok'
            ? 'bg-success text-white'
            : statut === 'ko'
              ? 'bg-danger text-white'
              : 'bg-navy text-white',
        )}
      >
        {statut === 'ok' ? (
          <Check size={15} strokeWidth={3} />
        ) : statut === 'ko' ? (
          <X size={15} strokeWidth={3} />
        ) : (
          index + 1
        )}
      </span>
      <p className="flex-1 text-[14.5px] font-medium leading-snug text-navy-950">{texte}</p>
      {!verrouille && (
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="grid size-7 place-items-center rounded-md text-navy/50 hover:bg-canvas disabled:opacity-20"
            aria-label="Monter"
          >
            <ArrowUp size={15} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="grid size-7 place-items-center rounded-md text-navy/50 hover:bg-canvas disabled:opacity-20"
            aria-label="Descendre"
          >
            <ArrowDown size={15} />
          </button>
        </div>
      )}
    </Reorder.Item>
  );
}

export function Ordre({ jeu, graine, onFini }: Props) {
  const [ordre, setOrdre] = useState(() => melangerSansPointFixe(jeu.etapes, graine));
  const [etat, setEtat] = useState<Etat>('jeu');
  const [essais, setEssais] = useState(0);
  const verrouille = etat === 'gagne' || etat === 'corrige';
  const bienPlacees = ordre.filter((t, i) => t === jeu.etapes[i]).length;

  const reordonner = (next: string[]) => {
    setOrdre(next);
    if (etat === 'verifie') setEtat('jeu');
  };
  const deplacer = (i: number, delta: -1 | 1) => {
    const next = [...ordre];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    reordonner(next);
  };

  const valider = () => {
    const n = essais + 1;
    setEssais(n);
    if (ordre.every((t, i) => t === jeu.etapes[i])) {
      setEtat('gagne');
      onFini(etoilesEssais(n, false));
    } else {
      setEtat('verifie');
    }
  };

  const voirCorrection = () => {
    setOrdre(jeu.etapes);
    setEtat('corrige');
    onFini(etoilesEssais(essais, true));
  };

  return (
    <div className="space-y-4">
      <Reorder.Group axis="y" values={ordre} onReorder={reordonner} className="space-y-2.5">
        {ordre.map((t, i) => (
          <Etape
            key={t}
            texte={t}
            index={i}
            total={ordre.length}
            verrouille={verrouille}
            onMove={(d) => deplacer(i, d)}
            statut={
              verrouille
                ? 'ok'
                : etat === 'verifie'
                  ? t === jeu.etapes[i]
                    ? 'ok'
                    : 'ko'
                  : 'neutre'
            }
          />
        ))}
      </Reorder.Group>

      {etat === 'verifie' && (
        <Retour ok={false}>
          {bienPlacees}/{ordre.length} étapes bien placées. Déplace les étapes en rouge et réessaie
          !
        </Retour>
      )}
      {etat === 'gagne' && <Retour ok>Bravo, la consigne est dans le bon ordre !</Retour>}
      {etat === 'corrige' && <Retour ok>Voici le bon ordre. Retiens bien ces étapes !</Retour>}

      {!verrouille && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
            <Button variant="accent" size="lg" className="w-full" onClick={valider}>
              <Check size={18} /> Valider l’ordre
            </Button>
          </motion.div>
          {essais >= 2 && (
            <Button variant="ghost" size="lg" onClick={voirCorrection}>
              <Eye size={17} /> Voir la correction
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
