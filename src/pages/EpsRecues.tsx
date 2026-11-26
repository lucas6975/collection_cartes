// EPS reçues (Lucas, Vincent, administrateur) : les dernières EPS faites, en direct, comme les
// remontées reçues. Le détail complet reste dans Espace Sécurité › EPS › Liste.
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BadgeNiveau } from '../components/eps/Graphiques';
import { ChargementUlysse } from '../components/ui/vivant';
import { ApiError, api, type DonneesEps } from '../data/api';
import { useIdentite } from '../data/identite';
import { NIVEAUX, type Niveau } from '../domain/eps';
import { epsDeLaSemaine, recapEps } from '../domain/epsRecap';

const dateFr = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/');

export function EpsRecues() {
  const { identite, codeAdmin } = useIdentite();
  const navigate = useNavigate();
  const [donnees, setDonnees] = useState<DonneesEps | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const jeton = identite?.jeton ?? null;

  const charger = useCallback(async () => {
    try {
      setDonnees(await api.epsDonnees(jeton, codeAdmin));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : 'Erreur de chargement');
    }
  }, [jeton, codeAdmin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
    const t = setInterval(() => void charger(), 30_000);
    return () => clearInterval(t);
  }, [charger]);

  const annee = new Date().getFullYear();
  const semaine = donnees ? epsDeLaSemaine(donnees.eps) : [];
  const recap = donnees
    ? recapEps(donnees.eps, annee, new Date().toISOString().slice(0, 10))
    : null;
  const taux =
    donnees && recap && donnees.inscrits
      ? Math.round((recap.personnes / donnees.inscrits) * 100)
      : null;
  const dernieres = donnees ? donnees.eps.slice(0, 15) : [];

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
            EPS reçues
          </h1>
          <p className="text-[15px] text-muted">Échanges Périodiques de Sécurité</p>
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
      {!donnees && !erreur && <ChargementUlysse texte="Ulysse récupère les EPS…" />}

      {donnees && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="panel p-4 text-center">
              <p className="font-display text-3xl font-extrabold text-navy-950">{semaine.length}</p>
              <p className="text-xs text-muted">ces 7 derniers jours</p>
            </div>
            <div className="panel p-4 text-center">
              <p className="font-display text-3xl font-extrabold text-navy-950">
                {taux === null ? '—' : `${taux} %`}
              </p>
              <p className="text-xs text-muted">réalisation {annee}</p>
            </div>
          </div>

          <section className="panel mt-4 p-4">
            <p className="eyebrow mb-1">Dernières EPS</p>
            <ul className="divide-y divide-line">
              {dernieres.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-2xl font-display text-xs font-extrabold text-white"
                    style={{
                      background: e.niveau ? NIVEAUX[e.niveau as Niveau].couleur : '#0F7F7A',
                    }}
                  >
                    {dateFr(e.date)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-navy-950">{e.interviewe}</b>
                    <span className="block truncate text-xs text-muted">
                      par {e.interviewer}
                      {e.source === 'import' ? ' · fichier Excel' : ''}
                    </span>
                  </span>
                  {e.niveau ? <BadgeNiveau niveau={e.niveau as Niveau} /> : null}
                </li>
              ))}
            </ul>
            <Link
              to="/securite/eps?section=liste"
              className="mt-2 flex items-center justify-center gap-1 text-sm font-extrabold text-[#0F7F7A]"
            >
              Voir toutes les EPS <ChevronRight size={16} />
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
