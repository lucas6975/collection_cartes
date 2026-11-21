import { Repeat } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import {
  avatarDe,
  pourTop,
  trier,
  useClassement,
  type LigneClassement,
} from '../../data/classement';
import { useGame } from '../../data/store';
import { Avatar } from '../ui/primitives';

const MEDAILLES = ['🥇', '🥈', '🥉'];

function Podium({ l, place }: { l: LigneClassement; place: number }) {
  const grand = place === 0;
  return (
    <div className="flex w-[31%] flex-col items-center gap-1.5 text-center">
      <div className="relative">
        <div className={grand ? 'rounded-full ring-[3px] ring-sun' : ''}>
          <Avatar user={avatarDe(l)} size={grand ? 58 : 46} />
        </div>
        <span className="absolute -bottom-1.5 -right-1 text-base">{MEDAILLES[place]}</span>
      </div>
      <p className="w-full truncate text-[13px] font-bold text-navy-950">
        {l.moi ? 'Toi' : `${l.prenom} ${l.nom}`}
      </p>
      <p className="font-display text-[15px] font-extrabold text-navy">
        {l.cartes} <span className="font-sans text-[11px] font-semibold text-muted">cartes</span>
      </p>
    </div>
  );
}

/** Accueil : top 3 des collectionneurs et ma place. */
export function ClassementAccueil() {
  const { lignes } = useClassement();
  const { progress } = useGame();
  if (!lignes || lignes.length < 3) return null;
  const t = trier(lignes, 'cartes');
  const moi = t.find((x) => x.moi);
  const manque = pourTop(lignes);
  const ordre = [t[1], t[0], t[2]];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(11,35,71,.04),0_6px_20px_rgba(11,35,71,.06)]"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a97ab]">
        Classement des collectionneurs
      </p>
      <div className="mt-3.5 flex items-end justify-between px-1.5">
        {ordre.map((l) => (
          <Podium key={l.cle} l={l} place={t.indexOf(l)} />
        ))}
      </div>
      <div className="my-3.5 h-px bg-line" />
      <div className="flex items-center gap-3">
        <p className="font-display text-[26px] font-extrabold leading-none text-navy-950">
          {moi ? moi.rang : '–'}
          <span className="text-[13px] text-[#8a97ab]">{moi?.rang === 1 ? 'er' : 'ᵉ'}</span>
        </p>
        <p className="flex-1 text-[12.5px] leading-snug text-muted">
          Tu as <b className="text-navy-950">{moi?.cartes ?? progress.cards.length} cartes</b>.{' '}
          {moi && moi.rang === 1 ? (
            'Tu es en tête, tiens bon ! 🔥'
          ) : manque ? (
            <>
              Encore <b className="text-navy-950">{manque}</b> pour entrer dans le top 10.
            </>
          ) : (
            'Tu es dans le top 10, bravo ! 💪'
          )}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between text-[13px] font-bold">
        <Link to="/classement" className="text-blue">
          Voir le classement →
        </Link>
        <Link
          to="/echange"
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-sun/25 px-2.5 py-1.5 text-navy-950"
        >
          <Repeat size={14} /> Échanger
        </Link>
      </div>
    </motion.section>
  );
}
