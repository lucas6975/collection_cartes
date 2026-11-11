import {
  CalendarCheck,
  Dices,
  Download,
  HandHeart,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { Confetti, NOEL } from '../avent/ui';
import { Modal, useToast } from '../components/ui/overlay';
import { Avatar, Button, PageHeader, cx } from '../components/ui/primitives';
import { baseConfiguree } from '../config';
import { ApiError, api, type Participant, type Tirage, type Volontaire } from '../data/api';
import { JOURS_OUVRES, useIdentite } from '../data/identite';

type Onglet = 'tirage' | 'inscrits' | 'resultats' | 'coalition';

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
  const [volontaires, setVolontaires] = useState<Volontaire[]>([]);
  const [erreurCoalition, setErreurCoalition] = useState<string | null>(null);
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
    // Volontaires de la coalition : chargés à part (la table est ajoutée par une migration).
    try {
      setVolontaires(await api.adminVolontaires(codeAdmin));
      setErreurCoalition(null);
    } catch (e) {
      setErreurCoalition(e instanceof ApiError ? e.message : 'Erreur de chargement');
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

      <div
        className="mb-5 flex max-w-full overflow-x-auto rounded-2xl border border-line bg-white p-1 shadow-soft sm:inline-flex"
        role="tablist"
      >
        {(
          [
            ['tirage', 'Tirage', Dices],
            ['inscrits', `Inscrits (${participants.length})`, Users],
            ['resultats', 'Résultats', Trophy],
            ['coalition', `Coalition (${volontaires.length})`, HandHeart],
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
      {onglet === 'resultats' && <OngletResultats tirages={tirages} />}
      {onglet === 'coalition' && (
        <OngletCoalition
          volontaires={volontaires}
          erreur={erreurCoalition}
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

// ───────────── Résultats ─────────────

function OngletResultats({ tirages }: { tirages: Tirage[] }) {
  return (
    <ul className="panel divide-y divide-line">
      {JOURS_OUVRES.map((j) => {
        const t = tirages.find((x) => x.jour === j);
        return (
          <li key={j} className="flex items-center gap-4 px-4 py-3">
            <span
              className={cx(
                'grid size-10 shrink-0 place-items-center rounded-xl font-display font-extrabold',
                t ? 'bg-success text-white' : 'bg-canvas text-navy/40',
              )}
            >
              {j}
            </span>
            {t ? (
              <p className="flex items-center gap-2 font-semibold text-navy-950">
                <ShieldCheck size={16} className="text-success" /> {nomComplet(t)}
              </p>
            ) : (
              <p className="text-sm text-muted">Pas encore tiré</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ───────────── Coalition : volontaires ─────────────

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

function OngletCoalition({
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
        <strong>supabase/maj-coalition.sql</strong> dans Supabase (SQL Editor, onglet vide).
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
