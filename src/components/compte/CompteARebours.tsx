// Compte à rebours avant le calendrier de l'Avent : une planche de BD de Noël dont chaque jour
// (J-7 → jour J) est une case. Les cases à venir sont floutées, de plus en plus loin, plus
// floues. Après la planche : la vigilance partagée (faire venir les collègues).
// Jouée une fois par jour, à la première ouverture de l'appli (ou au retour dans l'appli) après minuit.
import '@fontsource/bangers/400.css';
import '@fontsource/comic-neue/700.css';
import { X } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { renderSVG } from 'uqr';
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

// ───────────── La planche de Noël : 8 cases, une par jour ─────────────

const PLANCHE = `${BASE}bd/planche-noel.webp`;
const L = 1024;
const H = 1536;

interface CaseBD {
  /** 7 → J-7 … 0 → jour J */
  n: number;
  jour: string;
  /** Contour de la case dans la planche (pixels, planche 1024 × 1536). */
  contour: [number, number][];
}

export const CASES_BD: CaseBD[] = [
  {
    n: 7,
    jour: 'Mar. 24',
    contour: [
      [0, 0],
      [500, 0],
      [470, 402],
      [0, 402],
    ],
  },
  {
    n: 6,
    jour: 'Mer. 25',
    contour: [
      [505, 0],
      [1024, 0],
      [1024, 404],
      [472, 404],
    ],
  },
  {
    n: 5,
    jour: 'Jeu. 26',
    contour: [
      [0, 408],
      [500, 408],
      [470, 752],
      [0, 752],
    ],
  },
  {
    n: 4,
    jour: 'Ven. 27',
    contour: [
      [505, 410],
      [1024, 410],
      [1024, 756],
      [476, 756],
    ],
  },
  {
    n: 3,
    jour: 'Sam. 28',
    contour: [
      [0, 758],
      [498, 758],
      [478, 1080],
      [0, 1080],
    ],
  },
  {
    n: 2,
    jour: 'Dim. 29',
    contour: [
      [505, 762],
      [1024, 762],
      [1024, 1082],
      [480, 1082],
    ],
  },
  {
    n: 1,
    jour: 'Lun. 30',
    contour: [
      [0, 1084],
      [498, 1084],
      [494, 1536],
      [0, 1536],
    ],
  },
  {
    n: 0,
    jour: 'Mar. 1er',
    contour: [
      [500, 1086],
      [1024, 1086],
      [1024, 1536],
      [496, 1536],
    ],
  },
];

const pct = (c: [number, number][]) =>
  `polygon(${c.map(([x, y]) => `${(x / L) * 100}% ${(y / H) * 100}%`).join(', ')})`;
