// Compte à rebours avant le calendrier de l'Avent, en BD : une planche par jour (J-7 → jour J).
// Ulysse (dessins officiels, jamais redessinés) part rejoindre le calendrier du Père Noël.
// Jouée une fois par jour, à la première ouverture de l'appli (ou au retour dans l'appli) après minuit.
import '@fontsource/bangers/400.css';
import '@fontsource/comic-neue/700.css';
import { X } from 'lucide-react';
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { etapeCompteARebours, jourLocal } from '../../domain/compteRebours';

const BASE = import.meta.env.BASE_URL;
const CLE = 'team-ulysse-compte-a-rebours-vu';
const img = (nom: string) => `${BASE}${nom}`;

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
  return createPortal(<Planche key={affiche} n={affiche} onFermer={fermer} />, document.body);
}

// ───────────── Le contenu des planches ─────────────

type Fond =
  | 'trame-jaune'
  | 'trame-bleue'
  | 'trame-rouge'
  | 'trame-verte'
  | 'vitesse'
  | 'vitesse-or'
  | 'neige'
  | 'nuit';
interface Case {
  fond: Fond;
  ulysse?: { src: string; style: CSSProperties };
  bulle?: { texte: ReactNode; style: CSSProperties; queue?: 'gauche' | 'droite' };
  sfx?: { texte: string; style: CSSProperties; couleur?: string };
  objet?: ReactNode;
}
interface PlancheBD {
  titre: string;
  cases: [Case, Case];
}

const MASCOTTE = 'mascotte.webp';
const NOEL = 'avent/ulysse-noel.webp';
const PROFIL = 'ulysse-profil.webp';
const COURSE = 'ulysse-course.webp';
const SAUT = 'ulysse-saut.webp';

