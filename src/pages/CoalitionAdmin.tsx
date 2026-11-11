import { CalendarCheck, Download, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { Modal, useToast } from '../components/ui/overlay';
import { Avatar, Button, PageHeader, cx } from '../components/ui/primitives';
import { ApiError, api, type Volontaire } from '../data/api';
import { useIdentite } from '../data/identite';

// Administrateur : les volontaires qui veulent rejoindre la coalition Team Ulysse.
// Page à part, sans mélange avec les inscrits et les tirages du calendrier.

const nomComplet = (p: { prenom: string; nom: string }) => `${p.prenom} ${p.nom}`;

export function CoalitionAdmin() {
  const { codeAdmin } = useIdentite();
  const toast = useToast();
  const [volontaires, setVolontaires] = useState<Volontaire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!codeAdmin) return;
    setChargement(true);
    try {
      setVolontaires(await api.adminVolontaires(codeAdmin));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : 'Erreur de chargement');
    } finally {
      setChargement(false);
    }
  }, [codeAdmin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, [charger]);

  if (!codeAdmin) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Administration"
        title="Coalition Team Ulysse"
        description={`${volontaires.length} volontaire${volontaires.length > 1 ? 's' : ''} pour rejoindre la coalition.`}
      >
        <Button variant="secondary" onClick={() => void charger()} disabled={chargement}>
          <RefreshCw size={16} className={cx(chargement && 'animate-spin')} /> Actualiser
        </Button>
      </PageHeader>
      <ListeVolontaires
        volontaires={volontaires}
        erreur={erreur}
        onSupprimer={async (v) => {
          try {
            await api.adminSupprimerVolontaire(codeAdmin, v.id);
            toast(`${nomComplet(v)} retiré(e) de la liste`, 'info');
            await charger();
          } catch (e) {
            toast(e instanceof ApiError ? e.message : 'Erreur', 'error');
          }
        }}
      />
    </div>
  );
}

/** Nombre de volontaires, pour l'encadré du menu de l'administrateur. */
export function useNombreVolontaires(code: string | null) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    if (!code) return;
    api
      .adminVolontaires(code)
      .then((v) => setN(v.length))
      .catch(() => setN(null));
  }, [code]);
  return n;
}

function telechargerCsvCoalition(volontaires: Volontaire[]) {
  const echapper = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lignes = [
    ['Prénom', 'Nom', 'Inscrit au calendrier', 'Volontaire le'].join(';'),
    ...volontaires.map((v) =>
      [
        echapper(v.prenom),
        echapper(v.nom),
        v.participant_id ? 'oui' : 'non',
        echapper(new Date(v.le).toLocaleDateString('fr-FR')),
      ].join(';'),
    ),
  ];
  const blob = new Blob(['\uFEFF' + lignes.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'volontaires-coalition-team-ulysse.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function ListeVolontaires({
  volontaires,
  erreur,
  onSupprimer,
}: {
  volontaires: Volontaire[];
  erreur: string | null;
  onSupprimer: (v: Volontaire) => Promise<void>;
}) {
  const [suppr, setSuppr] = useState<Volontaire | null>(null);

  if (erreur) {
    return (
      <p className="panel p-6 text-sm text-muted">
        La liste des volontaires n’est pas encore disponible ({erreur}). Exécute une fois le fichier{' '}
        <strong>supabase/maj-coalition-et-rappels.sql</strong> dans Supabase (SQL Editor, onglet
        vide).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Les personnes qui ont répondu « Je veux en faire partie » sur le menu de l’appli.
        </p>
        <Button
          variant="secondary"
          onClick={() => telechargerCsvCoalition(volontaires)}
          disabled={!volontaires.length}
        >
          <Download size={16} /> Exporter (Excel)
        </Button>
      </div>

      {volontaires.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-muted">
          Personne ne s’est encore porté volontaire.
        </p>
      ) : (
        <ul className="panel divide-y divide-line">
          {volontaires.map((v) => (
            <li key={v.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar user={{ id: v.id, prenom: v.prenom, nom: v.nom }} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy-950">{nomComplet(v)}</p>
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span>Volontaire le {new Date(v.le).toLocaleDateString('fr-FR')}</span>
                  {v.participant_id && (
                    <span className="inline-flex items-center gap-1 text-success">
                      <CalendarCheck size={12} /> inscrit(e) au calendrier
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSuppr(v)}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                aria-label={`Retirer ${nomComplet(v)}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!suppr} onClose={() => setSuppr(null)} title="Retirer de la liste" size="sm">
        {suppr && (
          <div className="p-6">
            <p className="text-[15px] text-ink/85">
              Retirer <strong>{nomComplet(suppr)}</strong> de la liste des volontaires ?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSuppr(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  void onSupprimer(suppr);
                  setSuppr(null);
                }}
              >
                Retirer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
