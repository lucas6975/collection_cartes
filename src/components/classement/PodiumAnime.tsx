// Vrai podium animé du classement : les marches montent (3ᵉ, 2ᵉ puis 1ᵉʳ), chaque joueur atterrit
// sur sa marche avec son avatar et son nom, le 1ᵉʳ reçoit une couronne, des rayons et des confettis.
import { Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { avatarDe, type LigneClassement } from '../../data/classement';
import { Avatar, cx } from '../ui/primitives';

const STYLE = [
  {
    // 1ᵉʳ : or
    hauteur: 118,
    dessus: 'linear-gradient(180deg,#FFE58A,#F5C542)',
    face: 'linear-gradient(180deg,#F5C542 0%,#D69E16 60%,#B07D0B 100%)',
    cote: '#9A6C06',
    anneau: '#F5C542',
    texte: '#5A3F00',
    avatar: 64,
  },
  {
    // 2ᵉ : argent
    hauteur: 86,
    dessus: 'linear-gradient(180deg,#F4F7FB,#CBD5E1)',
    face: 'linear-gradient(180deg,#D7DEE8 0%,#A9B6C8 60%,#8695AA 100%)',
    cote: '#6E7D93',
    anneau: '#CBD5E1',
    texte: '#334155',
    avatar: 52,
  },
  {
    // 3ᵉ : bronze
    hauteur: 64,
    dessus: 'linear-gradient(180deg,#F6C9A0,#D98E52)',
    face: 'linear-gradient(180deg,#DE9A62 0%,#B8692F 60%,#93501F 100%)',
    cote: '#7A4117',
    anneau: '#E0A06A',
    texte: '#4A2509',
    avatar: 48,
  },
];

// Ordre d'apparition : la 3ᵉ marche, puis la 2ᵉ, puis la 1ʳᵉ (le suspense !).
const DELAI_MARCHE = [0.55, 0.3, 0.05];

const CONFETTIS = ['#F5C542', '#E5384A', '#2563A6', '#13896F', '#6A4FB3', '#FFFFFF'];

function Marche({
  l,
  place,
  valeur,
  unite,
}: {
  l: LigneClassement;
  place: number;
  valeur: number;
  unite: string;
}) {
  const s = STYLE[place];
  const d = DELAI_MARCHE[place];
  const premier = place === 0;
  return (
    <div className="relative flex w-1/3 flex-col items-center">
      {/* Le joueur atterrit sur sa marche. */}
      <motion.div
        className="relative z-10 flex w-full flex-col items-center px-1 pb-1.5 text-center"
        initial={{ opacity: 0, y: -70, scale: 0.6 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: d + 0.45, type: 'spring', stiffness: 380, damping: 14 }}
      >
        {premier && (
          <motion.span
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#F5C542] drop-shadow-[0_2px_4px_rgba(154,108,6,.6)]"
            initial={{ y: -20, opacity: 0, rotate: -25 }}
            animate={{ y: 0, opacity: 1, rotate: [-8, 8, -8] }}
            transition={{
              y: { delay: d + 0.9, type: 'spring', stiffness: 400, damping: 12 },
              opacity: { delay: d + 0.9 },
              rotate: { delay: d + 1.1, duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <Crown size={28} fill="#F5C542" strokeWidth={2.2} />
          </motion.span>
        )}
        <div
          className="rounded-full p-[3px]"
          style={{
            background: `conic-gradient(${s.anneau}, #FFFFFF, ${s.anneau}, ${s.cote}, ${s.anneau})`,
            boxShadow: premier ? '0 0 18px 4px rgba(245,197,66,.55)' : '0 4px 10px rgba(0,0,0,.18)',
          }}
        >
          <div className="rounded-full bg-white p-[2px]">
            <Avatar user={avatarDe(l)} size={s.avatar} />
          </div>
        </div>
        <p
          className={cx(
            'mt-1.5 w-full truncate font-display font-extrabold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]',
            premier ? 'text-[14px]' : 'text-[12.5px]',
          )}
        >
          {l.moi ? 'Toi' : l.prenom}
        </p>
        {!l.moi && (
          <p className="-mt-0.5 w-full truncate text-[10.5px] font-semibold text-white/75 drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]">
            {l.nom}
          </p>
        )}
      </motion.div>

      {/* La marche, en relief : dessus, face avant avec le numéro, ombre du côté. */}
      <motion.div
        className="relative w-full origin-bottom"
        style={{ height: s.hauteur }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: d, type: 'spring', stiffness: 170, damping: 16 }}
      >
        <div
          className="absolute inset-x-0 -top-2.5 h-3 rounded-t-[6px]"
          style={{ background: s.dessus, transform: 'perspective(120px) rotateX(35deg)' }}
        />
        <div
          className="relative flex size-full flex-col items-center overflow-hidden pt-2"
          style={{
            background: s.face,
            boxShadow: `inset -6px 0 0 ${s.cote}55, inset 0 -8px 14px rgba(0,0,0,.18)`,
          }}
        >
          <span
            className="font-display leading-none font-black"
            style={{
              color: s.texte,
              fontSize: premier ? 46 : 36,
              textShadow: '0 1px 0 rgba(255,255,255,.55)',
            }}
          >
            {place + 1}
          </span>
          <span className="mt-1 font-display text-[13px] font-extrabold" style={{ color: s.texte }}>
            {valeur} <span className="font-sans text-[10px] font-bold opacity-80">{unite}</span>
          </span>
          {/* Reflet qui passe sur la marche. */}
          <span className="podium-reflet absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Podium des 3 premiers. `top` est déjà trié (1ᵉʳ, 2ᵉ, 3ᵉ) ; `valeur` donne le score affiché.
 */
export function PodiumAnime({
  top,
  valeur,
  unite,
}: {
  top: LigneClassement[];
  valeur: (l: LigneClassement) => number;
  unite: string;
}) {
  if (top.length < 3) return null;
  const ordre = [1, 0, 2]; // 2ᵉ à gauche, 1ᵉʳ au centre, 3ᵉ à droite
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-b from-[#0E2A5C] via-[#173A6B] to-[#2A5596] px-2 pt-10">
      {/* Rayons de lumière qui tournent derrière le 1ᵉʳ. */}
      <div
        className="podium-rayons pointer-events-none absolute top-[18%] left-1/2 size-[340px] -translate-x-1/2 -translate-y-1/2 opacity-40"
        style={{
          background:
            'repeating-conic-gradient(rgba(255,229,138,.55) 0deg 10deg, transparent 10deg 24deg)',
          maskImage: 'radial-gradient(circle, #000 20%, transparent 68%)',
          WebkitMaskImage: 'radial-gradient(circle, #000 20%, transparent 68%)',
        }}
      />
      {/* Confettis qui tombent. */}
      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={i}
          className="podium-confetti pointer-events-none absolute top-0 block h-2.5 w-1.5 rounded-[2px]"
          style={{
            left: `${6 + ((i * 37) % 88)}%`,
            background: CONFETTIS[i % CONFETTIS.length],
            animationDelay: `${1.2 + (i % 8) * 0.35}s`,
            animationDuration: `${2.6 + (i % 5) * 0.4}s`,
          }}
        />
      ))}
      <div className="relative flex items-end">
        {ordre.map((p) => (
          <Marche key={top[p].cle} l={top[p]} place={p} valeur={valeur(top[p])} unite={unite} />
        ))}
      </div>
    </div>
  );
}
