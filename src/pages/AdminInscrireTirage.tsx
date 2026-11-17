import { Check, Gift, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { JoursSelection } from '../components/JoursSelection';
import { useToast } from '../components/ui/overlay';
import { Avatar, Button, cx } from '../components/ui/primitives';
import { ApiError, api, type Participant } from '../data/api';
import { JOURS_OUVRES } from '../data/identite';

/**
 * Onglet Inscrits : l'administrateur inscrit au tirage au sort, à leur place, les personnes
 * inscrites dans l'appli qui n'ont choisi aucun jour.
 */
export function InscrireAuTirage({
  code,
  participants,
  onChange,
}: {
  code: string;
  participants: Participant[];
  onChange: () => Promise<void>;
}) {
  const toast = useToast();
  const oublies = participants
    .filter((p) => p.jours.length === 0)
    .sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`));
  const [choisi, setChoisi] = useState<string | null>(null);
  const [jours, setJours] = useState<number[]>(JOURS_OUVRES);
  const [envoi, setEnvoi] = useState(false);
  const personne = oublies.find((p) => p.id === choisi) ?? null;

  const inscrire = async () => {
    if (!personne) return;
    setEnvoi(true);
    try {
      await api.adminInscrireTirage(code, personne.id, jours);
      toast(`${personne.prenom} ${personne.nom} est inscrit(e) au tirage 🎁`, 'success');
      setChoisi(null);
      setJours(JOURS_OUVRES);
      await onChange();
    } catch (e) {
      toast(
        e instanceof ApiError
          ? `${e.message} (as-tu lancé supabase/maj-inscription-admin.sql ?)`
          : 'Erreur',
        'error',
      );
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-sun bg-white shadow-soft">
      <div className="flex items-start gap-3 bg-sun/15 px-4 py-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#C8283A] text-white">
          <Gift size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold text-navy-950">
            Pas encore inscrits au tirage{' '}
            <span className="ml-1 rounded-full bg-navy-950 px-2 py-0.5 text-xs text-white">
              {oublies.length}
            </span>
          </p>
          <p className="text-sm text-muted">
            Inscrits dans l’appli, mais aucun jour choisi pour le calendrier. Touche un nom, coche
            ses jours, puis inscris-le.
          </p>
        </div>
      </div>

      {oublies.length === 0 ? (
        <p className="flex items-center justify-center gap-2 p-5 text-sm font-semibold text-success">
          <UserCheck size={17} /> Tout le monde est inscrit au tirage !
        </p>
      ) : (
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-1.5">
            {oublies.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setChoisi(p.id === choisi ? null : p.id);
                  setJours(JOURS_OUVRES);
                }}
                className={cx(
                  'flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-sm font-semibold transition-colors',
                  p.id === choisi
                    ? 'border-navy-950 bg-navy-950 text-white'
                    : 'border-line bg-white text-navy-950 hover:border-navy/40',
                )}
              >
                <Avatar user={{ id: p.id, prenom: p.prenom, nom: p.nom }} size={24} />
                {p.prenom} {p.nom}
              </button>
            ))}
          </div>

          {personne && (
            <div className="space-y-3 rounded-2xl bg-canvas p-3.5">
              <p className="text-sm text-navy-950">
                Jours de{' '}
                <b>
                  {personne.prenom} {personne.nom}
                </b>{' '}
                : tous cochés, <b>décoche ses jours d’absence</b>.
              </p>
              <JoursSelection value={jours} onChange={setJours} />
              <Button
                variant="accent"
                className="w-full"
                onClick={() => void inscrire()}
                disabled={envoi || jours.length === 0}
              >
                <Check size={17} />{' '}
                {envoi ? 'Inscription…' : `Inscrire ${personne.prenom} au tirage`}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
