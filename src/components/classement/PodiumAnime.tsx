// Podium animé du classement : une petite scène avec un sol, trois marches (or, argent, bronze)
// qui montent l'une après l'autre, chaque joueur qui atterrit sur sa marche avec son avatar, son
// nom et son score ; le 1ᵉʳ reçoit une couronne, un halo et des confettis.
import { Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { avatarDe, type LigneClassement } from '../../data/classement';
import { Avatar, cx } from '../ui/primitives';

const STYLE = [
  {
    // 1ᵉʳ : or
    hauteur: 92,
    marche: 'linear-gradient(180deg,#FFD84D 0%,#F5B90F 55%,#D99A06 100%)',
    liseré: '#FFF1A8',
    chiffre: '#7A5200',
    anneau: 'linear-gradient(135deg,#FFF3B0,#F5C542 45%,#C98B05)',
    pastille: 'bg-[#F5C542] text-[#4A3300]',
    avatar: 62,
  },
  {
    // 2ᵉ : argent
    hauteur: 68,
    marche: 'linear-gradient(180deg,#F1F5F9 0%,#CBD5E1 55%,#A3B1C4 100%)',
    liseré: '#FFFFFF',
    chiffre: '#475569',
    anneau: 'linear-gradient(135deg,#FFFFFF,#CBD5E1 45%,#8A99AE)',
    pastille: 'bg-[#E2E8F0] text-[#334155]',
    avatar: 50,
  },
  {
    // 3ᵉ : bronze
    hauteur: 52,
    marche: 'linear-gradient(180deg,#F2B27C 0%,#D7844A 55%,#B4632B 100%)',
    liseré: '#FAD3B0',
    chiffre: '#5C2E0E',
    anneau: 'linear-gradient(135deg,#FBD5B0,#D98E52 45%,#9A5222)',
    pastille: 'bg-[#E9A26C] text-[#4A2509]',
    avatar: 50,
  },
];

// Les marches montent : la 3ᵉ, puis la 2ᵉ, puis la 1ʳᵉ (le suspense !).
const DELAI = [0.6, 0.35, 0.1];
const CONFETTIS = ['#F5C542', '#E5384A', '#60A5FA', '#34D399', '#A78BFA', '#FFFFFF'];

function Place({
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
  const d = DELAI[place];
  const premier = place === 0;
  const nom = l.moi ? 'Toi' : `${l.prenom} ${l.nom}`.trim();
  return (
    <div className={cx('flex min-w-0 flex-col items-center', premier ? 'flex-[1.25]' : 'flex-1')}>
      {/* Le joueur atterrit au-dessus de sa marche. */}
      <motion.div
        className="flex w-full flex-col items-center px-1 pb-2"
        initial={{ opacity: 0, y: -50, scale: 0.7 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: d + 0.4, type: 'spring', stiffness: 360, damping: 15 }}
      >
        <div className="relative">
          {premier && (
            <motion.span
              className="absolute -top-[22px] left-1/2 -ml-[13px] text-[#F5C542] drop-shadow-[0_2px_3px_rgba(0,0,0,.35)]"
              initial={{ y: -14, opacity: 0 }}
              animate={{ y: 0, opacity: 1, rotate: [-7, 7, -7] }}
              transition={{
                y: { delay: d + 0.85, type: 'spring', stiffness: 420, damping: 12 },
                opacity: { delay: d + 0.85 },
                rotate: { delay: d + 1, duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <Crown size={26} fill="#F5C542" strokeWidth={2} />
            </motion.span>
          )}
          {premier && (
            <span className="podium-halo absolute -inset-3 rounded-full bg-[#F5C542]/35 blur-md" />
          )}
          <div className="relative rounded-full p-[3px]" style={{ background: s.anneau }}>
            <div className="rounded-full bg-[#0E2A5C] p-[2px]">
              <Avatar user={avatarDe(l)} size={s.avatar} />
            </div>
          </div>
          {/* Médaille avec le rang. */}
          <span
            className="absolute -right-1 -bottom-1 grid size-[22px] place-items-center rounded-full border-2 border-[#0E2A5C] font-display text-[11px] font-black"
            style={{ background: s.marche, color: s.chiffre }}
          >
            {place + 1}
          </span>
        </div>
        <p
          className={cx(
            'mt-2 w-full truncate text-center font-display leading-tight font-extrabold text-white',
            premier ? 'text-[14px]' : 'text-[12.5px]',
          )}
        >
          {nom}
        </p>
        <span
          className={cx(
            'mt-1 rounded-full px-2 py-[2px] text-[11px] leading-none font-extrabold whitespace-nowrap',
            s.pastille,
          )}
        >
          {valeur} <span className="font-semibold opacity-75">{unite}</span>
        </span>
      </motion.div>

      {/* La marche. */}
      <motion.div
        className="relative w-full origin-bottom overflow-hidden rounded-t-[12px]"
        style={{
          height: s.hauteur,
          background: s.marche,
          boxShadow: `inset 0 3px 0 ${s.liseré}, inset 0 -10px 16px rgba(0,0,0,.16)`,
        }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: d, type: 'spring', stiffness: 180, damping: 18 }}
      >
        <span
          className="absolute inset-x-0 top-2 text-center font-display leading-none font-black"
          style={{
            color: s.chiffre,
            fontSize: premier ? 40 : 32,
            textShadow: '0 1px 0 rgba(255,255,255,.5)',
          }}
        >
          {place + 1}
        </span>
        <span className="podium-reflet absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </motion.div>
    </div>
  );
}

/** Podium des 3 premiers. `top` est déjà trié (1ᵉʳ, 2ᵉ, 3ᵉ). */
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
  return (
    <div
      className="relative overflow-hidden rounded-[22px] px-3 pt-9"
      style={{
        background: 'radial-gradient(120% 90% at 50% 0%, #24508F 0%, #0E2A5C 55%, #0A1F45 100%)',
      }}
    >
      {/* Rayons de lumière derrière le 1ᵉʳ. */}
      <div
        className="podium-rayons pointer-events-none absolute top-[30%] left-1/2 size-[360px] -translate-x-1/2 -translate-y-1/2 opacity-30"
        style={{
          background:
            'repeating-conic-gradient(rgba(255,229,138,.6) 0deg 8deg, transparent 8deg 22deg)',
          maskImage: 'radial-gradient(circle, #000 15%, transparent 62%)',
          WebkitMaskImage: 'radial-gradient(circle, #000 15%, transparent 62%)',
        }}
      />
      {/* Confettis. */}
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="podium-confetti pointer-events-none absolute -top-2 block h-2 w-1.5 rounded-[2px]"
          style={{
            left: `${5 + ((i * 41) % 90)}%`,
            background: CONFETTIS[i % CONFETTIS.length],
            animationDelay: `${1.3 + (i % 7) * 0.4}s`,
            animationDuration: `${2.8 + (i % 4) * 0.45}s`,
          }}
        />
      ))}

      <div className="relative flex items-end gap-1.5">
        <Place l={top[1]} place={1} valeur={valeur(top[1])} unite={unite} />
        <Place l={top[0]} place={0} valeur={valeur(top[0])} unite={unite} />
        <Place l={top[2]} place={2} valeur={valeur(top[2])} unite={unite} />
      </div>
      {/* Le sol de la scène. */}
      <div className="relative -mx-3 h-4 bg-gradient-to-b from-[#071733] to-[#0A1F45] shadow-[0_-6px_14px_rgba(0,0,0,.35)]" />
    </div>
  );
}
