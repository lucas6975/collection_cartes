import { ChargementUlysse } from '../components/ui/vivant';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, cx } from '../components/ui/primitives';
import { ApiError, api, type Participant, type SuiviRoue } from '../data/api';
import { CASES } from '../domain/roue';

type Filtre = 'tous' | 'tournee' | 'attente';
type Etat = 'tournee' | 'ouverte' | 'vue' | 'rien';

const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const etatDe = (s: SuiviRoue | undefined): Etat =>
  s?.tournee_le ? 'tournee' : s?.ouverte_le ? 'ouverte' : s?.vue_le ? 'vue' : 'rien';

const ORDRE: Record<Etat, number> = { tournee: 0, ouverte: 1, vue: 2, rien: 3 };

/** Onglet « Roue » : qui a vu, ouvert et fait tourner la Roue de Secours. */
export function OngletRoue({ code, participants }: { code: string; participants: Participant[] }) {
  const [suivis, setSuivis] = useState<SuiviRoue[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<Filtre>('tous');

  const charger = useCallback(async () => {
    try {
      setSuivis(await api.adminRoue(code));
      setErreur(null);
    } catch (e) {
      setErreur(
        e instanceof ApiError
          ? `${e.message} (as-tu lancé supabase/maj-roue-stats.sql ?)`
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
        .map((p) => ({ p, s: parId.get(p.id), etat: etatDe(parId.get(p.id)) }))
        .sort(
          (a, b) =>
            ORDRE[a.etat] - ORDRE[b.etat] ||
            (a.s?.tournee_le ?? '').localeCompare(b.s?.tournee_le ?? '') ||
            a.p.prenom.localeCompare(b.p.prenom),
        ),
    [participants, parId],
  );

  const total = participants.length;
  const n = (e: Etat[]) => lignes.filter((l) => e.includes(l.etat)).length;
  const etapes = [
    { label: 'Ont vu la roue', emoji: '👀', n: n(['vue', 'ouverte', 'tournee']) },
    { label: 'L’ont ouverte', emoji: '👆', n: n(['ouverte', 'tournee']) },
    { label: 'L’ont fait tourner', emoji: '🌀', n: n(['tournee']) },
  ];
  const gains = CASES.map((c) => ({
    ...c,
    n: lignes.filter((l) => l.s?.gain === c.id).length,
  }));
  const premier = lignes.find((l) => l.etat === 'tournee');
  const visibles = lignes.filter((l) =>
    filtre === 'tous' ? true : filtre === 'tournee' ? l.etat === 'tournee' : l.etat !== 'tournee',
  );

  if (erreur)
    return (
      <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{erreur}</p>
    );
  if (!suivis) return <ChargementUlysse texte="Chargement de la roue…" />;

  return (
    <div className="space-y-4">
      <section
        className="rounded-3xl p-5 text-white shadow-lift"
        style={{ background: 'linear-gradient(135deg, #C8283A, #E8590C 55%, #F5C542)' }}
      >
        <p className="text-[11px] font-extrabold tracking-[0.12em] text-white/80">
          🛟 ROUE DE SECOURS · LUNDI 23 NOVEMBRE
        </p>
        <p className="mt-1 font-display text-3xl font-extrabold">
          {etapes[2].n} / {total}{' '}
          <span className="text-lg font-bold text-white/85">ont fait tourner la roue</span>
        </p>
        {premier?.s?.tournee_le && (
          <p className="mt-1 text-sm font-semibold text-white/90">
            🥇 Premier : {premier.p.prenom} {premier.p.nom} à {heure(premier.s.tournee_le)}
          </p>
        )}
        <div className="mt-4 space-y-2.5">
          {etapes.map((e) => {
            const part = total ? Math.round((e.n / total) * 100) : 0;
            return (
              <div key={e.label}>
                <div className="flex justify-between text-sm font-bold">
                  <span>
                    {e.emoji} {e.label}
                  </span>
                  <span>
                    {e.n} · {part} %
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-black/20">
                  <div className="h-full rounded-full bg-white" style={{ width: `${part}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="font-display text-[15px] font-extrabold text-navy-950">Les gains</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {gains.map((g) => (
            <div key={g.id} className="flex items-center gap-2.5 rounded-2xl bg-canvas px-3 py-2.5">
              <span className="text-2xl">{g.emoji}</span>
              <span className="min-w-0 flex-1 text-[13px] font-semibold leading-tight text-navy-950">
                {g.label}
              </span>
              <span className="font-display text-lg font-extrabold text-navy">{g.n}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="flex items-baseline justify-between font-display text-[15px] font-extrabold text-navy-950">
          Qui a joué ?
          <span className="font-sans text-xs font-medium text-muted">
            actualisé toutes les 30 s
          </span>
        </h2>
        <div className="mt-2.5 flex gap-1.5">
          {(
            [
              ['tous', 'Tous'],
              ['tournee', 'A tourné 🌀'],
              ['attente', 'Pas encore ⏳'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFiltre(id)}
              className={cx(
                'rounded-full px-3 py-1.5 text-xs font-bold',
                filtre === id ? 'bg-navy text-white' : 'bg-canvas text-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="mt-2 divide-y divide-line">
          {visibles.map(({ p, s, etat }) => {
            const gain = CASES.find((c) => c.id === s?.gain);
            return (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <Avatar user={p} size={34} />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm text-navy-950">
                    {p.prenom} {p.nom}
                  </b>
                  <span className="text-xs text-muted">
                    {etat === 'tournee' && s?.tournee_le
                      ? `A tourné à ${heure(s.tournee_le)}`
                      : etat === 'ouverte' && s?.ouverte_le
                        ? `A ouvert la roue à ${heure(s.ouverte_le)}, sans tourner`
                        : etat === 'vue' && s?.vue_le
                          ? `A vu la bannière à ${heure(s.vue_le)}`
                          : 'Pas encore venu'}
                  </span>
                </span>
                <span
                  className={cx(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
                    etat === 'tournee'
                      ? 'bg-success/15 text-success'
                      : etat === 'rien'
                        ? 'bg-canvas text-muted'
                        : 'bg-sun/25 text-navy-950',
                  )}
                >
                  {gain ? `${gain.emoji} ${gain.label}` : etat === 'rien' ? '—' : '⏳'}
                </span>
              </li>
            );
          })}
          {!visibles.length && <li className="py-4 text-center text-sm text-muted">Personne.</li>}
        </ul>
      </section>
    </div>
  );
}
