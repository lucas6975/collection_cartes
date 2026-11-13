import {
  BellRing,
  CheckCircle2,
  ChevronDown,
  Clock,
  Dices,
  Gift,
  XCircle,
  Download,
  Lock,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Trophy,
  Unlock,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { JOURS } from '../avent/jours';
import { Confetti, Etoiles, NOEL } from '../avent/ui';
import { Modal, useToast } from '../components/ui/overlay';
import { Avatar, Button, PageHeader, cx } from '../components/ui/primitives';
import { baseConfiguree } from '../config';
import { ApiError, api, type Participant, type ResultatAdmin, type Tirage } from '../data/api';
import { JOURS_OUVRES, useIdentite } from '../data/identite';
import { endpointActuel, rappelsStore } from '../data/rappels';

type Onglet = 'tirage' | 'inscrits' | 'resultats';

/** [1,2,3,5,7,8] → « 1–3, 5, 7–8 » */
export function plages(jours: number[]): string {
  if (jours.length === JOURS_OUVRES.length) return 'Tous les jours';
  const out: string[] = [];
  let debut = jours[0];
  for (let i = 1; i <= jours.length; i++) {
    if (jours[i] !== jours[i - 1] + 1) {
      const fin = jours[i - 1];
      out.push(debut === fin ? `${debut}` : `${debut}–${fin}`);
      debut = jours[i];
    }
  }
  return out.join(', ') || 'Aucun';
}

function jourParDefaut(tirages: Tirage[]): number {
  const now = new Date();
  if (now.getMonth() === 11 && JOURS_OUVRES.includes(now.getDate())) return now.getDate();
  return JOURS_OUVRES.find((j) => !tirages.some((t) => t.jour === j)) ?? 1;
}

const nomComplet = (p: { prenom: string; nom: string }) => `${p.prenom} ${p.nom}`;

export function Admin() {
  const { codeAdmin } = useIdentite();
  const toast = useToast();
  const [onglet, setOnglet] = useState<Onglet>('tirage');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tirages, setTirages] = useState<Tirage[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!codeAdmin) return;
    setChargement(true);
    try {
      const r = await api.adminListe(codeAdmin);
      setParticipants(r.participants);
      setTirages(r.tirages);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : 'Erreur de chargement');
    } finally {
      setChargement(false);
    }
  }, [codeAdmin]);

  useEffect(() => {
    // Chargement initial des inscrits et des tirages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, [charger]);

  if (!codeAdmin) return <Navigate to="/moi" replace />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Administration"
        title="Tirages au sort"
        description="Les inscrits du calendrier de l’Avent et le tirage de chaque jour."
      >
        <Button variant="secondary" onClick={() => void charger()} disabled={chargement}>
          <RefreshCw size={16} className={cx(chargement && 'animate-spin')} /> Actualiser
        </Button>
      </PageHeader>

      {!baseConfiguree() && (
        <p className="mb-5 rounded-2xl bg-sun/20 px-4 py-3 text-sm text-navy-950">
          La base de données n’est pas encore connectée : suis le guide{' '}
          <strong>docs/SUPABASE.md</strong>.
        </p>
      )}
      {erreur && (
        <p className="mb-5 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {erreur}
        </p>
      )}

      <TestNotifications code={codeAdmin} />

      <div
        className="mb-5 flex max-w-full overflow-x-auto rounded-2xl border border-line bg-white p-1 shadow-soft sm:inline-flex"
        role="tablist"
      >
        {(
          [
            ['tirage', 'Tirage', Dices],
            ['inscrits', `Inscrits (${participants.length})`, Users],
            ['resultats', 'Résultats', Trophy],
          ] as const
        ).map(([id, label, I]) => (
          <button
            key={id}
            role="tab"
            aria-selected={onglet === id}
            onClick={() => setOnglet(id)}
            className={cx(
              'relative flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-sm font-semibold sm:px-4',
              onglet === id ? 'text-white' : 'text-muted hover:text-navy',
            )}
          >
            {onglet === id && (
              <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-xl bg-navy" />
            )}
            <I size={16} className="relative" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {onglet === 'tirage' && (
        <OngletTirage
          code={codeAdmin}
          participants={participants}
          tirages={tirages}
          onChange={charger}
        />
      )}
      {onglet === 'inscrits' && (
        <OngletInscrits
          participants={participants}
          tirages={tirages}
          onSupprimer={async (p) => {
            try {
              await api.adminSupprimer(codeAdmin, p.id);
              toast(`${nomComplet(p)} supprimé(e)`, 'info');
              await charger();
            } catch (e) {
              toast(e instanceof ApiError ? e.message : 'Erreur', 'error');
            }
          }}
        />
      )}
      {onglet === 'resultats' && (
        <OngletResultats
          code={codeAdmin}
          tirages={tirages}
          onDebloquer={async (jour, debloquer) => {
            try {
              await api.adminDebloquerCorrection(codeAdmin, jour, debloquer);
              toast(
                debloquer
                  ? `Correction du ${jour} débloquée pour le gagnant`
                  : `Correction du ${jour} de nouveau cachée pour le gagnant`,
                'success',
              );
              await charger();
            } catch (e) {
              toast(
                e instanceof ApiError
                  ? `${e.message} (as-tu lancé supabase/maj-corrections.sql ?)`
                  : 'Erreur',
                'error',
              );
            }
          }}
        />
      )}
    </div>
  );
}

// ───────────── Tirage ─────────────

function OngletTirage({
  code,
  participants,
  tirages,
  onChange,
}: {
  code: string;
  participants: Participant[];
  tirages: Tirage[];
  onChange: () => Promise<void>;
}) {
  const toast = useToast();
  const [jour, setJour] = useState(() => jourParDefaut(tirages));
  const [roulement, setRoulement] = useState<{ nom: string; n: number } | null>(null);
  const [gagnant, setGagnant] = useState<Tirage | null>(null);
  const [fete, setFete] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const existant = tirages.find((t) => t.jour === jour);
  const gagnantsAutresJours = new Set(
    tirages.filter((t) => t.jour !== jour).map((t) => t.participant_id),
  );
  const eligibles = useMemo(
    () => participants.filter((p) => p.jours.includes(jour) && !gagnantsAutresJours.has(p.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [participants, jour, tirages],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const lancer = async (refaire: boolean) => {
    setConfirmer(false);
    setGagnant(null);
    let resultat: Tirage;
    try {
      resultat = await api.adminTirer(code, jour, refaire);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erreur', 'error');
      return;
    }
    // Les noms défilent de plus en plus lentement, puis s'arrêtent sur le gagnant.
    const noms = eligibles.length ? eligibles.map(nomComplet) : [nomComplet(resultat)];
    let i = 0;
    let delai = 55;
    const tourner = () => {
      setRoulement({ nom: noms[i % noms.length], n: i });
      i++;
      delai *= 1.12;
      if (delai < 420) timer.current = window.setTimeout(tourner, delai);
      else {
        setRoulement(null);
        setGagnant(resultat);
        setFete(true);
        window.setTimeout(() => setFete(false), 3800);
        void onChange();
      }
    };
    tourner();
  };

  const annuler = async () => {
    try {
      await api.adminAnnulerTirage(code, jour);
      setGagnant(null);
      toast(`Tirage du ${jour} décembre annulé`, 'info');
      await onChange();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erreur', 'error');
    }
  };

  const affiche = gagnant ?? (roulement ? null : existant);

  return (
    <div className="space-y-5">
      {fete && <Confetti />}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {JOURS_OUVRES.map((j) => {
          const fait = tirages.some((t) => t.jour === j);
          return (
            <button
              key={j}
              onClick={() => {
                setJour(j);
                setGagnant(null);
              }}
              className={cx(
                'relative grid size-11 shrink-0 place-items-center rounded-xl font-display font-extrabold transition-colors',
                j === jour
                  ? 'bg-navy text-white'
                  : fait
                    ? 'bg-success/15 text-success'
                    : 'bg-white text-navy ring-1 ring-line',
              )}
              aria-label={`Jour ${j}${fait ? ', tirage fait' : ''}`}
            >
              {j}
              {fait && j !== jour && <Trophy size={10} className="absolute right-1 top-1" />}
            </button>
          );
        })}
      </div>

      <section
        className="relative overflow-hidden rounded-3xl p-6 text-center text-white sm:p-8"
        style={{ background: `linear-gradient(160deg, #173A6B, ${NOEL.nuit})` }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sun">
          Tirage du {jour} décembre
        </p>
        <p className="mt-1 text-sm text-white/70">
          {eligibles.length} participant{eligibles.length > 1 ? 's' : ''} possible
          {eligibles.length > 1 ? 's' : ''}
          {gagnantsAutresJours.size > 0 && ' (les gagnants des autres jours sont exclus)'}
        </p>

        <div className="mx-auto mt-6 flex min-h-36 max-w-md items-center justify-center rounded-2xl bg-white/5 px-4 ring-1 ring-white/10">
          <AnimatePresence mode="popLayout">
            {roulement ? (
              <motion.p
                key={roulement.n}
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -28, opacity: 0 }}
                transition={{ duration: 0.08 }}
                className="font-display text-3xl font-extrabold text-white/90"
              >
                {roulement.nom}
              </motion.p>
            ) : affiche ? (
              <motion.div
                key="gagnant"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              >
                <Trophy size={30} className="mx-auto text-sun" />
                <p className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
                  {nomComplet(affiche)}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {gagnant
                    ? 'vient d’être tiré(e) au sort !'
                    : 'a été tiré(e) au sort pour ce jour'}
                </p>
              </motion.div>
            ) : (
              <motion.p
                key="vide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/60"
              >
                Pas encore de tirage pour ce jour.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          {existant || gagnant ? (
            <>
              <Button
                variant="ghost"
                onClick={() => setConfirmer(true)}
                disabled={!!roulement}
                className="border border-white/25 text-white hover:bg-white/10"
              >
                <RotateCcw size={16} /> Refaire le tirage
              </Button>
              <Button
                variant="ghost"
                onClick={annuler}
                disabled={!!roulement}
                className="text-white/70 hover:bg-white/10 hover:text-white"
              >
                Annuler ce tirage
              </Button>
            </>
          ) : (
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button
                variant="accent"
                size="lg"
                className="h-14 px-8 text-lg"
                onClick={() => void lancer(false)}
                disabled={!!roulement || eligibles.length === 0}
              >
                <Dices size={22} /> {roulement ? 'Tirage en cours…' : 'Lancer le tirage'}
              </Button>
            </motion.div>
          )}
        </div>
        {eligibles.length === 0 && !existant && (
          <p className="mt-3 text-sm text-white/70">Personne n’est inscrit(e) pour ce jour.</p>
        )}
      </section>

      {eligibles.length > 0 && (
        <section className="panel p-5">
          <p className="mb-3 text-sm font-semibold text-navy-950">
            Participants possibles le {jour} décembre
          </p>
          <div className="flex flex-wrap gap-2">
            {eligibles.map((p) => (
              <span key={p.id} className="rounded-full bg-canvas px-3 py-1 text-sm text-ink/85">
                {nomComplet(p)}
              </span>
            ))}
          </div>
        </section>
      )}

      <Modal
        open={confirmer}
        onClose={() => setConfirmer(false)}
        title="Refaire le tirage ?"
        size="sm"
      >
        <div className="p-6">
          <p className="text-[15px] text-ink/85">
            Le gagnant actuel du {jour} décembre{existant ? ` (${nomComplet(existant)})` : ''} sera
            remplacé par un nouveau tirage.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmer(false)}>
              Annuler
            </Button>
            <Button onClick={() => void lancer(true)}>
              <Dices size={16} /> Refaire
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ───────────── Inscrits ─────────────

function telechargerCsv(participants: Participant[], tirages: Tirage[]) {
  const echapper = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lignes = [
    ['Prénom', 'Nom', 'Jours', 'Gagné le', 'Inscrit le'].join(';'),
    ...participants.map((p) =>
      [
        echapper(p.prenom),
        echapper(p.nom),
        echapper(plages(p.jours)),
        echapper(
          tirages
            .filter((t) => t.participant_id === p.id)
            .map((t) => `${t.jour} déc.`)
            .join(', '),
        ),
        echapper(new Date(p.inscrit_le).toLocaleDateString('fr-FR')),
      ].join(';'),
    ),
  ];
  // BOM pour qu'Excel lise correctement les accents.
  const blob = new Blob(['﻿' + lignes.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'inscrits-calendrier-avent.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function OngletInscrits({
  participants,
  tirages,
  onSupprimer,
}: {
  participants: Participant[];
  tirages: Tirage[];
  onSupprimer: (p: Participant) => Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [suppr, setSuppr] = useState<Participant | null>(null);
  const liste = participants.filter((p) =>
    nomComplet(p).toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un nom…"
            className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-[16px] outline-none focus:border-blue focus:ring-4 focus:ring-blue/10"
          />
        </label>
        <Button
          variant="secondary"
          onClick={() => telechargerCsv(participants, tirages)}
          disabled={!participants.length}
        >
          <Download size={16} /> Exporter (Excel)
        </Button>
      </div>

      {liste.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-muted">
          {participants.length ? 'Aucun nom ne correspond.' : 'Personne ne s’est encore inscrit.'}
        </p>
      ) : (
        <ul className="panel divide-y divide-line">
          {liste.map((p) => {
            const gains = tirages.filter((t) => t.participant_id === p.id).map((t) => t.jour);
            return (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar user={{ id: p.id, prenom: p.prenom, nom: p.nom }} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy-950">
                    {nomComplet(p)}
                    {gains.length > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-sun/25 px-1.5 py-0.5 text-[11px] font-bold text-navy-950">
                        <Trophy size={11} /> {gains.join(', ')} déc.
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted">Jours : {plages(p.jours)}</p>
                </div>
                <button
                  onClick={() => setSuppr(p)}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                  aria-label={`Supprimer ${nomComplet(p)}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={!!suppr}
        onClose={() => setSuppr(null)}
        title="Supprimer l’inscription"
        size="sm"
      >
        {suppr && (
          <div className="p-6">
            <p className="text-[15px] text-ink/85">
              Supprimer <strong>{nomComplet(suppr)}</strong> de la liste des inscrits ? (doublon,
              erreur de saisie…)
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
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ───────────── Test des notifications (ce téléphone seulement) ─────────────

function TestNotifications({ code }: { code: string }) {
  const toast = useToast();
  const [envoi, setEnvoi] = useState(false);
  const tester = async () => {
    setEnvoi(true);
    try {
      const endpoint = await endpointActuel();
      if (!endpoint) {
        toast('Active d’abord les rappels sur ce téléphone (onglet Moi › Mes rappels).', 'error');
        return;
      }
      await rappelsStore.verifier().catch(() => undefined);
      const r = await api.adminTesterCompteARebours(code, endpoint);
      toast(`${r.envoyes} notifications envoyées sur ce téléphone 🔔`, 'success');
    } catch (e) {
      toast(
        e instanceof ApiError
          ? `${e.message} (as-tu redéployé la fonction envoyer-rappels ?)`
          : 'Erreur',
        'error',
      );
    } finally {
      setEnvoi(false);
    }
  };
  return (
    <section className="panel mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sun/25 text-navy-950">
        <BellRing size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display font-extrabold text-navy-950">Tester le compte à rebours</p>
        <p className="text-sm text-muted">
          Reçois tout de suite, sur <b>ce téléphone uniquement</b>, les notifications J-7, J-6, J-5,
          J-4, J-1 et celle du 1er décembre. Les collaborateurs ne reçoivent rien.
        </p>
      </div>
      <Button variant="accent" onClick={() => void tester()} disabled={envoi}>
        <BellRing size={16} /> {envoi ? 'Envoi…' : 'Recevoir le test'}
      </Button>
    </section>
  );
}

// ───────────── Résultats ─────────────

const heure = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Pastille du résultat d'un défi : réussi (1 étoile ou plus) ou raté. */
function Verdict({ r }: { r: ResultatAdmin | undefined }) {
  if (!r)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-muted">
        <Clock size={12} /> Pas encore joué
      </span>
    );
  const ok = r.etoiles > 0;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        ok ? 'bg-success/12 text-success' : 'bg-danger/10 text-danger',
      )}
    >
      {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {ok ? 'Défi réussi' : 'Défi raté'}
      <Etoiles n={r.etoiles} size={12} clair />
    </span>
  );
}

function OngletResultats({
  code,
  tirages,
  onDebloquer,
}: {
  code: string;
  tirages: Tirage[];
  onDebloquer: (jour: number, debloquer: boolean) => Promise<void>;
}) {
  const [resultats, setResultats] = useState<ResultatAdmin[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<number | null>(null);

  const charger = useCallback(async () => {
    try {
      setResultats(await api.adminResultats(code));
      setErreur(null);
    } catch (e) {
      setErreur(
        e instanceof ApiError
          ? `${e.message} (as-tu lancé supabase/maj-gagnant-et-resultats.sql ?)`
          : 'Erreur de chargement',
      );
    }
  }, [code]);

  useEffect(() => {
    // Résultats de tout le monde, actualisés toutes les 30 secondes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
    const t = setInterval(() => void charger(), 30_000);
    return () => clearInterval(t);
  }, [charger]);

  return (
    <div className="space-y-3">
      {erreur && (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {erreur}
        </p>
      )}
      <p className="text-sm text-muted">
        Pour chaque jour : la personne tirée au sort et son résultat, puis les résultats de tout le
        monde. <b className="text-navy-950">Défi réussi</b> = au moins 1 étoile. Le 1er essai est
        indiqué : on peut rejouer pour améliorer son score.
      </p>
      <ul className="panel divide-y divide-line">
        {JOURS_OUVRES.map((j) => {
          const t = tirages.find((x) => x.jour === j);
          const duJour = (resultats ?? []).filter((r) => r.jour === j);
          const rg = t ? duJour.find((r) => r.participant_id === t.participant_id) : undefined;
          const reussis = duJour.filter((r) => r.etoiles > 0).length;
          const titre = JOURS.find((x) => x.jour === j)?.titre;
          return (
            <li key={j} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <span
                  className={cx(
                    'grid size-10 shrink-0 place-items-center rounded-xl font-display font-extrabold',
                    t ? 'bg-success text-white' : 'bg-canvas text-navy/40',
                  )}
                >
                  {j}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  {titre && <p className="truncate text-xs font-semibold text-muted">{titre}</p>}
                  {t ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="flex items-center gap-1.5 font-semibold text-navy-950">
                        <Gift size={15} className="text-danger" /> {nomComplet(t)}
                      </p>
                      <Verdict r={rg} />
                      {rg && rg.premier_etoiles !== rg.etoiles && (
                        <span className="text-xs text-muted">
                          1er essai : {rg.premier_etoiles} ★
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Pas encore tiré</p>
                  )}
                  {t &&
                    (t.correction_debloquee ? (
                      <button
                        type="button"
                        onClick={() => void onDebloquer(j, false)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3 py-1.5 text-xs font-bold text-success"
                        title="Cacher à nouveau la correction pour le gagnant"
                      >
                        <Unlock size={13} /> Correction débloquée
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void onDebloquer(j, true)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-sun/25 px-3 py-1.5 text-xs font-bold text-navy-950 hover:bg-sun/40"
                        title="Le gagnant ne voit pas encore la correction de cette case"
                      >
                        <Lock size={13} /> Débloquer sa correction
                      </button>
                    ))}
                  {duJour.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOuvert(ouvert === j ? null : j)}
                      className="flex items-center gap-1 text-xs font-bold text-blue hover:underline"
                    >
                      <Users size={13} /> {duJour.length} joueur{duJour.length > 1 ? 's' : ''} ·{' '}
                      {reussis} réussi{reussis > 1 ? 's' : ''}
                      <ChevronDown
                        size={14}
                        className={cx('transition-transform', ouvert === j && 'rotate-180')}
                      />
                    </button>
                  )}
                  {ouvert === j && (
                    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                      {duJour.map((r) => (
                        <li
                          key={r.participant_id}
                          className={cx(
                            'flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm',
                            t?.participant_id === r.participant_id && 'bg-sun/15',
                          )}
                        >
                          <span className="min-w-0 flex-1 font-semibold text-navy-950">
                            {t?.participant_id === r.participant_id && '🎁 '}
                            {nomComplet(r)}
                          </span>
                          <Etoiles n={r.etoiles} size={13} clair />
                          <span className="w-full text-xs text-muted">
                            {r.details.map((d) => d.resume).join(' · ') || '—'} ·{' '}
                            {heure(r.premier_le)}
                            {r.premier_etoiles !== r.etoiles &&
                              ` · 1er essai ${r.premier_etoiles} ★`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
