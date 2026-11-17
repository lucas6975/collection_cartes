import { CalendarDays, Check, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { MASCOTTE_URL } from '../components/cards/CardBack';
import { JoursSelection } from '../components/JoursSelection';
import { useToast } from '../components/ui/overlay';
import { Button } from '../components/ui/primitives';
import { ApiError } from '../data/api';
import { JOURS_OUVRES, identiteStore } from '../data/identite';
import { rappelsStore } from '../data/rappels';

const CLE_ETAPE = 'team-ulysse-etape-tirage';

/** Les nouveaux inscrits voient l'inscription au tirage du calendrier avant d'arriver sur le menu. */
export const etapeTirage = {
  demander() {
    try {
      localStorage.setItem(CLE_ETAPE, '1');
    } catch {
      // Stockage indisponible : l'inscription reste proposée dans le calendrier.
    }
  },
  aAfficher() {
    try {
      if (localStorage.getItem(CLE_ETAPE) !== '1') return false;
    } catch {
      return false;
    }
    const { identite, codeAdmin } = identiteStore.get();
    return Boolean(identite && !codeAdmin && !identite.joursChoisis);
  },
  terminer() {
    try {
      localStorage.removeItem(CLE_ETAPE);
    } catch {
      // Rien à faire.
    }
  },
};

/** Écran plein, après les rappels : s'inscrire au tirage au sort du calendrier de l'Avent. */
export function EtapeTirage({ onFin }: { onFin: () => void }) {
  const toast = useToast();
  const [jours, setJours] = useState<number[]>(JOURS_OUVRES);
  const [envoi, setEnvoi] = useState(false);

  const valider = async (choix: number[]) => {
    setEnvoi(true);
    try {
      const ok = await identiteStore.choisirJours(choix);
      // Relie les rappels de ce téléphone à l'inscription : la personne sera prévenue si elle
      // est tirée au sort.
      if (ok) rappelsStore.verifier().catch(() => undefined);
      toast(
        choix.length
          ? ok
            ? 'Tu participes au tirage au sort ! 🎁'
            : 'Enregistré sur ce téléphone, envoi dès que possible'
          : 'C’est noté. Tu pourras t’inscrire plus tard dans le calendrier.',
        ok || !choix.length ? 'success' : 'info',
      );
      etapeTirage.terminer();
      onFin();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erreur, réessaie.', 'error');
      setEnvoi(false);
    }
  };

  return (
    <div
      className="min-h-dvh px-4 py-8 sm:py-12"
      style={{ background: 'linear-gradient(170deg, #2563A6 0%, #153E75 45%, #0B2347 100%)' }}
    >
      <div className="mx-auto max-w-md">
        <motion.div
          className="flex flex-col items-center text-center text-white"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative">
            <motion.img
              src={MASCOTTE_URL}
              alt="Ulysse, la mascotte"
              className="h-32 w-auto drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 0.1 }}
            />
            <motion.span
              className="absolute -right-5 top-1 grid size-12 place-items-center rounded-2xl bg-[#C8283A] text-white shadow-lg"
              animate={{ rotate: [0, -14, 14, -8, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 2 }}
            >
              <Gift size={24} />
            </motion.span>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-sun">
            Dernière étape
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight">
            Le calendrier de l’Avent 🎄
          </h1>
          <p className="mt-2 text-sm text-white/85">
            Inscris-toi <b className="text-white">dès maintenant</b> au tirage au sort du
            calendrier, qui commence le <b className="text-white">1er décembre</b>.
          </p>
        </motion.div>

        <motion.div
          className="mt-6 space-y-4 rounded-3xl bg-white p-5 shadow-lift sm:p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ul className="space-y-2.5 text-sm text-navy-950">
            <li className="flex gap-2.5">
              <CalendarDays size={18} className="mt-0.5 shrink-0 text-blue" />
              <span>
                <b>Du 1er au 24 décembre</b>, chaque jour ouvré : une case à ouvrir avec un défi
                sécurité.
              </span>
            </li>
            <li className="flex gap-2.5">
              <Gift size={18} className="mt-0.5 shrink-0 text-[#C8283A]" />
              <span>
                <b>Chaque jour, une personne inscrite est tirée au sort</b> : défi réussi ={' '}
                <b>goodies gagnés</b> 🎁
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="w-[18px] shrink-0 text-center">🎄</span>
              <span>
                Le plus gros cadeau sera remis le <b>17 décembre</b>, lors de la{' '}
                <b>soirée de Noël IMECA</b> !
              </span>
            </li>
          </ul>
          <p className="rounded-2xl bg-sun/15 px-3.5 py-3 text-sm text-navy-950">
            Tous les jours sont cochés : <b>décoche ceux où tu seras absent</b> (congés,
            déplacement…).
          </p>
          <JoursSelection value={jours} onChange={setJours} />
          <Button
            variant="accent"
            size="lg"
            className="h-13 w-full text-base"
            onClick={() => void valider(jours)}
            disabled={envoi || jours.length === 0}
          >
            <Check size={18} /> {envoi ? 'Inscription…' : 'Je participe au tirage'}
          </Button>
          <p className="text-center text-xs text-muted">
            Pas tiré au sort ? Tu joues quand même aux défis, chaque jour. Tu pourras modifier tes
            jours dans l’onglet Moi.
          </p>
        </motion.div>

        <button
          type="button"
          onClick={() => void valider([])}
          disabled={envoi}
          className="mx-auto mt-5 block text-sm font-semibold text-white/60 hover:text-white"
        >
          Pas cette fois
        </button>
      </div>
    </div>
  );
}
