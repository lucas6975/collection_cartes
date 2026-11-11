import { Check, Gift, Pencil } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { JoursSelection } from '../components/JoursSelection';
import { useToast } from '../components/ui/overlay';
import { Button } from '../components/ui/primitives';
import { ApiError } from '../data/api';
import { JOURS_OUVRES, identiteStore, useIdentite } from '../data/identite';
import { NOEL } from './ui';

/**
 * Inscription au tirage au sort, dans le calendrier : tant que la personne n'a pas validé ses
 * jours, elle ne participe pas. Une fois inscrite, un rappel discret permet de modifier.
 */
export function TirageInscription() {
  const { identite, codeAdmin } = useIdentite();
  const toast = useToast();
  const [jours, setJours] = useState<number[]>(JOURS_OUVRES);
  const [envoi, setEnvoi] = useState(false);

  if (!identite || codeAdmin) return null;

  if (identite.joursChoisis) {
    const n = identite.jours.length;
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm shadow-soft">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl text-white"
          style={{ background: n ? NOEL.vert : '#94A3B8' }}
        >
          {n ? <Check size={18} strokeWidth={3} /> : <Gift size={17} />}
        </span>
        <p className="flex-1 text-navy-950">
          {n ? (
            <>
              <b>Inscrit(e) au tirage au sort</b> ·{' '}
              {n === JOURS_OUVRES.length ? 'tous les jours' : `${n} jour${n > 1 ? 's' : ''}`}
            </>
          ) : (
            <>Tu ne participes pas au tirage au sort.</>
          )}
        </p>
        <Link
          to="/moi"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue hover:underline"
        >
          <Pencil size={13} /> Modifier
        </Link>
      </div>
    );
  }

  const valider = async (choix: number[]) => {
    setEnvoi(true);
    try {
      const ok = await identiteStore.choisirJours(choix);
      toast(
        choix.length
          ? ok
            ? 'Tu participes au tirage au sort !'
            : 'Enregistré sur ce téléphone, envoi dès que possible'
          : 'C’est noté : tu ne participes pas au tirage.',
        ok ? 'success' : 'info',
      );
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erreur, réessaie.', 'error');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border-2 border-sun bg-white shadow-lift"
      >
        <div
          className="flex items-center gap-3 px-5 py-4 text-white"
          style={{ background: `linear-gradient(135deg, ${NOEL.rouge}, #8E1F2A)` }}
        >
          <motion.span
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15"
            animate={{ rotate: [0, -10, 10, -6, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2.5 }}
          >
            <Gift size={22} />
          </motion.span>
          <div>
            <p className="font-display text-lg font-extrabold leading-tight">
              Participe au tirage au sort !
            </p>
            <p className="text-sm text-white/85">
              Chaque jour, une personne inscrite est tirée au sort et gagne la récompense du jour.
            </p>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-sm text-muted">
            Tous les jours sont cochés :{' '}
            <b className="text-navy-950">décoche ceux où tu es absent</b> (congés, déplacement…).
          </p>
          <JoursSelection value={jours} onChange={setJours} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="accent"
              size="lg"
              className="flex-1"
              onClick={() => void valider(jours)}
              disabled={envoi || jours.length === 0}
            >
              <Check size={18} /> {envoi ? 'Inscription…' : 'Je participe'}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => void valider([])} disabled={envoi}>
              Pas cette fois
            </Button>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
