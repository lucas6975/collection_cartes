import { Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { JEUDIS_FOUS, jourDe } from '../domain/packs';
import { cx } from './ui/primitives';

// Le compte à rebours s'affiche à partir de la veille.
const bornes = (jour: string) => {
  const [A, M, J] = jour.split('-').map(Number);
  return {
    annonce: new Date(A, M - 1, J - 1).getTime(),
    debut: new Date(A, M - 1, J).getTime(),
    fin: new Date(A, M - 1, J + 1).getTime(),
  };
};
const prochain = (now: Date) =>
  JEUDIS_FOUS.map(bornes).find((b) => now.getTime() < b.fin) ?? bornes(JEUDIS_FOUS[0]);

export type MomentJeudiFou = 'annonce' | 'pendant' | null;

export function momentJeudiFou(now: Date): MomentJeudiFou {
  const t = now.getTime();
  if (JEUDIS_FOUS.includes(jourDe(now))) return 'pendant';
  const b = prochain(now);
  if (t >= b.annonce && t < b.debut) return 'annonce';
  return null;
}

/** « 7 h 05 », « 42 min », « 1 min » */
export function duree(ms: number): string {
  const min = Math.max(1, Math.ceil(ms / 60_000));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}

function useMaintenant() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const FOND = 'linear-gradient(135deg, #6C2BD9, #C026D3 55%, #F59E0B)';

/** Bannière du Jeudi fou : annonce la veille (compte à rebours), puis pendant la journée. */
export function BanniereJeudiFou({ variante = 'accueil' }: { variante?: 'accueil' | 'pack' }) {
  const now = useMaintenant();
  const moment = momentJeudiFou(now);
  if (!moment) return null;
  const pendant = moment === 'pendant';
  const reste = duree((pendant ? prochain(now).fin : prochain(now).debut) - now.getTime());

  if (variante === 'pack')
    return (
      <div
        className="relative overflow-hidden rounded-2xl px-4 py-3 text-white"
        style={{ background: FOND }}
      >
        <p className="flex items-center gap-1.5 font-display font-extrabold">
          <Zap size={17} fill="currentColor" />
          {pendant ? 'Jeudi fou : légendaire ×3 aujourd’hui !' : 'Demain, c’est le Jeudi fou !'}
        </p>
        <p className="mt-0.5 text-[13px] text-white/90">
          {pendant
            ? `Environ 1 pack sur 2 contient une légendaire (au lieu d’1 sur 5). Fin dans ${reste}.`
            : `Chances de carte légendaire ×3 dans le pack du jour. Début dans ${reste}.`}
        </p>
      </div>
    );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to="/cartes"
        className="relative block overflow-hidden rounded-3xl p-5 text-white shadow-lift"
        style={{ background: FOND }}
      >
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(115deg, transparent 0 18px, rgba(255,255,255,.08) 18px 26px)',
          }}
        />
        <motion.span
          className="absolute right-4 top-3 font-display text-6xl font-extrabold text-[#FFF3C4] drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]"
          animate={{ rotate: [8, -4, 8], scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          ×3
        </motion.span>
        <span className="relative inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-extrabold tracking-[0.12em]">
          <Zap size={12} fill="currentColor" /> {pendant ? 'AUJOURD’HUI SEULEMENT' : 'DEMAIN'}
        </span>
        <p className="relative mt-2 max-w-[75%] font-display text-[26px] font-extrabold leading-[1.05]">
          {pendant ? 'C’est le Jeudi fou !' : 'Demain, c’est le Jeudi fou !'}
        </p>
        <p className="relative mt-1.5 max-w-[85%] text-[14px] leading-snug text-white/95">
          Tes chances de <b>carte légendaire</b> sont multipliées par 3 dans le pack du jour
          {pendant ? '.' : ' de demain.'}
        </p>
        <span
          className={cx(
            'relative mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold',
          )}
        >
          ⏳ {pendant ? `Fin à minuit · encore ${reste}` : `Commence dans ${reste}`}
        </span>
      </Link>
    </motion.div>
  );
}