const boite = (c: [number, number][]) => {
  const xs = c.map((p) => p[0]);
  const ys = c.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return { x0, y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
};
const etiquette = (n: number) => (n ? `J-${n}` : 'JOUR J');

/** Flou des cases à venir : de plus en plus flou à mesure qu'elles sont loin. */
const flou = (ecart: number) => 8 + ecart * 5;

function PageBD({ n, onFermer }: { n: number; onFermer: () => void }) {
  const [phase, setPhase] = useState<'zoom' | 'page'>('zoom');
  const duJour = CASES_BD.find((c) => c.n === n)!;
  const b = boite(duJour.contour);

  useEffect(() => {
    if (phase !== 'zoom') return;
    const t = setTimeout(() => setPhase('page'), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div
      className="bd-fond fixed inset-0 z-[300] flex flex-col items-center overflow-y-auto select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`La BD du calendrier, ${etiquette(n)}`}
      onClick={() => phase === 'zoom' && setPhase('page')}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onFermer();
        }}
        aria-label="Fermer"
        className="fixed right-3 top-[max(12px,env(safe-area-inset-top))] z-30 grid size-10 place-items-center rounded-full border-[3px] border-black bg-white text-black"
      >
        <X size={20} strokeWidth={3} />
      </button>

      <header className="mt-[max(14px,calc(env(safe-area-inset-top)+4px))] mb-2 flex w-full max-w-[440px] items-center gap-2.5 px-4">
        <span className="bd-titre-page">La BD du calendrier</span>
        <span className="bd-cartouche">{etiquette(n)}</span>
      </header>

      {/* La planche : les cases passées en clair, celle du jour en surbrillance, les suivantes floutées */}
      <div className="w-full max-w-[440px] px-4">
        <div className="bd-planche relative w-full" style={{ aspectRatio: `${L} / ${H}` }}>
          <img src={PLANCHE} alt="" draggable={false} className="absolute inset-0 size-full" />
          {CASES_BD.filter((c) => c.n < n).map((c) => (
            <div key={c.n} className="absolute inset-0" style={{ clipPath: pct(c.contour) }}>
              <img
                src={PLANCHE}
                alt=""
                draggable={false}
                className="absolute inset-0 size-full"
                style={{ filter: `blur(${flou(n - c.n)}px) saturate(.7) brightness(.85)` }}
              />
              <CadenasCase c={c} />
            </div>
          ))}
          {phase === 'page' && (
            <svg
              className="bd-surbrillance pointer-events-none absolute inset-0 size-full"
              viewBox={`0 0 ${L} ${H}`}
              aria-hidden
            >
              <polygon
                points={duJour.contour.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke="#FFE14D"
                strokeWidth="14"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Après la planche : la vigilance partagée */}
      {phase === 'page' && <Partage onFermer={onFermer} />}

      {/* La case du jour, en grand */}
      {phase === 'zoom' && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/60 px-4 backdrop-blur-[2px]">
          <div className="bd-zoom w-full max-w-[440px]">
            <div
              className="bd-case-page w-full"
              style={{
                aspectRatio: `${b.w} / ${b.h}`,
                backgroundImage: `url(${PLANCHE})`,
                backgroundSize: `${(L / b.w) * 100}% auto`,
                backgroundPosition: `${(b.x0 / (L - b.w)) * 100}% ${(b.y0 / (H - b.h)) * 100}%`,
              }}
            />
            <p className="bd-indice mt-3 text-center !text-white/80">
              Touche pour voir toute la BD
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CadenasCase({ c }: { c: CaseBD }) {
  const b = boite(c.contour);
  return (
    <span
      className="bd-cadenas absolute grid place-items-center text-center"
      style={{
        left: `${((b.x0 + b.w / 2) / L) * 100}%`,
        top: `${((b.y0 + b.h / 2) / H) * 100}%`,
      }}
    >
      <span className="text-[22px] leading-none">🔒</span>
      <span>{c.jour}</span>
    </span>
  );
}

// ───────────── Vigilance partagée : faire venir les collègues ─────────────

const LIEN = 'https://lucas6975.github.io/collection_cartes/';
const MESSAGE =
  'Rejoins la Team Ulysse ! 🦺 Chaque jour une case de la BD, et le 1er décembre le calendrier de l’Avent sécurité avec des cadeaux à gagner 🎁';

function Partage({ onFermer }: { onFermer: () => void }) {
  const [qr, setQr] = useState(false);
  const [copie, setCopie] = useState(false);
  const partager = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Team Ulysse', text: MESSAGE, url: LIEN });
        return;
      }
      await navigator.clipboard.writeText(`${MESSAGE} ${LIEN}`);
      setCopie(true);
    } catch {
      /* partage annulé */
    }
  };
  return (
    <div className="bd-partage mx-4 mt-4 mb-[max(16px,env(safe-area-inset-bottom))] w-[calc(100%-32px)] max-w-[408px]">
      <div className="bd-case-page bg-white p-4">
        <p className="bd-titre-partage">🤝 Vigilance partagée</p>
        <p className="mt-1.5 font-['Comic_Neue'] text-[15px] leading-snug font-bold text-black">
          Ulysse ne veut laisser personne derrière : un collègue n’a pas encore l’appli ? Envoie-lui
          le lien, ou montre-lui le QR code.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => void partager()} className="bd-bouton bg-[#FFE14D]">
            📲 {copie ? 'Lien copié !' : 'Partager'}
          </button>
          <button type="button" onClick={() => setQr((v) => !v)} className="bd-bouton bg-white">
            {qr ? 'Masquer' : '🔳 QR code'}
          </button>
        </div>
        {qr && (
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(renderSVG(LIEN, { ecc: 'M', border: 2 }))}`}
            alt="QR code de l’appli Team Ulysse"
            className="mx-auto mt-3 w-[62%] border-[3px] border-black"
          />
        )}
      </div>
      <button
        type="button"
        onClick={onFermer}
        className="bd-bouton mt-3 w-full bg-[#C8283A] text-white"
      >
        Continuer vers l’appli →
      </button>
    </div>
  );
}
