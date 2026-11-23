// Animation plein écran du compte à rebours (J-7 → J-1, puis le jour J), sur fond noir OLED.
// Jouée une fois par jour, à la première ouverture de l'appli (ou au retour dans l'appli) après minuit.
import { X } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { JOURS } from '../../avent/jours';
import {
  MESSAGES_COMPTE,
  etapeCompteARebours,
  jourLocal,
  tailleUlysse,
} from '../../domain/compteRebours';

const BASE = import.meta.env.BASE_URL;
const CLE = 'team-ulysse-compte-a-rebours-vu';

// Aperçu de l'administrateur (espace admin) : force l'affichage d'une étape.
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

/** Monté une fois dans l'appli : décide s'il faut jouer l'animation aujourd'hui. */
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
  return createPortal(<Animation key={affiche} n={affiche} onFermer={fermer} />, document.body);
}

function Animation({ n, onFermer }: { n: number; onFermer: () => void }) {
  const jourJ = n === 0;
  const msg = MESSAGES_COMPTE[n];
  const taille = tailleUlysse(n);
  const [particules] = useState(() =>
    Array.from({ length: 42 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      t: 2 + Math.random() * 4,
      d: 6 + Math.random() * 9,
      delai: -Math.random() * 15,
      or: Math.random() < 0.35,
      o: 0.35 + Math.random() * 0.6,
    })),
  );

  // Fermeture automatique après 9 secondes.
  useEffect(() => {
    const t = setTimeout(onFermer, 9000);
    return () => clearTimeout(t);
  }, [onFermer]);

  return (
    <div
      className="cr-fond fixed inset-0 z-[300] flex flex-col overflow-hidden bg-black text-white select-none"
      role="dialog"
      aria-modal="true"
      aria-label={
        jourJ ? 'Le calendrier de l’Avent est ouvert' : `J-${n} avant le calendrier de l’Avent`
      }
      onClick={onFermer}
    >
      {/* Particules : neige et poussière d'or */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {particules.map((p) => (
          <span
            key={p.id}
            className="cr-particule absolute -top-3 block rounded-full"
            style={{
              left: `${p.x}%`,
              width: p.t,
              height: p.t,
              opacity: p.o,
              background: p.or ? '#F5C542' : '#FFFFFF',
              boxShadow: p.or ? '0 0 6px #F5C542' : '0 0 4px rgba(255,255,255,.6)',
              animationDuration: `${p.d}s`,
              animationDelay: `${p.delai}s`,
            }}
          />
        ))}
      </div>
      {/* Halo bleu profond en haut, sur noir pur */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%]"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,166,.45), transparent 70%)',
        }}
        aria-hidden
      />

      <button
        type="button"
        onClick={onFermer}
        aria-label="Fermer"
        className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white/80"
      >
        <X size={20} />
      </button>

      {/* En-tête : étapes du compte à rebours */}
      <div className="relative mt-[max(28px,calc(env(safe-area-inset-top)+12px))] flex flex-col items-center gap-2.5">
        <p className="cr-entree text-[11px] font-extrabold uppercase tracking-[0.28em] text-sun">
          {jourJ ? 'Calendrier de l’Avent' : 'Compte à rebours'}
        </p>
        <div className="cr-entree flex gap-1.5" style={{ animationDelay: '.1s' }} aria-hidden>
          {[7, 6, 5, 4, 3, 2, 1].map((k) => (
            <span
              key={k}
              className="h-1.5 w-7 rounded-full"
              style={{
                background: k >= n ? '#F5C542' : 'rgba(255,255,255,.18)',
                boxShadow: k === n ? '0 0 10px #F5C542' : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Le grand chiffre */}
      <div className="relative mt-3 flex flex-col items-center">
        <span
          className="cr-onde absolute top-1/2 size-48 -translate-y-1/2 rounded-full"
          aria-hidden
        />
        <p
          className="cr-chiffre font-display font-extrabold leading-none"
          style={jourJ ? { fontSize: 'clamp(70px, 22vw, 150px)' } : undefined}
        >
          {jourJ ? 'JOUR J' : `J-${n}`}
        </p>
        <p
          className="cr-entree mt-2 text-center text-[13px] font-semibold text-white/70"
          style={{ animationDelay: '.9s' }}
        >
          {jourJ
            ? 'Le calendrier de l’Avent est ouvert'
            : 'avant l’ouverture du calendrier de l’Avent'}
        </p>
      </div>

      {/* La scène : le calendrier et Ulysse qui court vers lui */}
      <div className="relative mx-auto mt-2 w-full max-w-[460px] flex-1">
        <div className="cr-calendrier absolute inset-x-[7%] top-[4%]">
          <Calendrier jourJ={jourJ} intensite={1 - n / 8} />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[4%] mx-auto h-16 w-[80%] rounded-[50%]"
          style={{ background: 'radial-gradient(ellipse, rgba(245,197,66,.35), transparent 70%)' }}
          aria-hidden
        />
        <div
          className="cr-approche absolute bottom-[3%] left-1/2 origin-bottom"
          style={{ height: `${Math.round(taille * 100)}%`, ['--cr-taille' as string]: taille }}
        >
          <img
            src={`${BASE}${jourJ ? 'ulysse-saut.webp' : 'ulysse-course.webp'}`}
            alt="Ulysse"
            draggable={false}
            className={
              jourJ ? 'cr-saut h-full w-auto max-w-none' : 'cr-course h-full w-auto max-w-none'
            }
            style={{
              filter:
                'drop-shadow(0 18px 24px rgba(0,0,0,.7)) drop-shadow(0 0 22px rgba(245,197,66,.18))',
            }}
          />
        </div>
      </div>

      {/* Le message du jour */}
      <div className="relative mb-[max(22px,calc(env(safe-area-inset-bottom)+10px))] flex flex-col items-center gap-3 px-6 text-center">
        <div className="cr-message rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 backdrop-blur">
          <p className="font-display text-lg font-extrabold">{msg.titre}</p>
          <p className="mt-0.5 text-[13px] text-white/75">{msg.texte}</p>
        </div>
        <p className="cr-indice text-[11px] font-semibold text-white/40">Touche pour continuer</p>
      </div>
    </div>
  );
}

/** Le calendrier de l'Avent : les 18 cases de décembre, la case n°1 s'illumine. */
function Calendrier({ jourJ, intensite }: { jourJ: boolean; intensite: number }) {
  const cols = 6;
  return (
    <svg viewBox="0 0 300 214" className="w-full" aria-hidden>
      <defs>
        <linearGradient id="cr-boite" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B3202F" />
          <stop offset="1" stopColor="#5E0C18" />
        </linearGradient>
        <linearGradient id="cr-or" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF1B8" />
          <stop offset=".5" stopColor="#F5C542" />
          <stop offset="1" stopColor="#B8860B" />
        </linearGradient>
        <radialGradient id="cr-lumiere">
          <stop offset="0" stopColor="#FFF6D0" stopOpacity="1" />
          <stop offset="1" stopColor="#F5C542" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Rayons de lumière derrière la case n°1 */}
      <g
        className="cr-rayons"
        style={{ transformOrigin: '42px 70px', opacity: 0.25 + intensite * 0.6 }}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d="M42 70 L36 -60 L48 -60 Z"
            fill="#F5C542"
            opacity=".35"
            transform={`rotate(${i * 30} 42 70)`}
          />
        ))}
      </g>
      <rect
        x="6"
        y="6"
        width="288"
        height="202"
        rx="16"
        fill="url(#cr-boite)"
        stroke="url(#cr-or)"
        strokeWidth="3"
      />
      <text
        x="150"
        y="30"
        textAnchor="middle"
        fontFamily="Manrope Variable, Manrope, sans-serif"
        fontWeight="800"
        fontSize="13"
        letterSpacing="3"
        fill="url(#cr-or)"
      >
        CALENDRIER DE L’AVENT
      </text>
      {JOURS.map((j, i) => {
        const x = 18 + (i % cols) * 45;
        const y = 44 + Math.floor(i / cols) * 54;
        const premier = j.jour === 1;
        return (
          <g key={j.jour}>
            {premier && (
              <circle
                cx={x + 18}
                cy={y + 22}
                r="34"
                fill="url(#cr-lumiere)"
                opacity={0.3 + intensite * 0.7}
                className="cr-pulse"
              />
            )}
            <rect
              x={x}
              y={y}
              width="36"
              height="44"
              rx="6"
              fill={premier ? (jourJ ? '#FFF6D0' : '#0E2348') : '#0B1A33'}
              stroke={premier ? '#F5C542' : 'rgba(245,197,66,.45)'}
              strokeWidth={premier ? 2.2 : 1.2}
            />
            {premier && jourJ && (
              <rect
                x={x}
                y={y}
                width="36"
                height="44"
                rx="6"
                fill="#0E2348"
                stroke="#F5C542"
                strokeWidth="2.2"
                className="cr-porte"
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
            )}
            <text
              x={x + 18}
              y={y + 28}
              textAnchor="middle"
              fontFamily="Manrope Variable, Manrope, sans-serif"
              fontWeight="800"
              fontSize="15"
              fill={premier ? '#F5C542' : 'rgba(255,255,255,.55)'}
              className={premier && jourJ ? 'cr-porte-texte' : undefined}
            >
              {j.jour}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