export const PLANCHES: Record<number, PlancheBD> = {
  7: {
    titre: 'La lettre',
    cases: [
      {
        fond: 'trame-jaune',
        ulysse: { src: MASCOTTE, style: { left: '-10%', bottom: '-30%', height: '118%' } },
        objet: <Lettre />,
        bulle: {
          texte: 'Une lettre… du Père Noël ?!',
          style: { right: '5%', top: '8%', width: '46%' },
          queue: 'gauche',
        },
      },
      {
        fond: 'vitesse',
        ulysse: { src: PROFIL, style: { left: '4%', bottom: '4%', width: '74%' } },
        bulle: {
          texte: 'Le calendrier ouvre dans 7 jours… J’y vais !',
          style: { right: '4%', top: '7%', width: '50%' },
          queue: 'gauche',
        },
        sfx: { texte: 'ZOOOM !', style: { right: '6%', bottom: '8%', transform: 'rotate(-8deg)' } },
      },
    ],
  },
  6: {
    titre: 'En route',
    cases: [
      {
        fond: 'neige',
        ulysse: { src: COURSE, style: { left: '6%', bottom: '-10%', height: '112%' } },
        bulle: {
          texte: 'Chaque jour de décembre, des cadeaux à gagner…',
          style: { right: '4%', top: '8%', width: '48%' },
          queue: 'gauche',
        },
      },
      {
        fond: 'trame-rouge',
        ulysse: { src: PROFIL, style: { right: '2%', bottom: '4%', width: '72%' } },
        bulle: {
          texte: '…pas question d’arriver en retard !',
          style: { left: '4%', top: '8%', width: '46%' },
          queue: 'droite',
        },
        sfx: {
          texte: 'HOP HOP !',
          style: { left: '6%', bottom: '10%', transform: 'rotate(-6deg)' },
        },
      },
    ],
  },
  5: {
    titre: 'Jeudi fou',
    cases: [
      {
        fond: 'vitesse-or',
        objet: <Eclair />,
        ulysse: { src: COURSE, style: { right: '4%', bottom: '-12%', height: '112%' } },
        bulle: {
          texte: 'Légendaires ×3 aujourd’hui ?!',
          style: { left: '4%', bottom: '8%', width: '44%' },
          queue: 'droite',
        },
      },
      {
        fond: 'trame-bleue',
        ulysse: { src: MASCOTTE, style: { left: '0%', bottom: '-36%', height: '130%' } },
        bulle: {
          texte: 'Petite pause : j’ouvre mon pack d’abord 😏',
          style: { right: '4%', top: '10%', width: '50%' },
          queue: 'gauche',
        },
      },
    ],
  },
  4: {
    titre: 'Le croisement',
    cases: [
      {
        fond: 'neige',
        objet: <PanneauStop />,
        ulysse: { src: PROFIL, style: { left: '-4%', bottom: '4%', width: '68%' } },
        sfx: { texte: 'SKRRRT !', style: { left: '8%', top: '8%', transform: 'rotate(-8deg)' } },
      },
      {
        fond: 'trame-verte',
        ulysse: { src: MASCOTTE, style: { right: '0%', bottom: '-36%', height: '130%' } },
        bulle: {
          texte: 'Même pressé : je m’arrête et je regarde. Règle n°4 !',
          style: { left: '4%', top: '9%', width: '50%' },
          queue: 'droite',
        },
      },
    ],
  },
  3: {
    titre: 'Au loin…',
    cases: [
      {
        fond: 'nuit',
        objet: <CalendrierLointain />,
        ulysse: { src: SAUT, style: { left: '2%', bottom: '-30%', height: '115%' } },
        bulle: {
          texte: 'Là-bas… le calendrier !',
          style: { right: '4%', bottom: '10%', width: '42%' },
          queue: 'gauche',
        },
      },
      {
        fond: 'vitesse',
        ulysse: {
          src: COURSE,
          style: { left: '50%', bottom: '-14%', height: '116%', transform: 'translateX(-50%)' },
        },
        sfx: {
          texte: 'J’ARRIIIVE !',
          style: { left: '6%', top: '10%', transform: 'rotate(-8deg)' },
        },
      },
    ],
  },
  2: {
    titre: 'Le bonnet',
    cases: [
      {
        fond: 'neige',
        ulysse: { src: MASCOTTE, style: { left: '0%', bottom: '-36%', height: '130%' } },
        bulle: {
          texte: 'Pour Noël, il manque quelque chose…',
          style: { right: '4%', top: '10%', width: '48%' },
          queue: 'gauche',
        },
      },
      {
        fond: 'trame-rouge',
        ulysse: { src: NOEL, style: { right: '2%', bottom: '-30%', height: '134%' } },
        bulle: {
          texte: 'Voilà ! Paré pour Noël 🎅',
          style: { left: '4%', top: '12%', width: '44%' },
          queue: 'droite',
        },
        sfx: { texte: 'TADAA !', style: { left: '8%', bottom: '10%', transform: 'rotate(-6deg)' } },
      },
    ],
  },
  1: {
    titre: 'Le cadenas',
    cases: [
      {
        fond: 'nuit',
        objet: <PorteCadenas />,
        ulysse: { src: MASCOTTE, style: { left: '-12%', bottom: '-36%', height: '118%' } },
        bulle: {
          texte: 'Cadenassé ?!',
          style: { left: '30%', top: '8%', width: '34%' },
          queue: 'gauche',
        },
      },
      {
        fond: 'trame-jaune',
        ulysse: { src: NOEL, style: { right: '0%', bottom: '-30%', height: '134%' } },
        bulle: {
          texte: 'Normal : un cadenas, on ne le force jamais. Rendez-vous demain, 7 h 30 !',
          style: { left: '4%', top: '8%', width: '52%' },
          queue: 'droite',
        },
      },
    ],
  },
  0: {
    titre: 'Le grand jour',
    cases: [
      {
        fond: 'vitesse-or',
        objet: <PorteOuverte />,
        sfx: {
          texte: 'C’EST PARTI !',
          style: { left: '50%', top: '8%', transform: 'translateX(-50%) rotate(-5deg)' },
          couleur: '#C8283A',
        },
      },
      {
        fond: 'trame-bleue',
        ulysse: { src: SAUT, style: { right: '4%', bottom: '-26%', height: '120%' } },
        bulle: {
          texte: 'Case n°1 ouverte : à toi de jouer !',
          style: { left: '4%', top: '10%', width: '46%' },
          queue: 'droite',
        },
      },
    ],
  },
};

// ───────────── La planche ─────────────

