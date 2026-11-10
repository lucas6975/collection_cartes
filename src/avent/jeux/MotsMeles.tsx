import { Flag, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Button, cx } from '../../components/ui/primitives';
import { etoilesMotsMeles, genererGrille } from '../logic';
import type { Jeu, ResultatJeu } from '../types';
import { Retour } from '../ui';

type Props = {
  jeu: Extract<Jeu, { type: 'motsmeles' }>;
  graine: number;
  onFini: (r: ResultatJeu) => void;
};

const TEINTES = [
  '#22A06B',
  '#2563A6',
  '#C8323A',
  '#C99A17',
  '#6A4FB3',
  '#13896F',
  '#D9542B',
  '#0E7490',
];
const cle = (r: number, c: number) => `${r}-${c}`;

export function MotsMeles({ jeu, graine, onFini }: Props) {
  const [{ grille, places }] = useState(() => genererGrille(jeu.mots, jeu.taille, graine));
  const [trouves, setTrouves] = useState<string[]>([]);
  const [debut, setDebut] = useState<[number, number] | null>(null);
  const [indices, setIndices] = useState<string[]>([]);
  const [rate, setRate] = useState(false);
  const [fini, setFini] = useState<'gagne' | 'abandon' | null>(null);

  // Couleur de chaque case appartenant à un mot trouvé
  const couleurs = new Map<string, string>();
  places.forEach((p, i) => {
    if (trouves.includes(p.mot) || fini === 'abandon')
      p.cases.forEach(([r, c]) => couleurs.set(cle(r, c), TEINTES[i % TEINTES.length]));
  });
  const premieresLettres = new Set(
    places
      .filter((p) => indices.includes(p.mot) && !trouves.includes(p.mot))
      .map((p) => cle(...p.cases[0])),
  );

  const toucher = (r: number, c: number) => {
    if (fini) return;
    if (!debut) return setDebut([r, c]);
    const [r0, c0] = debut;
    setDebut(null);
    if (r0 === r && c0 === c) return;
    const mot = places.find(
      (p) =>
        !trouves.includes(p.mot) &&
        ((cle(...p.cases[0]) === cle(r0, c0) &&
          cle(...p.cases[p.cases.length - 1]) === cle(r, c)) ||
          (cle(...p.cases[0]) === cle(r, c) &&
            cle(...p.cases[p.cases.length - 1]) === cle(r0, c0))),
    );
    if (!mot) {
      setRate(true);
      setTimeout(() => setRate(false), 500);
      return;
    }
    const next = [...trouves, mot.mot];
    setTrouves(next);
    if (next.length === places.length) {
      setFini('gagne');
      onFini(etoilesMotsMeles(indices.length, false, next.length, places.length));
    }
  };

  const indice = () => {
    const reste = places.find((p) => !trouves.includes(p.mot) && !indices.includes(p.mot));
    if (reste) setIndices((i) => [...i, reste.mot]);
  };

  const abandonner = () => {
    setFini('abandon');
    onFini(etoilesMotsMeles(indices.length, true, trouves.length, places.length));
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-medium text-muted">
        {debut
          ? 'Touche maintenant la dernière lettre du mot.'
          : 'Touche la première lettre d’un mot, puis sa dernière lettre.'}
      </p>

      <motion.div
        className="mx-auto grid w-full max-w-[440px] select-none gap-[3px] rounded-2xl bg-navy/[0.06] p-1.5"
        style={{ gridTemplateColumns: `repeat(${jeu.taille}, minmax(0, 1fr))` }}
        animate={rate ? { x: [0, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.35 }}
      >
        {grille.flatMap((ligne, r) =>
          ligne.map((lettre, c) => {
            const couleur = couleurs.get(cle(r, c));
            const choisi = debut && debut[0] === r && debut[1] === c;
            return (
              <motion.button
                key={cle(r, c)}
                type="button"
                onClick={() => toucher(r, c)}
                animate={couleur ? { scale: [1, 1.15, 1] } : {}}
                className={cx(
                  'grid aspect-square place-items-center rounded-md font-display text-[15px] font-extrabold transition-colors sm:text-lg',
                  choisi
                    ? 'bg-sun text-navy-950 ring-2 ring-sun-dark'
                    : couleur
                      ? 'text-white'
                      : 'bg-white text-navy-950 hover:bg-blue-light',
                  premieresLettres.has(cle(r, c)) && !couleur && !choisi && 'ring-2 ring-sun',
                )}
                style={couleur && !choisi ? { background: couleur } : undefined}
                aria-label={`Lettre ${lettre}, ligne ${r + 1}, colonne ${c + 1}`}
              >
                {lettre}
              </motion.button>
            );
          }),
        )}
      </motion.div>

      <div className="flex flex-wrap justify-center gap-2">
        {places.map((p, i) => {
          const ok = trouves.includes(p.mot);
          return (
            <span
              key={p.mot}
              className={cx(
                'rounded-full px-3 py-1 text-sm font-bold',
                ok ? 'text-white line-through' : 'bg-canvas text-navy-950',
              )}
              style={ok ? { background: TEINTES[i % TEINTES.length] } : undefined}
            >
              {p.mot}
            </span>
          );
        })}
      </div>

      {fini === 'gagne' && <Retour ok>Bravo, tous les mots sont trouvés !</Retour>}
      {fini === 'abandon' && <Retour ok={false}>Voici où se cachaient les mots.</Retour>}

      {!fini && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={indice}
            disabled={indices.length + trouves.length >= places.length}
          >
            <Lightbulb size={15} /> Indice
          </Button>
          <Button variant="ghost" size="sm" onClick={abandonner}>
            <Flag size={15} /> Abandonner
          </Button>
        </div>
      )}
    </div>
  );
}
