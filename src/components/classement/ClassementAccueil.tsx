import { Repeat } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { pourTop, trier, useClassement } from '../../data/classement';
import { useIdentite } from '../../data/identite';
import { useGame } from '../../data/store';
import { PodiumAnime } from './PodiumAnime';

/** Accueil : top 3 des collectionneurs et ma place. */
export function ClassementAccueil() {
  const { lignes, erreur } = useClassement();
  const { progress } = useGame();
  const { codeAdmin } = useIdentite();
  // L'administrateur voit pourquoi le classement ne s'affiche pas.
  if (codeAdmin && (erreur || (lignes && lignes.length < 3)))
    return (
      <section className="rounded-[22px] bg-white p-4 text-[12.5px] text-muted shadow-soft">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a97ab]">
          Classement des collectionneurs · admin
        </p>
        <p className="mt-1.5">
          {erreur
            ? `⚠️ ${erreur}`
            : `Seulement ${lignes!.length} joueur${lignes!.length > 1 ? 's' : ''} pour l’instant : l’encadré s’affiche pour tous à partir de 3.`}
        </p>
      </section>
    );
  if (!lignes || lignes.length < 3) return null;
  const t = trier(lignes, 'cartes');
  const moi = t.find((x) => x.moi);
  const manque = pourTop(lignes);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(11,35,71,.04),0_6px_20px_rgba(11,35,71,.06)]"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a97ab]">
        Classement des collectionneurs
      </p>
      <div className="mt-3">
        <PodiumAnime top={t.slice(0, 3)} valeur={(l) => l.cartes} unite="cartes" />
      </div>
      <div className="my-3.5 h-px bg-line" />
      {moi ? (
        <div className="flex items-center gap-3">
          <p className="font-display text-[26px] font-extrabold leading-none text-navy-950">
            {moi.rang}
            <span className="text-[13px] text-[#8a97ab]">{moi.rang === 1 ? 'er' : 'ᵉ'}</span>
          </p>
          <p className="flex-1 text-[12.5px] leading-snug text-muted">
            Tu as <b className="text-navy-950">{moi.cartes} cartes</b>.{' '}
            {moi.rang === 1 ? (
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
      ) : (
        <p className="text-[12.5px] leading-snug text-muted">
          {codeAdmin
            ? '🔧 Compte administrateur : tu es hors classement (cartes de test).'
            : `Tu as ${progress.cards.length} cartes. Ta place arrive dans un instant…`}
        </p>
      )}
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