function Planche({ n, onFermer }: { n: number; onFermer: () => void }) {
  const p = PLANCHES[n];
  // Fermeture automatique après 12 secondes.
  useEffect(() => {
    const t = setTimeout(onFermer, 12000);
    return () => clearTimeout(t);
  }, [onFermer]);

  return (
    <div
      className="bd-fond fixed inset-0 z-[300] flex flex-col overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
      aria-label={
        n
          ? `J-${n} avant le calendrier de l’Avent : ${p.titre}`
          : 'Le calendrier de l’Avent est ouvert'
      }
      onClick={onFermer}
    >
      <button
        type="button"
        onClick={onFermer}
        aria-label="Fermer"
        className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] z-20 grid size-10 place-items-center rounded-full border-[3px] border-black bg-white text-black"
      >
        <X size={20} strokeWidth={3} />
      </button>

      {/* Titre de l'épisode */}
      <header className="bd-titre relative mx-4 mt-[max(14px,calc(env(safe-area-inset-top)+4px))] flex items-center gap-3 self-start">
        <span className="bd-jour">{n ? `J-${n}` : 'JOUR J'}</span>
        <span className="bd-cartouche">
          {n ? `Épisode ${8 - n}` : 'Final'} · {p.titre}
        </span>
      </header>

      {/* Les deux cases */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-3 pb-2">
        {p.cases.map((c, i) => (
          <CaseBD key={i} c={c} i={i} />
        ))}
      </div>

      <p className="bd-indice mb-[max(10px,env(safe-area-inset-bottom))] text-center">
        Touche pour continuer
      </p>
    </div>
  );
}

function CaseBD({ c, i }: { c: Case; i: number }) {
  const t0 = 0.25 + i * 1.3;
  return (
    <div
      className={`bd-case bd-${c.fond} relative min-h-0 flex-1 overflow-hidden`}
      style={{ animationDelay: `${t0}s`, ['--bd-dir' as string]: i ? '1' : '-1' }}
    >
      {c.objet}
      {c.ulysse && (
        <img
          src={img(c.ulysse.src)}
          alt=""
          draggable={false}
          className="bd-ulysse absolute max-w-none"
          style={{ ...c.ulysse.style, animationDelay: `${t0 + 0.2}s` }}
        />
      )}
      {c.bulle && (
        <div
          className={`bd-bulle absolute bd-queue-${c.bulle.queue ?? 'gauche'}`}
          style={{ ...c.bulle.style, animationDelay: `${t0 + 0.6}s` }}
        >
          {c.bulle.texte}
        </div>
      )}
      {c.sfx && (
        <span
          className="bd-sfx absolute"
          style={{ ...c.sfx.style, color: c.sfx.couleur, animationDelay: `${t0 + 0.75}s` }}
        >
          {c.sfx.texte}
        </span>
      )}
    </div>
  );
}

// ───────────── Les objets dessinés (traits noirs, style BD) ─────────────

function Lettre() {
  return (
    <div className="bd-objet absolute right-[5%] bottom-[9%] w-[46%] rotate-[6deg] border-[3px] border-black bg-[#fffaf0] p-2 shadow-[5px_5px_0_#000]">
      <p className="font-['Comic_Neue'] text-[11px] leading-tight font-bold text-black">
        Cher Ulysse,
        <br />
        j’ai besoin de toi pour le calendrier de l’Avent !
        <br />
        <span className="float-right">— P.N. 🎅</span>
      </p>
      <span className="absolute -bottom-3 -left-3 grid size-8 place-items-center rounded-full border-[3px] border-black bg-[#C8283A] text-xs">
        ⭐
      </span>
    </div>
  );
}

function Eclair() {
  return (
    <svg className="bd-objet absolute top-[4%] left-[2%] w-[56%]" viewBox="0 0 200 120" aria-hidden>
      <polygon
        points="100,4 118,34 154,18 146,52 196,58 152,78 172,112 124,94 100,118 80,92 30,110 50,76 4,62 50,48 38,14 80,32"
        fill="#FFE14D"
        stroke="#000"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <text
        x="100"
        y="58"
        textAnchor="middle"
        fontFamily="Bangers"
        fontSize="30"
        fill="#C8283A"
        stroke="#000"
        strokeWidth="1.2"
      >
        JEUDI FOU
      </text>
      <text x="100" y="86" textAnchor="middle" fontFamily="Bangers" fontSize="26" fill="#000">
        ⚡ ×3 ⚡
      </text>
    </svg>
  );
}

function PanneauStop() {
  return (
    <svg
      className="bd-objet absolute right-[8%] bottom-[6%] h-[82%]"
      viewBox="0 0 80 160"
      aria-hidden
    >
      <rect x="36" y="60" width="8" height="100" fill="#9aa3ae" stroke="#000" strokeWidth="3" />
      <polygon
        points="24,4 56,4 76,24 76,56 56,76 24,76 4,56 4,24"
        fill="#D42A3C"
        stroke="#000"
        strokeWidth="4"
      />
      <polygon
        points="27,10 53,10 70,27 70,53 53,70 27,70 10,53 10,27"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
      />
      <text x="40" y="49" textAnchor="middle" fontFamily="Bangers" fontSize="24" fill="#fff">
        STOP
      </text>
    </svg>
  );
}

