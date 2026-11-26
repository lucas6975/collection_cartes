// Remontées de situation à risque reçues : pour les destinataires (via leur inscription) et
// pour l'administrateur. On y ouvre le détail et on marque « traitée ».
import { CheckCircle2, ChevronLeft, MapPin, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChargementUlysse } from '../components/ui/vivant';
import { cx } from '../components/ui/primitives';
import { ApiError, api, type RemonteeRecue } from '../data/api';
import { useIdentite } from '../data/identite';

const GRAVITE: Record<string, string> = {
  Grave: 'bg-danger text-white',
  Moyenne: 'bg-sun text-navy-950',
  Faible: 'bg-success text-white',
};

const quand = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export function Remontees() {
  const { identite, codeAdmin } = useIdentite();
  const navigate = useNavigate();
  const [liste, setListe] = useState<RemonteeRecue[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const jeton = identite?.jeton ?? null;
  const code = codeAdmin ?? null;

  const charger = useCallback(async () => {
    try {
      setListe(await api.mesRemontees(jeton, code));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : 'Erreur de chargement');
    }
  }, [jeton, code]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
    const t = setInterval(() => void charger(), 20_000);
    return () => clearInterval(t);
  }, [charger]);

  const basculer = async (r: RemonteeRecue) => {
    setListe((l) => l?.map((x) => (x.id === r.id ? { ...x, traitee: !r.traitee } : x)) ?? l);
    try {
      await api.traiterRemontee(r.id, !r.traitee, jeton, code);
    } catch {
      void charger();
    }
  };

  const aTraiter = liste?.filter((r) => !r.traitee).length ?? 0;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/securite')}
          aria-label="Retour"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-navy-950 shadow-soft"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[26px] leading-tight font-extrabold text-navy-950">
            Remontées reçues
          </h1>
          <p className="text-[15px] text-muted">
            {liste ? `${aTraiter} à traiter · ${liste.length} au total` : 'Situations à risque'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void charger()}
          aria-label="Actualiser"
          className="grid size-11 place-items-center rounded-full bg-white text-navy shadow-soft"
        >
          <RefreshCw size={18} />
        </button>
      </header>

      {erreur && (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {erreur}
        </p>
      )}
      {!liste && !erreur && <ChargementUlysse texte="Ulysse récupère les remontées…" />}
      {liste?.length === 0 && (
        <p className="panel p-5 text-center text-sm text-muted">
          Aucune remontée pour l’instant 👍
        </p>
      )}

      <div className="space-y-3">
        {liste?.map((r) => (
          <section
            key={r.id}
            className={cx('panel border-l-[6px] p-4', r.traitee && 'opacity-60')}
            style={{
              borderLeftColor:
                r.gravite === 'Grave' ? '#DC4444' : r.gravite === 'Moyenne' ? '#F5C542' : '#22A06B',
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cx(
                  'rounded-full px-2.5 py-0.5 text-xs font-extrabold',
                  GRAVITE[r.gravite] ?? 'bg-canvas',
                )}
              >
                {r.gravite}
              </span>
              <span className="text-xs font-semibold text-muted">{quand(r.cree_le)}</span>
              {r.traitee && (
                <span className="ml-auto rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                  ✅ Traitée
                </span>
              )}
            </div>
            <p className="mt-2 font-display text-lg leading-tight font-extrabold text-navy-950">
              {r.type}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-blue">
              <MapPin size={14} /> {r.lieu}
            </p>
            <p className="mt-2 text-[15px] whitespace-pre-line text-navy-950">{r.description}</p>
            <p className="mt-2 text-sm text-muted">
              Signalé par{' '}
              <b className="text-navy-950">
                {r.prenom} {r.nom}
              </b>
            </p>
            <button
              type="button"
              onClick={() => void basculer(r)}
              className={cx(
                'mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold',
                r.traitee ? 'bg-canvas text-muted' : 'bg-success text-white',
              )}
            >
              <CheckCircle2 size={17} />
              {r.traitee ? 'Remettre « à traiter »' : 'Marquer comme traitée'}
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}
