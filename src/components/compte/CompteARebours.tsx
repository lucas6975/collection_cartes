// Compte à rebours avant le calendrier de l'Avent : une planche illustrée dont chaque jour
// (J-7 → jour J) est une case. Les cases à venir sont floutées. En dessous : la vigilance
// partagée (QR code pour faire venir les collègues). Style de l'appli (Manrope, cartes, onglets).
// Jouée une fois par jour, à la première ouverture de l'appli (ou au retour dans l'appli) après minuit.
import { Lock, QrCode, X } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { renderSVG } from 'uqr';
import { etapeCompteARebours, jourLocal } from '../../domain/compteRebours';
import { Neige } from '../../avent/ui';
import { Guirlande } from '../noel/Noel';
import { Button } from '../ui/primitives';

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

function PageBD({ n, onFermer }: { n: number; onFermer: () => void }) {
  const [phase, setPhase] = useState<'zoom' | 'page'>('zoom');
  const [qr, setQr] = useState(false);
  const duJour = CASES_BD.find((c) => c.n === n)!;
  const b = boite(duJour.contour);

  useEffect(() => {
    if (phase !== 'zoom') return;
    const t = setTimeout(() => setPhase('page'), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div
      className="cr-fond fixed inset-0 z-[300] flex flex-col items-center overflow-y-auto select-none"
      style={{
        background: 'radial-gradient(120% 70% at 50% 0%, #D93444 0%, #A8182A 45%, #6E0D1A 100%)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Compte à rebours du calendrier de l’Avent, ${etiquette(n)}`}
      onClick={() => phase === 'zoom' && setPhase('page')}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onFermer();
        }}
        aria-label="Fermer"
        className="fixed top-[max(12px,env(safe-area-inset-top))] right-3 z-30 grid size-10 place-items-center rounded-full bg-white text-navy shadow-soft"
      >
        <X size={20} />
      </button>

      <div className="cr-motif pointer-events-none fixed inset-0" aria-hidden />
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <Neige flocons={46} />
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 h-[env(safe-area-inset-top)]">
        <Guirlande />
      </div>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 h-28"
        style={{ background: 'linear-gradient(transparent, rgba(255,255,255,.22))' }}
        aria-hidden
      />

      <header className="relative mt-[max(30px,calc(env(safe-area-inset-top)+22px))] mb-3 w-full max-w-[440px] px-5">
        <p className="eyebrow text-sun">❄️ Calendrier de l’Avent</p>
        <h1 className="mt-0.5 font-display text-[26px] font-extrabold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.3)]">
          {n ? (
            <>
              Plus que{' '}
              <span className="rounded-lg bg-sun px-2 text-navy-950">
                {n} jour{n > 1 ? 's' : ''}
              </span>
            </>
          ) : (
            'C’est le grand jour ! 🎄'
          )}
        </h1>
      </header>

      {/* La planche : cases passées nettes, case du jour encadrée, cases à venir floutées */}
      <div className="relative w-full max-w-[440px] px-4">
        <div
          className="relative w-full overflow-hidden rounded-3xl bg-white shadow-[0_24px_50px_rgba(40,0,8,.55)] ring-4 ring-white/90"
          style={{ aspectRatio: `${L} / ${H}` }}
        >
          <img src={PLANCHE} alt="" draggable={false} className="absolute inset-0 size-full" />
          {CASES_BD.filter((c) => c.n < n).map((c) => (
            <div key={c.n} className="absolute inset-0" style={{ clipPath: pct(c.contour) }}>
              {/* Case cachée : aucun bout du dessin ne passe, juste du givre */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, rgba(255,255,255,.35), transparent 55%), linear-gradient(160deg, #8E1424, #4A0A14)',
                }}
              />
              <div className="cr-motif absolute inset-0" />
              <CadenasCase c={c} />
            </div>
          ))}
          {phase === 'page' && (
            <svg
              className="cr-surbrillance pointer-events-none absolute inset-0 size-full"
              viewBox={`0 0 ${L} ${H}`}
              aria-hidden
            >
              <polygon
                points={duJour.contour.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke="#F5C542"
                strokeWidth="16"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {phase === 'page' && (
        <div className="cr-bas relative mx-4 mt-4 mb-[max(16px,env(safe-area-inset-bottom))] w-[calc(100%-32px)] max-w-[408px] space-y-3">
          <div className="panel p-4">
            <p className="font-display text-[17px] font-extrabold text-navy-950">
              🤝 Vigilance partagée
            </p>
            <p className="mt-1 text-sm text-muted">
              Un collègue n’a pas encore l’appli ? Montre-lui le QR code : il le scanne et il
              rejoint la Team Ulysse.
            </p>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setQr((v) => !v)}>
              <QrCode size={17} /> {qr ? 'Masquer le QR code' : 'Afficher le QR code'}
            </Button>
            {qr && (
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(renderSVG(LIEN, { ecc: 'M', border: 2 }))}`}
                alt="QR code de l’appli Team Ulysse"
                className="mx-auto mt-3 w-[64%] rounded-2xl ring-1 ring-line"
              />
            )}
          </div>
          <Button variant="accent" size="lg" className="w-full" onClick={onFermer}>
            Continuer vers l’appli →
          </Button>
        </div>
      )}

      {/* La case du jour, en grand */}
      {phase === 'zoom' && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-[#5E0C18]/80 px-4 backdrop-blur-sm">
          <div className="cr-zoom w-full max-w-[440px]">
            <div
              className="w-full overflow-hidden rounded-3xl shadow-lift"
              style={{
                aspectRatio: `${b.w} / ${b.h}`,
                backgroundImage: `url(${PLANCHE})`,
                backgroundSize: `${(L / b.w) * 100}% auto`,
                backgroundPosition: `${(b.x0 / (L - b.w)) * 100}% ${(b.y0 / (H - b.h)) * 100}%`,
              }}
            />
            <p className="mt-3 text-center text-xs font-semibold text-white/75">
              Touche pour voir toute la planche
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
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-display text-[13px] font-extrabold whitespace-nowrap text-navy-950 shadow-soft"
      style={{
        left: `${((b.x0 + b.w / 2) / L) * 100}%`,
        top: `${((b.y0 + b.h / 2) / H) * 100}%`,
      }}
    >
      <Lock size={13} /> {c.jour}
    </span>
  );
}

const LIEN = 'https://lucas6975.github.io/collection_cartes/';
