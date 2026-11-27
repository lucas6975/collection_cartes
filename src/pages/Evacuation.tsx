// Espace Sécurité › Évacuation (Lucas, Vincent, administrateur) : lancer l'évacuation, faire
// scanner le QR, suivre le total en direct, pointer avec la liste d'appel imprimée, terminer.
import {
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Search,
  ShieldAlert,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { renderSVG } from 'uqr';
import { cx } from '../components/ui/primitives';
import { ApiError, api, type SuiviEvacuation } from '../data/api';
import { STATUTS, LIEN_RASSEMBLEMENT, heureFr } from '../data/evacuation';
import { creerXlsx, proposerFichier } from '../data/excel';
import { useIdentite } from '../data/identite';
import { ListeAppel } from '../components/evacuation/ListeAppel';
import { comparer } from '../domain/appel';

export const COULEUR_EVACUATION = {
  fond: 'linear-gradient(150deg, #F97316 0%, #DC2626 55%, #7F1D1D 100%)',
  vif: '#DC2626',
  doux: '#FEF2F2',
};

/** Durée en « 1 h 02 min 05 s » ou « 04:37 » (chronomètre). */
export function duree(debut: string, fin: string | null, maintenant = Date.now()): string {
  const s = Math.max(
    0,
    Math.floor(((fin ? Date.parse(fin) : maintenant) - Date.parse(debut)) / 1000),
  );
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const deux = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${deux(m)}:${deux(sec)}` : `${deux(m)}:${deux(sec)}`;
}

/** Chronomètre : part du lancement, s'arrête à la fin (même valeur sur tous les téléphones). */
function Chrono({ debut, fin }: { debut: string; fin: string | null }) {
  const [, setTic] = useState(0);
  useEffect(() => {
    if (fin) return;
    const t = setInterval(() => setTic((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [fin]);
  return (
    <div className="mt-3 flex items-center justify-between rounded-2xl bg-black/25 px-4 py-2.5">
      <span className="flex items-center gap-2 text-sm font-bold">
        <Timer size={18} className={fin ? '' : 'animate-pulse'} />
        {fin ? 'Durée de l’évacuation' : 'Chronomètre'}
      </span>
      <span className="font-display text-[34px] leading-none font-extrabold tabular-nums">
        {duree(debut, fin)}
      </span>
    </div>
  );
}

const dateHeure = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

function QrRassemblement({ taille = 'grand' }: { taille?: 'grand' | 'moyen' }) {
  return (
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(renderSVG(LIEN_RASSEMBLEMENT, { ecc: 'H', border: 1 }))}`}
      alt="QR code du point de rassemblement"
      className={cx(
        'mx-auto block rounded-2xl bg-white [image-rendering:pixelated]',
        taille === 'grand' ? 'w-full max-w-[320px]' : 'w-48',
      )}
    />
  );
}

