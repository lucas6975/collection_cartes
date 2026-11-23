// Compte à rebours avant le calendrier de l'Avent : une BD dont chaque jour (J-7 → jour J) est
// une case. Chaque jour, la case du jour s'ouvre en grand puis prend sa place dans la page.
// Les illustrations sont celles de l'annonce de lancement (même style).
// Jouée une fois par jour, à la première ouverture de l'appli (ou au retour dans l'appli) après minuit.
import '@fontsource/bangers/400.css';
import '@fontsource/comic-neue/700.css';
import { X } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { etapeCompteARebours, jourLocal } from '../../domain/compteRebours';

const BASE = import.meta.env.BASE_URL;
const CLE = 'team-ulysse-compte-a-rebours-vu';

// Aperçu de l'administrateur (espace admin) : force l'affichage d'une planche.
let apercu: number | null = null;
const abonnes = new Set<() => void>();
export const apercuCompte = {
  ouvrir(n: number) {
    apercu = n;
    abonnes.forEach((f) => f());
  },
  fermer() {
    apercu = null;
    abonnes.forEach((f) => f());
  },
};
const useApercu = () =>
  useSyncExternalStore(
    (f) => (abonnes.add(f), () => abonnes.delete(f)),
    () => apercu,
    () => null,
  );

function dejaVu(jour: string) {
  try {
    return localStorage.getItem(CLE) === jour;
  } catch {
    return true;
  }
}

/** Monté une fois dans l'appli : décide s'il faut jouer la planche du jour. */
export function CompteARebours() {
  const [etape, setEtape] = useState<number | null>(null);
  const force = useApercu();

  useEffect(() => {
    const verifier = () => {
      const now = new Date();
      const n = etapeCompteARebours(now);
      if (n !== null && !dejaVu(jourLocal(now))) setEtape(n);
    };
    verifier();
    const auRetour = () => document.visibilityState === 'visible' && verifier();
    document.addEventListener('visibilitychange', auRetour);
    return () => document.removeEventListener('visibilitychange', auRetour);
  }, []);

  const affiche = force ?? etape;
  if (affiche === null) return null;
  const fermer = () => {
    if (force !== null) return apercuCompte.fermer();
    try {
      localStorage.setItem(CLE, jourLocal(new Date()));
    } catch {
      /* navigation privée : tant pis, elle se rejouera */
    }
    setEtape(null);
  };
  return createPortal(<PageBD key={affiche} n={affiche} onFermer={fermer} />, document.body);
}

// ───────────── Les 8 cases de la BD ─────────────

interface CaseBD {
  /** 7 → J-7 … 0 → jour J */
  n: number;
  image: string;
  /** Cadrage de l'illustration dans la case. */
  cadrage: string;
  jour: string;
  legende: string;
  large?: boolean;
}

export const CASES_BD: CaseBD[] = [
  {
    n: 7,
    image: 'j7',
    cadrage: '50% 25%',
    jour: 'Mar. 24',
    legende: 'Le calendrier de l’Avent approche… Ulysse le sent.',
  },
  {
    n: 6,
    image: 'j6',
    cadrage: '50% 30%',
    jour: 'Mer. 25',
    legende: 'Il se met en route à travers l’entrepôt.',
  },
  {
    n: 5,
    image: 'j5',
    cadrage: '50% 40%',
    jour: 'Jeu. 26',
    legende: 'Jeudi fou : il fonce ! Légendaires ×3 aujourd’hui ⚡',
    large: true,
  },
  {
    n: 4,
    image: 'j4',
    cadrage: '50% 60%',
    jour: 'Ven. 27',
    legende: 'Pas une minute à perdre… en chaussures de sécu, bien sûr 😉',
  },
  {
    n: 3,
    image: 'j3',
    cadrage: '50% 35%',
    jour: 'Sam. 28',
    legende: 'Une lumière au bout de l’allée…',
  },
  {
    n: 2,
    image: 'j2',
    cadrage: '50% 62%',
    jour: 'Dim. 29',
    legende: 'Un raccourci en chariot ? Autorisation de conduite en poche ✅',
  },
  {
    n: 1,
    image: 'j1',
    cadrage: '50% 40%',
    jour: 'Lun. 30',
    legende: 'Il plonge dans l’appli… Rendez-vous demain, 7 h 30 !',
  },
  {
    n: 0,
    image: 'jj',
    cadrage: '16% 55%',
    jour: 'Mar. 1er',
    legende: 'JOUR J : le calendrier de l’Avent est ouvert ! 🎄',
    large: true,
  },
];

