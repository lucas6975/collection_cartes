import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { JOURS_OUVRES } from '../data/identite';
import { cx } from './ui/primitives';

/** Grille des 24 jours de décembre à cocher pour participer au tirage au sort. */
export function JoursSelection({
  value,
  onChange,
}: {
  value: number[];
  onChange: (jours: number[]) => void;
}) {
  const tous = value.length === JOURS_OUVRES.length;
  const basculer = (j: number) =>
    onChange(
      value.includes(j) ? value.filter((x) => x !== j) : [...value, j].sort((a, b) => a - b),
    );
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-navy-950">
          {value.length === 0
            ? 'Aucun jour choisi'
            : tous
              ? 'Tous les jours'
              : `${value.length} jour${value.length > 1 ? 's' : ''} choisi${value.length > 1 ? 's' : ''}`}
        </p>
        <button
          type="button"
          onClick={() => onChange(tous ? [] : JOURS_OUVRES)}
          className="text-sm font-semibold text-blue hover:underline"
        >
          {tous ? 'Tout décocher' : 'Tout cocher'}
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {JOURS_OUVRES.map((j) => {
          const on = value.includes(j);
          return (
            <motion.button
              key={j}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => basculer(j)}
              aria-pressed={on}
              aria-label={`${j} décembre`}
              className={cx(
                'relative grid aspect-square place-items-center rounded-xl font-display text-base font-extrabold transition-colors',
                on
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-canvas text-navy/40 ring-1 ring-line hover:text-navy',
              )}
            >
              {j}
              {on && (
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-sun text-navy-950 ring-2 ring-white">
                  <Check size={10} strokeWidth={3.5} />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