export function OngletEvacuation({ code, jeton }: { code: string | null; jeton: string | null }) {
  const { identite } = useIdentite();
  const [vue, setVue] = useState<string | null>(null);
  const [suivi, setSuivi] = useState<SuiviEvacuation | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    try {
      setSuivi(await api.evacuationSuivi(vue, jeton, code));
      setErreur(null);
    } catch (e) {
      setErreur(
        e instanceof ApiError
          ? `${e.message} (as-tu lancé supabase/maj-evacuation.sql ?)`
          : 'Erreur',
      );
    }
  }, [vue, jeton, code]);

  const enCours = Boolean(suivi?.evacuation && !suivi.evacuation.fin);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
    const t = setInterval(() => void charger(), enCours ? 4000 : 30_000);
    return () => clearInterval(t);
  }, [charger, enCours]);

  const lancer = async (test: boolean) => {
    const question = test
      ? 'Lancer une évacuation TEST ? Seuls Lucas et Vincent reçoivent l’alerte.'
      : `Lancer une VRAIE évacuation incendie ? L’alerte part sur tous les téléphones abonnés${suivi?.abonnes ? ` (${suivi.abonnes})` : ''}.`;
    if (!confirm(question)) return;
    setOccupe(true);
    try {
      await api.evacuationDemarrer(
        identite ? `${identite.prenom} ${identite.nom}` : 'Administrateur',
        test,
        jeton,
        code,
      );
      setVue(null);
      await charger();
    } finally {
      setOccupe(false);
    }
  };

  const terminer = async () => {
    if (!suivi?.evacuation || !confirm('Terminer l’évacuation ? Plus personne ne pourra scanner.'))
      return;
    await api.evacuationTerminer(suivi.evacuation.id, jeton, code);
    setVue(suivi.evacuation.id);
  };

  if (erreur)
    return (
      <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{erreur}</p>
    );
  if (!suivi) return <p className="py-10 text-center text-muted">Chargement…</p>;

  // Aucune évacuation affichée : lancer + QR permanent + historique.
  if (!suivi.evacuation)
    return (
      <div className="space-y-4">
        <section
          className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lift"
          style={{ background: COULEUR_EVACUATION.fond }}
        >
          <p className="eyebrow text-white/80">🚨 Point de rassemblement</p>
          <h2 className="mt-1 font-display text-[26px] leading-tight font-extrabold">
            Recensement des présents
          </h2>
          <p className="mt-1.5 text-sm text-white/90">
            Lance l’évacuation : chacun scanne le QR (même sans l’appli) et se déclare présent. Les
            inscrits ont aussi un bandeau dans l’appli.
          </p>
          <button
            type="button"
            disabled={occupe}
            onClick={() => void lancer(false)}
            className="mt-4 flex min-h-14 w-full flex-col items-center justify-center rounded-2xl bg-white px-3 py-2.5 text-[#B91C1C] disabled:opacity-60"
          >
            <span className="flex items-center gap-2 text-lg font-extrabold">
              <ShieldAlert size={22} /> Vraie évacuation incendie
            </span>
            <span className="text-xs font-semibold text-[#7F1D1D]">
              Alerte sur tous les téléphones
              {suivi.abonnes ? ` abonnés (${suivi.abonnes})` : ''}
            </span>
          </button>
          <button
            type="button"
            disabled={occupe}
            onClick={() => void lancer(true)}
            className="mt-2.5 flex min-h-12 w-full flex-col items-center justify-center rounded-2xl border-2 border-white/70 px-3 py-2 text-white disabled:opacity-60"
          >
            <span className="font-extrabold">🧪 Évacuation test</span>
            <span className="text-xs text-white/85">Alerte seulement pour Lucas et Vincent</span>
          </button>
        </section>

        <section className="panel p-4 text-center">
          <p className="eyebrow mb-2">QR code permanent</p>
          <QrRassemblement taille="moyen" />
          <p className="mt-2 text-sm text-muted">
            Le même QR sert à chaque évacuation : il peut être imprimé et affiché au point de
            rassemblement. Il ne fonctionne que pendant une évacuation lancée ici.
          </p>
        </section>

        {suivi.historique.length > 0 && (
          <section className="panel p-4">
            <p className="eyebrow mb-2">Évacuations et exercices passés</p>
            <ul className="divide-y divide-line">
              {suivi.historique.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => setVue(h.id)}
                    className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm"
                  >
                    <span className="font-semibold text-navy-950">
                      {h.test ? '🧪 ' : '🚨 '}
                      {dateHeure(h.debut)}
                    </span>
                    <span className="text-muted">
                      {h.total} présent{h.total > 1 ? 's' : ''}
                      {h.fin ? ` · ⏱ ${duree(h.debut, h.fin)}` : ' · en cours'} ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );

  return (
    <Suivi
      suivi={suivi}
      code={code}
      jeton={jeton}
      onRecharger={() => void charger()}
      onTerminer={() => void terminer()}
      onFermer={() => setVue(null)}
    />
  );
}

function Suivi({
  suivi,
  code,
  jeton,
  onRecharger,
  onTerminer,
  onFermer,
}: {
  suivi: SuiviEvacuation;
  code: string | null;
  jeton: string | null;
  onRecharger: () => void;
  onTerminer: () => void;
  onFermer: () => void;
}) {
  const ev = suivi.evacuation!;
  const enCours = !ev.fin;
  const [recherche, setRecherche] = useState('');
  const [ajout, setAjout] = useState(false);
  const [nouveau, setNouveau] = useState({ prenom: '', nom: '', statut: 'Visiteur', societe: '' });
  const [qrOuvert, setQrOuvert] = useState(true);

  const presents = suivi.presents;
  const comparaison = ev.liste_appel?.length
    ? comparer(ev.liste_appel, presents, (p) => `${p.prenom} ${p.nom}`)
    : null;
  const surListe = new Set(comparaison?.ensemble.map((e) => e.present.id) ?? []);
  const filtre = recherche.trim().toLowerCase();
  const visibles = presents.filter(
    (p) => !filtre || `${p.prenom} ${p.nom} ${p.societe ?? ''}`.toLowerCase().includes(filtre),
  );
  const parStatut = STATUTS.map((s) => [s, presents.filter((p) => p.statut === s).length] as const);

  const retirer = async (id: string, nom: string) => {
    if (!confirm(`Retirer ${nom} de la liste des présents ?`)) return;
    await api.evacuationRetirer(id, jeton, code).catch(() => undefined);
    onRecharger();
  };
  const ajouter = async () => {
    if (!nouveau.prenom.trim() || !nouveau.nom.trim()) return;
    await api.evacuationAjouter(ev.id, nouveau, jeton, code).catch(() => undefined);
    setNouveau({ prenom: '', nom: '', statut: 'Visiteur', societe: '' });
    setAjout(false);
    onRecharger();
  };
  const supprimer = async () => {
    if (!confirm('Supprimer définitivement cette évacuation (exercice ou test) ?')) return;
    await api.evacuationSupprimer(ev.id, jeton, code);
    onFermer();
  };
  const extraire = async () => {
    const jour = ev.debut.slice(0, 10);
    const fichier = creerXlsx([
      {
        nom: 'Présents',
        largeurs: [20, 20, 16, 20, 10, 16, 18],
        lignes: [
          ['Nom', 'Prénom', 'Statut', 'Société', 'Heure', 'Enregistré par', 'Liste d’appel'],
          ...presents.map((p) => [
            p.nom.toUpperCase(),
            p.prenom,
            p.statut,
            p.societe,
            heureFr(p.heure),
            p.ajoute_par === 'manuel' ? 'Ajout manuel' : p.appli ? 'Appli' : 'QR code',
            !comparaison ? '' : surListe.has(p.id) ? 'Sur la liste' : 'Absent de la liste',
          ]),
        ],
      },
      {
        nom: 'Bilan',
        largeurs: [38, 24],
        lignes: [
          ['Évacuation', dateHeure(ev.debut)],
          ['Fin', ev.fin ? dateHeure(ev.fin) : 'En cours'],
          ['Durée (chronomètre)', duree(ev.debut, ev.fin)],
          ['Présents enregistrés', presents.length],
          ...parStatut.map(([s, n]) => [`dont ${s}`, n] as [string, number]),
          ['Personnes sur la liste d’appel', ev.liste_appel?.length ?? null],
          ['Sur la liste et dans l’appli', comparaison?.ensemble.length ?? null],
          ['Sur la liste, pas dans l’appli (à retrouver)', comparaison?.manquants.length ?? null],
          ['Dans l’appli, pas sur la liste', comparaison?.horsListe.length ?? null],
        ],
      },
      ...(comparaison
        ? [
            {
              nom: 'À retrouver',
              largeurs: [40],
              lignes: [
                ['Sur la liste d’appel, pas déclaré(e)s présent(e)s'],
                ...comparaison.manquants.map((n) => [n]),
              ],
            },
          ]
        : []),
    ]);
    await proposerFichier(fichier, `Evacuation-${jour}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <section
        className="rounded-3xl p-5 text-white shadow-lift"
        style={{ background: enCours ? COULEUR_EVACUATION.fond : '#334155' }}
      >
        <p className="eyebrow text-white/80">
          {ev.test ? '🧪 Test · ' : ''}
          {enCours ? '🚨 Évacuation en cours' : '✅ Évacuation terminée'}
        </p>
        <p className="mt-1 text-sm text-white/90">
          {enCours ? 'Depuis' : 'Du'} {dateHeure(ev.debut)}
          {ev.lance_par ? ` · lancée par ${ev.lance_par}` : ''}
        </p>
        <Chrono debut={ev.debut} fin={ev.fin} />
        <div className="mt-3 flex items-end gap-3">
          <p className="font-display text-[64px] leading-none font-extrabold">{presents.length}</p>
          <p className="pb-2 text-lg font-bold">
            présent{presents.length > 1 ? 's' : ''}
            <br />
            <span className="text-sm font-semibold text-white/85">au point de rassemblement</span>
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {parStatut
            .filter(([, n]) => n)
            .map(([s, n]) => (
              <span key={s} className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
                {s} : {n}
              </span>
            ))}
        </div>
      </section>

      {enCours && (
        <section className="panel p-4 text-center">
          <button
            type="button"
            onClick={() => setQrOuvert(!qrOuvert)}
            className="eyebrow mb-2 w-full"
          >
            {qrOuvert ? 'Faites scanner ce QR code ▾' : 'Afficher le QR code ▸'}
          </button>
          {qrOuvert && <QrRassemblement />}
        </section>
      )}

      {/* Liste d'appel du poste de garde : scan, comparaison vert / rouge */}
      <ListeAppel
        liste={ev.liste_appel ?? null}
        comparaison={comparaison}
        onEnregistrer={async (noms) => {
          await api.evacuationListeAppel(ev.id, noms, jeton, code);
          onRecharger();
        }}
      />

      {/* Liste des présents */}
      <section className="panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <label className="relative flex-1">
            <Search size={17} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Chercher un nom…"
              className="h-11 w-full rounded-xl border border-line pr-3 pl-9"
            />
          </label>
          <button
            type="button"
            onClick={() => setAjout(!ajout)}
            className="flex h-11 items-center gap-1 rounded-xl bg-navy-950 px-3 text-sm font-bold text-white"
          >
            {ajout ? <X size={16} /> : <Plus size={16} />} Ajouter
          </button>
        </div>

        {ajout && (
          <div className="mb-3 space-y-2 rounded-2xl bg-canvas p-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={nouveau.prenom}
                onChange={(e) => setNouveau({ ...nouveau, prenom: e.target.value })}
                placeholder="Prénom *"
                className="h-11 rounded-xl border border-line bg-white px-3"
              />
              <input
                value={nouveau.nom}
                onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })}
                placeholder="Nom *"
                className="h-11 rounded-xl border border-line bg-white px-3"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNouveau({ ...nouveau, statut: s })}
                  className={cx(
                    'rounded-full px-3 py-1.5 text-xs font-bold',
                    nouveau.statut === s ? 'bg-navy-950 text-white' : 'bg-white text-muted',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {nouveau.statut !== 'Salarié IMECA' && (
              <input
                value={nouveau.societe}
                onChange={(e) => setNouveau({ ...nouveau, societe: e.target.value })}
                placeholder="Société"
                className="h-11 w-full rounded-xl border border-line bg-white px-3"
              />
            )}
            <button
              type="button"
              onClick={() => void ajouter()}
              className="h-11 w-full rounded-xl bg-[#16A34A] font-bold text-white"
            >
              Ajouter aux présents
            </button>
          </div>
        )}

        {!presents.length && (
          <p className="py-4 text-center text-sm text-muted">Personne pour l’instant…</p>
        )}
        <ul className="divide-y divide-line">
          {visibles.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <span
                title={
                  !comparaison
                    ? ''
                    : surListe.has(p.id)
                      ? 'Sur la liste d’appel'
                      : 'Absent de la liste'
                }
                className={cx(
                  'grid size-9 shrink-0 place-items-center rounded-xl text-white',
                  !comparaison
                    ? 'bg-canvas text-muted'
                    : surListe.has(p.id)
                      ? 'bg-[#16A34A]'
                      : 'bg-[#DC2626]',
                )}
              >
                {!comparaison ? '•' : surListe.has(p.id) ? <CheckCircle2 size={18} /> : '!'}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-navy-950">
                  {p.nom.toUpperCase()} {p.prenom}
                </b>
                <span className="block truncate text-xs text-muted">
                  {p.statut}
                  {p.societe ? ` · ${p.societe}` : ''} · {heureFr(p.heure)}
                  {p.ajoute_par === 'manuel' ? ' · ajout manuel' : ''}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void retirer(p.id, `${p.prenom} ${p.nom}`)}
                aria-label="Retirer"
                className="grid size-9 shrink-0 place-items-center rounded-xl text-muted"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={() => void extraire()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1D7A4B] font-bold text-white"
      >
        <FileSpreadsheet size={18} /> Extraire la liste en Excel
      </button>
      {enCours ? (
        <button
          type="button"
          onClick={onTerminer}
          className="h-12 w-full rounded-2xl border-2 border-danger/40 bg-white font-bold text-danger"
        >
          Terminer l’évacuation
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onFermer}
            className="h-12 rounded-2xl bg-white font-bold text-navy-950 shadow-soft"
          >
            ← Retour
          </button>
          <button
            type="button"
            onClick={() => void supprimer()}
            className="h-12 rounded-2xl border-2 border-danger/30 bg-white text-sm font-bold text-danger"
          >
            Supprimer (test)
          </button>
        </div>
      )}
    </div>
  );
}
