import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, cx } from '../components/ui/primitives';
import { ApiError, api, type Participant } from '../data/api';
import { dateInscription } from '../data/lancement';
import {
  packsParJour,
  seriePacks,
  statutDuJour,
  type Statut,
  type SuiviPacks,
} from '../data/packsAdmin';

type Filtre = 'tous' | 'ouvert' | 'attente';

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/** Onglet « Packs » : qui a ouvert son pack du jour. */
export function OngletPacks({ code, participants }: { code: string; participants: Participant[] }) {
  const [suivis, setSuivis] = useState<SuiviPacks[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [maintenant, setMaintenant] = useState(() => new Date());

  const charger = useCallback(async () => {
    try {
      setSuivis(await api.adminPacks(code));
      setMaintenant(new Date());
      setErreur(null);
    } catch (e) {
      setErreur(
        e instanceof ApiError
          ? `${e.message} (as-tu lancé supabase/maj-packs.sql ?)`
          : 'Erreur de chargement',
      );
    }
  }, [code]);

  useEffect(() => {
    // Actualisé toutes les 30 secondes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
    const t = setInterval(() => void charger(), 30_000);
    return () => clearInterval(t);
  }, [charger]);

  const parId = useMemo(() => new Map((suivis ?? []).map((s) => [s.participant_id, s])), [suivis]);
  const lignes = useMemo(
    () =>
      participants
        .map((p) => {
          const s = parId.get(p.id);
          return { p, s, statut: statutDuJour(s, maintenant), serie: seriePacks(s, maintenant) };
        })
        .sort((a, b) => ordre(a.statut) - ordre(b.statut) || a.p.prenom.localeCompare(b.p.prenom)),
    [participants, parId, maintenant],
  );

  const ouverts = lignes.filter((l) => l.statut.type === 'ouvert').length;
  const total = participants.length;
  const part = total ? Math.round((ouverts / total) * 100) : 0;
  const avecSuivi = (suivis ?? []).filter((s) => parId.has(s.participant_id));
  const meilleureSerie = Math.max(0, ...lignes.map((l) => l.serie));
  const moyenneCartes = avecSuivi.length
    ? avecSuivi.reduce((n, s) => n + s.cartes, 0) / avecSuivi.length
    : 0;
  const totalPacks = avecSuivi.reduce((n, s) => n + s.packs.length, 0);
  const barres = packsParJour(avecSuivi, maintenant);
  const max = Math.max(1, ...barres.map((b) => b.n));
  const visibles = lignes.filter(
    (l) =>
      filtre === 'tous' ||
      (filtre === 'ouvert' ? l.statut.type === 'ouvert' : l.statut.type !== 'ouvert'),
  );

  return (
    <div className="space-y-3">
      {erreur && (
        <p className="rounded-2xl bg-sun/20 px-4 py-3 text-sm font-medium text-navy-950">
          {erreur}
        </p>
      )}

      <section className="flex items-center gap-4 rounded-3xl bg-[radial-gradient(circle_at_85%_20%,#3d7fd6,#153e75_55%,#0b2347)] p-5 text-white shadow-soft">
        <div
          className="grid size-24 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(#f5c542 0 ${part}%, rgba(255,255,255,.18) ${part}% 100%)`,
          }}
        >
          <div className="grid size-[74px] place-items-center rounded-full bg-[#16437e] font-display text-xl font-extrabold">
            {part} %
          </div>
        </div>
        <div>
          <p className="font-display text-3xl font-extrabold">
            {ouverts} / {total}
          </p>
          <p className="text-sm leading-snug text-white/90">
            inscrit{total > 1 ? 's ont' : ' a'} ouvert le pack du jour
          </p>
          <p className="mt-1.5 text-[11.5px] text-white/75">
            {JOURS[maintenant.getDay()]} {maintenant.getDate()} {MOIS[maintenant.getMonth()]} ·
            actualisé à {maintenant.getHours()}h{String(maintenant.getMinutes()).padStart(2, '0')}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <Tuile titre="🔥 Meilleure série" valeur={`${meilleureSerie} j`} />
        <Tuile
          titre="🃏 Cartes / pers."
          valeur={moyenneCartes.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
        />
        <Tuile titre="📦 Packs ouverts" valeur={totalPacks} />
      </div>

      <section className="panel p-4">
        <h2 className="flex items-baseline justify-between font-display text-[15px] font-extrabold text-navy-950">
          Pack du jour ouvert
          <span className="font-sans text-xs font-medium text-muted">7 derniers jours</span>
        </h2>
        <div className="mt-4 flex h-28 items-end gap-1.5 border-b border-line">
          {barres.map((b) => (
            <div
              key={b.label}
              className="flex h-full flex-1 flex-col items-center justify-end gap-0.5"
            >
              {b.n > 0 && <span className="text-[10px] font-bold text-navy">{b.n}</span>}
              <span
                className={cx('w-full rounded-t-[4px]', b.actuelle ? 'bg-sun' : 'bg-blue')}
                style={{ height: `${(b.n / max) * 82}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1.5">
          {barres.map((b) => (
            <span key={b.label} className="flex-1 text-center text-[10px] leading-tight text-muted">
              {b.label.split(' ').map((x) => (
                <span key={x} className="block">
                  {x}
                </span>
              ))}
            </span>
          ))}
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="flex items-baseline justify-between font-display text-[15px] font-extrabold text-navy-950">
          Aujourd’hui
          <span className="font-sans text-xs font-medium text-muted">
            {total} inscrit{total > 1 ? 's' : ''}
          </span>
        </h2>
        <div className="mt-2.5 flex gap-1.5">
          {(
            [
              ['tous', 'Tous'],
              ['ouvert', 'Ouvert ✅'],
              ['attente', 'Pas encore ⏳'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFiltre(id)}
              className={cx(
                'rounded-full px-3 py-1 text-xs font-semibold',
                filtre === id ? 'bg-navy-950 text-white' : 'bg-canvas text-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {visibles.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Personne dans cette liste.</p>
        ) : (
          <ul className="mt-1 divide-y divide-line">
            {visibles.map(({ p, s, statut, serie }) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <Avatar user={{ id: p.id, prenom: p.prenom, nom: p.nom }} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-950">
                    {p.prenom} {p.nom}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {s
                      ? `${serie > 1 ? `🔥 ${serie} jours d’affilée` : serie === 1 ? '1 jour' : 'pas de série'} · ${s.cartes} carte${s.cartes > 1 ? 's' : ''}`
                      : 'appli pas encore rouverte'}
                  </p>
                </div>
                <Pastille statut={statut} maintenant={maintenant} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-center text-[11px] leading-snug text-muted">
        Chaque téléphone envoie son historique quand l’appli est ouverte. ❔ = pas d’information
        aujourd’hui (appli pas encore ouverte).
      </p>
    </div>
  );
}

function ordre(s: Statut) {
  return s.type === 'ouvert' ? 0 : s.type === 'pas-encore' ? 1 : 2;
}

function Pastille({ statut, maintenant }: { statut: Statut; maintenant: Date }) {
  if (statut.type === 'ouvert')
    return (
      <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
        ✅ {statut.heure}
      </span>
    );
  if (statut.type === 'pas-encore')
    return (
      <span className="shrink-0 rounded-full bg-sun/25 px-2 py-0.5 text-xs font-bold text-navy-950">
        ⏳ pas encore
      </span>
    );
  return (
    <span
      className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-xs font-bold text-muted"
      title={statut.vuLe ? `Appli ouverte ${dateInscription(statut.vuLe, maintenant)}` : undefined}
    >
      ❔ inconnu
    </span>
  );
}

function Tuile({ titre, valeur }: { titre: string; valeur: number | string }) {
  return (
    <div className="panel p-3">
      <p className="text-[11px] font-semibold leading-tight text-muted">{titre}</p>
      <p className="mt-1 font-display text-xl font-extrabold text-navy-950">{valeur}</p>
    </div>
  );
}