function CalendrierLointain() {
  return (
    <svg className="bd-objet absolute top-[6%] right-[4%] w-[36%]" viewBox="0 0 100 90" aria-hidden>
      <circle cx="50" cy="44" r="44" fill="#FFE9A8" opacity=".35" />
      <rect
        x="20"
        y="20"
        width="60"
        height="50"
        rx="5"
        fill="#C8283A"
        stroke="#000"
        strokeWidth="3"
      />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((k) => (
          <rect
            key={`${r}${k}`}
            x={26 + k * 17}
            y={26 + r * 14}
            width="13"
            height="10"
            rx="2"
            fill={r + k === 0 ? '#FFE14D' : '#0B2347'}
            stroke="#000"
            strokeWidth="1.5"
          />
        )),
      )}
      <path
        d="M10 14 l6 6 M90 14 l-6 6 M50 2 v8"
        stroke="#FFE14D"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PorteCadenas() {
  return (
    <svg
      className="bd-objet absolute right-[4%] bottom-[6%] h-[88%]"
      viewBox="0 0 120 150"
      aria-hidden
    >
      <rect
        x="6"
        y="6"
        width="108"
        height="138"
        rx="8"
        fill="#C8283A"
        stroke="#000"
        strokeWidth="4"
      />
      <rect
        x="22"
        y="22"
        width="76"
        height="106"
        rx="6"
        fill="#0B2347"
        stroke="#FFE14D"
        strokeWidth="4"
      />
      <text x="60" y="68" textAnchor="middle" fontFamily="Bangers" fontSize="40" fill="#FFE14D">
        1
      </text>
      <path d="M48 92 v-12 a12 12 0 0 1 24 0 v12" fill="none" stroke="#000" strokeWidth="6" />
      <path d="M48 92 v-12 a12 12 0 0 1 24 0 v12" fill="none" stroke="#c9ced6" strokeWidth="3" />
      <rect
        x="42"
        y="90"
        width="36"
        height="28"
        rx="4"
        fill="#F5C542"
        stroke="#000"
        strokeWidth="3"
      />
      <circle cx="60" cy="102" r="3" fill="#000" />
      <g transform="translate(66 108) rotate(10)">
        <rect x="0" y="0" width="34" height="20" rx="2" fill="#fff" stroke="#000" strokeWidth="2" />
        <text x="17" y="9" textAnchor="middle" fontFamily="Bangers" fontSize="7.5" fill="#C8283A">
          NE PAS OUVRIR
        </text>
        <text x="17" y="17" textAnchor="middle" fontFamily="Bangers" fontSize="7.5" fill="#000">
          AVANT 7H30
        </text>
      </g>
    </svg>
  );
}

function PorteOuverte() {
  return (
    <svg
      className="bd-objet absolute bottom-[2%] left-1/2 h-[78%] -translate-x-1/2"
      viewBox="0 0 160 150"
      aria-hidden
    >
      <g className="bd-rayons" style={{ transformOrigin: '80px 80px' }}>
        {Array.from({ length: 14 }, (_, i) => (
          <path
            key={i}
            d="M80 80 L72 -60 L88 -60 Z"
            fill="#FFF3B0"
            transform={`rotate(${i * (360 / 14)} 80 80)`}
          />
        ))}
      </g>
      <rect
        x="30"
        y="20"
        width="100"
        height="126"
        rx="8"
        fill="#C8283A"
        stroke="#000"
        strokeWidth="4"
      />
      <rect
        x="44"
        y="34"
        width="72"
        height="98"
        rx="5"
        fill="#FFF6D0"
        stroke="#000"
        strokeWidth="3"
      />
      <path d="M44 34 L22 44 L22 142 L44 132 Z" fill="#0B2347" stroke="#000" strokeWidth="3" />
      <text
        x="80"
        y="96"
        textAnchor="middle"
        fontFamily="Bangers"
        fontSize="52"
        fill="#C8283A"
        stroke="#000"
        strokeWidth="1.5"
      >
        1
      </text>
    </svg>
  );
}