const etiquette = (n: number) => (n ? `J-${n}` : 'JOUR J');
const src = (c: CaseBD) => `${BASE}bd/${c.image}.webp`;

function PageBD({ n, onFermer }: { n: number; onFermer: () => void }) {
  const [phase, setPhase] = useState<'zoom' | 'page'>('zoom');
  const duJour = CASES_BD.find((c) => c.n === n)!;
  const numero = 8 - n;

  useEffect(() => {
    if (phase !== 'zoom') return;
    const t = setTimeout(() => setPhase('page'), 3200);
    return () => clearTimeout(t);
  }, [phase]);
  // Fermeture automatique, 10 secondes après l'affichage de la page.
  useEffect(() => {
    if (phase !== 'page') return;
    const t = setTimeout(onFermer, 10000);
    return () => clearTimeout(t);
  }, [phase, onFermer]);

  return (
    <div
      className="bd-fond fixed inset-0 z-[300] flex flex-col overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`La BD du calendrier, case ${numero} sur 8 : ${duJour.legende}`}
      onClick={() => (phase === 'zoom' ? setPhase('page') : onFermer())}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onFermer();
        }}
        aria-label="Fermer"
        className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] z-30 grid size-10 place-items-center rounded-full border-[3px] border-black bg-white text-black"
      >
        <X size={20} strokeWidth={3} />
      </button>

      <header className="relative mx-4 mt-[max(14px,calc(env(safe-area-inset-top)+4px))] flex items-center gap-2.5 self-start">
        <span className="bd-titre-page">La BD du calendrier</span>
        <span className="bd-cartouche">Case {numero} / 8</span>
      </header>

      {/* La page : les cases déjà sorties, la case du jour, et celles à venir */}
      <div
        className="grid min-h-0 flex-1 grid-cols-2 gap-2.5 px-4 pt-3 pb-2"
        style={{ gridTemplateRows: 'repeat(5, minmax(0, 1fr))' }}
      >
        {CASES_BD.map((c) => {
          const sortie = c.n >= n;
          const aujourdhui = c.n === n;
          return (
            <div
              key={c.n}
              className={`bd-case-page relative min-h-0 overflow-hidden ${c.large ? 'col-span-2' : ''} ${
                aujourdhui ? (phase === 'page' ? 'bd-case-du-jour' : 'opacity-0') : ''
              }`}
            >
              {sortie ? (
                <>
                  <img
                    src={src(c)}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 size-full object-cover"
                    style={{ objectPosition: c.cadrage }}
                  />
                  <span className="bd-etiquette absolute top-1.5 left-1.5">{etiquette(c.n)}</span>
                </>
              ) : (
                <div className="bd-case-cachee absolute inset-0 grid place-items-center text-center">
                  <span>
                    <span className="bd-point-interrogation block">?</span>
                    <span className="bd-jour-cache">{c.jour}</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="bd-indice mb-[max(10px,env(safe-area-inset-bottom))] text-center">
        {phase === 'zoom'
          ? 'Touche pour voir toute la BD'
          : 'Une nouvelle case chaque jour · touche pour continuer'}
      </p>

      {/* La case du jour, en grand */}
      {phase === 'zoom' && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/55 px-5 backdrop-blur-[2px]">
          <div className="bd-zoom relative w-full max-w-[420px]">
            <div className="bd-case-page relative aspect-[4/5] w-full overflow-hidden">
              <img
                src={src(duJour)}
                alt=""
                draggable={false}
                className="absolute inset-0 size-full object-cover"
                style={{ objectPosition: duJour.cadrage }}
              />
              <span className="bd-sticker absolute top-3 left-3">{etiquette(n)}</span>
            </div>
            <p className="bd-legende relative -mt-6 mx-3">{duJour.legende}</p>
          </div>
        </div>
      )}
    </div>
  );
}
