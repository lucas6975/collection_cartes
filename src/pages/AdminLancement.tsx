import { BellRing, Pencil, Repeat2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MASCOTTE_URL } from '../components/cards/CardBack';
import { Avatar, cx } from '../components/ui/primitives';
import { ApiError, api, type ChiffresLancement, type Participant } from '../data/api';
import { dateInscription, inscritsDuJour, parHeure, parJour, plusRecents } from '../data/lancement';

const CLE_OBJECTIF = 'team-ulysse-objectif-inscrits';

function lireObjectif(): number {
  try {
    const n = Number(localStorage.getItem(CLE_OBJECTIF));
    return n > 0 ? n : 100;
  } catch {
    return 100;
  }
}

/** Onglet « Lancement » : les inscriptions en direct depuis le début. */
export function OngletLancement({
  code,
  participants,
  onActualiser,
}: {
  code: string;
  participants: Participant[];
  onActualiser: () => Promise<void>;
}) {
  const [chiffres, setChiffres] = useState<ChiffresLancement | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [vue, setVue] = useState<'jour' | 'semaine'>('jour');
  const [tout, setTout] = useState(false);
  const [objectif, setObjectif] = useState(lireObjectif);
  const [maintenant, setMaintenant] = useState(() => new Date());

  const chargerChiffres = useCallback(async () => {
    try {
      setChiffres(await api.adminLancement(code));
      setErreur(null);
    } catch (e) {
      setErreur(
        e instanceof ApiError
          ? `Rappels et échanges indisponibles : ${e.message} (as-tu lancé supabase/maj-lancement.sql ?)`
          : 'Erreur de chargement',
      );
    }
  }, [code]);

  useEffect(() => {
    // En direct : inscrits, rappels et échanges actualisés toutes les 30 secondes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void chargerChiffres();
    const t = setInterval(() => {
      setMaintenant(new Date());
      void onActualiser();
      void chargerChiffres();
    }, 30_000);
    return () => clearInterval(t);
  }, [chargerChiffres, onActualiser]);

  const total = participants.length;
  const aujourdhui = inscritsDuJour(participants, maintenant).length;
  const barres =
    vue === 'jour' ? parHeure(participants, maintenant) : parJour(participants, maintenant);
  const max = Math.max(1, ...barres.map((b) => b.n));
  const liste = useMemo(() => plusRecents(participants), [participants]);
  const avecRappels = useMemo(() => new Set(chiffres?.avec_rappels ?? []), [chiffres]);
  const visibles = tout ? liste : liste.slice(0, 10);

  const changerObjectif = () => {
    const r = window.prompt('Objectif d’inscrits', String(objectif));
    const n = Math.round(Number(r));
    if (!r || !(n > 0)) return;
    setObjectif(n);
    try {
      localStorage.setItem(CLE_OBJECTIF, String(n));
    } catch {
      /* pas grave : l'objectif reste pour cette visite */
    }
  };

  return (
    <div className="space-y-3">
      {erreur && (
        <p className="rounded-2xl bg-sun/20 px-4 py-3 text-sm font-medium text-navy-950">
          {erreur}
        </p>
      )}

      <section className="relative overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_85%_20%,#3d7fd6,#153e75_55%,#0b2347)] p-5 text-white shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold tracking-wider">
            <span className="size-[7px] rounded-full bg-[#4ade80] shadow-[0_0_0_3px_rgba(74,222,128,.3)]" />
            EN DIRECT
          </span>
          <div className="text-right">
            <p className="font-display text-3xl font-extrabold leading-none text-sun">
              +{aujourdhui}
            </p>
            <p className="mt-1 text-xs text-white/85">aujourd’hui</p>
          </div>
        </div>
        <p className="-mt-2 font-display text-6xl font-extrabold leading-none">{total}</p>
        <p className="mt-1 text-sm text-white/85">
          salarié{total > 1 ? 's' : ''} inscrit{total > 1 ? 's' : ''}
        </p>
        <button
          onClick={changerObjectif}
          className="mt-4 flex items-center gap-1.5 text-xs text-white/90 hover:text-white"
        >
          Objectif : {objectif} inscrits <Pencil size={12} />
        </button>
        <div className="mt-1.5 h-2 w-[68%] overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-sun transition-[width] duration-700"
            style={{ width: `${Math.min(100, (total / objectif) * 100)}%` }}
          />
        </div>
        <img
          src={MASCOTTE_URL}
          alt=""
          className="pointer-events-none absolute -bottom-3 -right-1 h-24 drop-shadow-lg"
        />
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <Tuile
          icone={<BellRing size={14} className="text-sun" />}
          titre="Rappels activés"
          valeur={chiffres ? chiffres.rappels : '–'}
          detail="téléphones"
        />
        <Tuile
          icone={<Repeat2 size={14} className="text-blue" />}
          titre="Échanges réussis"
          valeur={chiffres ? chiffres.echanges : '–'}
        />
      </div>

      <section className="panel p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-[15px] font-extrabold text-navy-950">Inscriptions</h2>
          <div className="flex rounded-lg bg-canvas p-0.5 text-xs font-semibold">
            {(
              [
                ['jour', 'Aujourd’hui'],
                ['semaine', '7 jours'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setVue(id)}
                className={cx(
                  'rounded-md px-2.5 py-1',
                  vue === id ? 'bg-white text-navy-950 shadow-sm' : 'text-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex h-28 items-end gap-1 border-b border-line">
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
        <div className="mt-1 flex gap-1">
          {barres.map((b) => (
            <span key={b.label} className="flex-1 text-center text-[9px] leading-tight text-muted">
              {vue === 'jour'
                ? b.label
                : b.label.split(' ').map((x) => (
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
          Tous les inscrits
          <span className="font-sans text-xs font-medium text-muted">du plus récent</span>
        </h2>
        {liste.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Personne pour l’instant… ça arrive ! 🚀
          </p>
        ) : (
          <ul className="mt-1 divide-y divide-line">
            {visibles.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <Avatar user={{ id: p.id, prenom: p.prenom, nom: p.nom }} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-950">
                    {p.prenom} {p.nom}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {dateInscription(p.inscrit_le, maintenant)}
                  </p>
                </div>
                {chiffres && (
                  <BellRing
                    size={16}
                    className={avecRappels.has(p.id) ? 'text-sun' : 'text-line'}
                    aria-label={avecRappels.has(p.id) ? 'Rappels activés' : 'Pas de rappels'}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        {liste.length > 10 && (
          <button
            onClick={() => setTout((v) => !v)}
            className="mt-2 w-full rounded-xl bg-canvas py-2 text-sm font-semibold text-navy"
          >
            {tout ? 'Réduire' : `Voir les ${liste.length - 10} autres`}
          </button>
        )}
      </section>
      <p className="text-center text-[11px] text-muted">
        Mis à jour automatiquement toutes les 30 s. 🔔 = rappels activés sur au moins un téléphone.
      </p>
    </div>
  );
}

function Tuile({
  icone,
  titre,
  valeur,
  detail,
}: {
  icone: React.ReactNode;
  titre: string;
  valeur: number | string;
  detail?: string;
}) {
  return (
    <div className="panel p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        {icone} {titre}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold text-navy-950">
        {valeur} {detail && <small className="text-xs font-semibold text-muted">{detail}</small>}
      </p>
    </div>
  );
}
