// Bilans des évacuations (exercices et réelles) : une carte par évacuation terminée, et un bilan
// détaillé quand on la touche (durées, rythme d'arrivée, répartition, liste d'appel, évolution).
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Minus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ChargementUlysse } from '../components/ui/vivant';
import { cx } from '../components/ui/primitives';
import { api, type SuiviEvacuation } from '../data/api';
import { heureFr } from '../data/evacuation';
import { creerXlsx, proposerFichier } from '../data/excel';
import { useIdentite } from '../data/identite';
import { bilanEvacuation, dureeLisible, type Bilan } from '../domain/bilanEvacuation';

const ROUGE = '#DC2626';
const VERT = '#16A34A';
const BLEU = '#2E6ED0';
const ORANGE = '#E2471F';

const dateLongue = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const secondes = (debut: string, fin: string | null) =>
  fin ? Math.round((Date.parse(fin) - Date.parse(debut)) / 1000) : null;

function useJetonCode() {
  const { identite, codeAdmin } = useIdentite();
  return { jeton: identite?.jeton ?? null, code: codeAdmin };
}

// ───────────── Liste des bilans ─────────────

export function BilansEvacuation() {
  const { id } = useParams();
  return id ? <BilanDetail id={id} /> : <ListeBilans />;
}

function ListeBilans() {
  const { jeton, code } = useJetonCode();
  const navigate = useNavigate();
  const [suivi, setSuivi] = useState<SuiviEvacuation | null>(null);
  useEffect(() => {
    api
      .evacuationSuivi(null, jeton, code)
      .then(setSuivi)
      .catch(() => undefined);
  }, [jeton, code]);
  const finies = suivi?.historique.filter((h) => h.fin) ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/securite/evacuation')}
          aria-label="Retour"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-navy-950 shadow-soft"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="font-display text-[26px] leading-tight font-extrabold text-navy-950">
            Bilans des évacuations
          </h1>
          <p className="text-[15px] text-muted">Exercices et évacuations réelles</p>
        </div>
      </header>
      {!suivi && <ChargementUlysse texte="Ulysse rassemble les bilans…" />}
      {suivi && !finies.length && (
        <p className="panel p-5 text-center text-sm text-muted">
          Aucune évacuation terminée pour l’instant. Le bilan apparaît ici dès qu’on touche «
          Terminer l’évacuation ».
        </p>
      )}
      <div className="space-y-3">
        {finies.map((h, i) => (
          <Link
            key={h.id}
            to={`/securite/bilans/${h.id}`}
            className="relative flex items-center gap-4 overflow-hidden rounded-[24px] p-4 text-white shadow-soft transition-transform active:scale-[0.99]"
            style={{
              background: h.test
                ? 'linear-gradient(135deg,#3A4A63,#1E293B)'
                : 'linear-gradient(135deg,#F97316,#B91C1C)',
            }}
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl">
              {h.test ? '🧪' : '🚨'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold tracking-wider text-white/80 uppercase">
                {h.test ? 'Exercice' : 'Évacuation réelle'} · n° {finies.length - i}
              </span>
              <b className="block font-display text-lg leading-tight">{dateCourte(h.debut)}</b>
              <span className="mt-1 flex flex-wrap gap-1.5 text-xs font-bold">
                <span className="rounded-full bg-white/20 px-2 py-0.5">
                  ⏱ {dureeLisible(secondes(h.debut, h.fin))}
                </span>
                <span className="rounded-full bg-white/20 px-2 py-0.5">👥 {h.total} présents</span>
              </span>
            </span>
            <ChevronRight size={22} />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ───────────── Bilan détaillé ─────────────

function BilanDetail({ id }: { id: string }) {
  const { jeton, code } = useJetonCode();
  const navigate = useNavigate();
  const [suivi, setSuivi] = useState<SuiviEvacuation | null>(null);
  const [precedent, setPrecedent] = useState<SuiviEvacuation | null>(null);

  useEffect(() => {
    let actif = true;
    void (async () => {
      const s = await api.evacuationSuivi(id, jeton, code).catch(() => null);
      if (!actif || !s) return;
      setSuivi(s);
      // Évacuation terminée juste avant (même type de préférence) pour comparer.
      const finies = s.historique.filter((h) => h.fin && h.debut < s.evacuation!.debut);
      const avant =
        finies.find((h) => Boolean(h.test) === Boolean(s.evacuation!.test)) ?? finies[0];
      if (avant) {
        const p = await api.evacuationSuivi(avant.id, jeton, code).catch(() => null);
        if (actif) setPrecedent(p);
      }
    })();
    return () => {
      actif = false;
    };
  }, [id, jeton, code]);

  if (!suivi?.evacuation) return <ChargementUlysse texte="Ulysse prépare le bilan…" />;
  const ev = suivi.evacuation;
  const b = bilanEvacuation(suivi);
  const avant = precedent?.evacuation ? bilanEvacuation(precedent) : null;

  const exporter = async () => {
    const fichier = creerXlsx([
      {
        nom: 'Bilan',
        largeurs: [42, 26],
        lignes: [
          ['Bilan', ev.test ? 'Exercice' : 'Évacuation réelle'],
          ['Début', dateLongue(ev.debut)],
          ['Durée', dureeLisible(b.duree)],
          ['Lancée par', ev.lance_par],
          ['Présents', b.total],
          ['1re arrivée', dureeLisible(b.premiere)],
          ['50 % arrivés en', dureeLisible(b.t50)],
          ['90 % arrivés en', dureeLisible(b.t90)],
          ['Dernière arrivée', dureeLisible(b.derniere)],
          ['Arrivés en moins de 3 min', b.avant3min],
          ['Inscrits Team Ulysse', b.parMoyen.inscrit],
          ['Sans l’appli (QR)', b.parMoyen.qr],
          ['Ajoutés à la main', b.parMoyen.manuel],
          ...b.parStatut.map(([s, n]) => [s, n] as [string, number]),
          ['Personnes sur la liste d’appel', b.liste?.effectif ?? null],
          ['Retrouvées (liste et appli)', b.liste?.ensemble ?? null],
          ['À retrouver (sur la liste seulement)', b.liste?.manquants.length ?? null],
          ['Dans l’appli, pas sur la liste', b.liste?.horsListe.length ?? null],
        ],
      },
      {
        nom: 'Présents',
        largeurs: [20, 20, 16, 20, 10, 16],
        lignes: [
          ['Nom', 'Prénom', 'Statut', 'Société', 'Heure', 'Arrivé après'],
          ...suivi.presents.map((p) => [
            p.nom.toUpperCase(),
            p.prenom,
            p.statut,
            p.societe,
            heureFr(p.heure),
            dureeLisible(Math.round((Date.parse(p.heure) - Date.parse(ev.debut)) / 1000)),
          ]),
        ],
      },
    ]);
    await proposerFichier(fichier, `Bilan-evacuation-${ev.debut.slice(0, 10)}.xlsx`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/securite/bilans')}
          aria-label="Retour"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-navy-950 shadow-soft"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="font-display text-[24px] leading-tight font-extrabold text-navy-950">
            Bilan {ev.test ? 'de l’exercice' : 'de l’évacuation'}
          </h1>
          <p className="text-[14px] text-muted capitalize">{dateLongue(ev.debut)}</p>
        </div>
      </header>

      {/* En-tête : durée et présents */}
      <section
        className="rounded-3xl p-5 text-white shadow-lift"
        style={{
          background: ev.test
            ? 'linear-gradient(150deg,#3A4A63,#1E293B 55%,#0F172A)'
            : 'linear-gradient(150deg,#F97316,#DC2626 55%,#7F1D1D)',
        }}
      >
        <p className="eyebrow text-white/80">
          {ev.test ? '🧪 Exercice' : '🚨 Évacuation réelle'}
          {ev.lance_par ? ` · lancé par ${ev.lance_par}` : ''}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-white/75">Durée totale</p>
            <p className="font-display text-[28px] leading-none font-extrabold whitespace-nowrap">
              {dureeLisible(b.duree)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-white/75">Présents</p>
            <p className="font-display text-[28px] leading-none font-extrabold whitespace-nowrap">{b.total}</p>
          </div>
        </div>
      </section>

      {/* Indicateurs de rapidité */}
      <section className="grid grid-cols-2 gap-2.5">
        <Indicateur titre="1re arrivée" valeur={dureeLisible(b.premiere)} />
        <Indicateur titre="50 % arrivés en" valeur={dureeLisible(b.t50)} />
        <Indicateur titre="90 % arrivés en" valeur={dureeLisible(b.t90)} />
        <Indicateur titre="Dernière arrivée" valeur={dureeLisible(b.derniere)} />
        <Indicateur
          titre="Arrivés en moins de 3 min"
          valeur={`${b.avant3min} / ${b.total}`}
          sous={b.total ? `${Math.round((b.avant3min / b.total) * 100)} %` : undefined}
        />
        <Indicateur
          titre="Liste d’appel retrouvée"
          valeur={b.liste ? `${Math.round(b.liste.taux * 100)} %` : '—'}
          sous={b.liste ? `${b.liste.ensemble} / ${b.liste.effectif}` : 'non scannée'}
          couleur={b.liste ? (b.liste.taux >= 1 ? VERT : ROUGE) : undefined}
        />
      </section>

      {/* Courbe d'arrivée */}
      <section className="panel p-4">
        <p className="eyebrow mb-2">Rythme d’arrivée au point de rassemblement</p>
        <CourbeArrivee b={b} />
      </section>

      {/* Répartitions */}
      <section className="panel space-y-4 p-4">
        <Barres
          titre="Qui était présent"
          lignes={b.parStatut.map(([s, n]) => [s, n, BLEU])}
          total={b.total}
        />
        <Barres
          titre="Comment ils se sont déclarés"
          lignes={[
            ['Inscrits Team Ulysse', b.parMoyen.inscrit, VERT],
            ['Sans l’appli (QR)', b.parMoyen.qr, BLEU],
            ['Ajoutés à la main', b.parMoyen.manuel, ORANGE],
          ]}
          total={b.total}
        />
      </section>

      {/* Liste d'appel */}
      {b.liste && (
        <section className="panel space-y-3 p-4">
          <p className="eyebrow">Comparaison avec la liste d’appel</p>
          <div className="grid grid-cols-3 gap-2 text-center text-white">
            <Tuile n={b.liste.ensemble} texte="retrouvés" couleur={VERT} />
            <Tuile
              n={b.liste.manquants.length}
              texte="sur la liste seulement"
              couleur={b.liste.manquants.length ? ROUGE : '#94A3B8'}
            />
            <Tuile
              n={b.liste.horsListe.length}
              texte="dans l’appli seulement"
              couleur={b.liste.horsListe.length ? ROUGE : '#94A3B8'}
            />
          </div>
          {b.liste.manquants.length > 0 && (
            <ul className="space-y-1">
              {b.liste.manquants.map((n) => (
                <li
                  key={n}
                  className="rounded-xl px-3 py-1.5 text-sm font-bold text-white"
                  style={{ background: ROUGE }}
                >
                  {n}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Évolution par rapport à la fois précédente */}
      {avant && precedent?.evacuation && (
        <section className="panel p-4">
          <p className="eyebrow mb-1">Par rapport à l’exercice précédent</p>
          <p className="mb-3 text-xs text-muted">du {dateCourte(precedent.evacuation.debut)}</p>
          <div className="space-y-2">
            <Evolution
              titre="Durée totale"
              avant={avant.duree}
              apres={b.duree}
              plusPetitMieux
              duree
            />
            <Evolution
              titre="90 % arrivés en"
              avant={avant.t90}
              apres={b.t90}
              plusPetitMieux
              duree
            />
            <Evolution titre="Présents déclarés" avant={avant.total} apres={b.total} />
            <Evolution
              titre="Liste d’appel retrouvée (%)"
              avant={avant.liste ? Math.round(avant.liste.taux * 100) : null}
              apres={b.liste ? Math.round(b.liste.taux * 100) : null}
            />
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => void exporter()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1D7A4B] font-bold text-white"
      >
        <FileSpreadsheet size={18} /> Exporter le bilan en Excel
      </button>
    </div>
  );
}

function Indicateur({
  titre,
  valeur,
  sous,
  couleur,
}: {
  titre: string;
  valeur: string;
  sous?: string;
  couleur?: string;
}) {
  return (
    <div className="panel p-3.5">
      <p className="text-[11px] font-bold tracking-wide text-muted uppercase">{titre}</p>
      <p
        className="mt-1 font-display text-[22px] leading-tight font-extrabold"
        style={{ color: couleur ?? '#0B1A36' }}
      >
        {valeur}
      </p>
      {sous && <p className="text-xs text-muted">{sous}</p>}
    </div>
  );
}

function Tuile({ n, texte, couleur }: { n: number; texte: string; couleur: string }) {
  return (
    <div className="rounded-2xl p-2.5" style={{ background: couleur }}>
      <p className="font-display text-[26px] leading-none font-extrabold">{n}</p>
      <p className="mt-1 text-[11px] leading-tight font-semibold text-white/90">{texte}</p>
    </div>
  );
}

function Barres({
  titre,
  lignes,
  total,
}: {
  titre: string;
  lignes: [string, number, string][];
  total: number;
}) {
  return (
    <div>
      <p className="eyebrow mb-2">{titre}</p>
      <div className="space-y-2">
        {lignes.map(([nom, n, c]) => (
          <div key={nom} className="flex items-center gap-2 text-sm">
            <span className="w-36 shrink-0 truncate font-semibold text-navy-950">{nom}</span>
            <span className="h-3 flex-1 overflow-hidden rounded-full bg-canvas">
              <span
                className="block h-full rounded-full"
                style={{ width: `${total ? (n / total) * 100 : 0}%`, background: c }}
              />
            </span>
            <b className="w-14 text-right text-navy-950 tabular-nums">
              {n}{' '}
              <span className="text-xs font-semibold text-muted">
                {total ? `${Math.round((n / total) * 100)}%` : ''}
              </span>
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Courbe cumulée : nombre de présents déclarés minute après minute. */
function CourbeArrivee({ b }: { b: Bilan }) {
  const W = 320;
  const H = 150;
  const g = 30;
  const n = b.courbe.length - 1;
  const max = Math.max(1, b.total);
  const x = (m: number) => g + (m / Math.max(1, n)) * (W - g - 8);
  const y = (v: number) => H - 22 - (v / max) * (H - 36);
  const points = b.courbe.map((v, m) => `${x(m).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const repere = (s: number | null, nom: string, c: string) =>
    s === null ? null : (
      <g key={nom}>
        <line x1={x(s / 60)} x2={x(s / 60)} y1={14} y2={H - 22} stroke={c} strokeDasharray="4 3" />
        <text x={x(s / 60)} y={10} textAnchor="middle" fontSize="9" fontWeight="800" fill={c}>
          {nom}
        </text>
      </g>
    );
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Courbe d’arrivée des présents"
    >
      <line x1={g} x2={W - 8} y1={H - 22} y2={H - 22} stroke="#CBD5E1" />
      <line x1={g} x2={g} y1={12} y2={H - 22} stroke="#CBD5E1" />
      <text x={g - 4} y={y(max) + 3} textAnchor="end" fontSize="9" fill="#64748B">
        {max}
      </text>
      <text x={g - 4} y={H - 19} textAnchor="end" fontSize="9" fill="#64748B">
        0
      </text>
      {Array.from({ length: n + 1 }, (_, m) => m)
        .filter((m) => n <= 10 || m % Math.ceil(n / 8) === 0)
        .map((m) => (
          <text key={m} x={x(m)} y={H - 8} textAnchor="middle" fontSize="9" fill="#64748B">
            {m} min
          </text>
        ))}
      <polygon points={`${x(0)},${y(0)} ${points} ${x(n)},${y(0)}`} fill="#DC262622" />
      <polyline
        points={points}
        fill="none"
        stroke={ROUGE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {repere(b.t50, '50 %', BLEU)}
      {repere(b.t90, '90 %', VERT)}
    </svg>
  );
}

function Evolution({
  titre,
  avant,
  apres,
  plusPetitMieux,
  duree,
}: {
  titre: string;
  avant: number | null;
  apres: number | null;
  plusPetitMieux?: boolean;
  duree?: boolean;
}) {
  const f = (v: number | null) => (v === null ? '—' : duree ? dureeLisible(v) : String(v));
  const ecart = avant !== null && apres !== null ? apres - avant : null;
  const mieux = ecart === null || ecart === 0 ? null : plusPetitMieux ? ecart < 0 : ecart > 0;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm">
      <span className="flex-1 font-semibold text-navy-950">{titre}</span>
      <span className="text-muted">{f(avant)}</span>
      <span className="text-muted">→</span>
      <b className="text-navy-950">{f(apres)}</b>
      <span
        className={cx(
          'grid size-7 place-items-center rounded-full text-white',
          mieux === null ? 'bg-slate-400' : '',
        )}
        style={mieux === null ? undefined : { background: mieux ? VERT : ROUGE }}
      >
        {mieux === null ? (
          <Minus size={14} />
        ) : (ecart ?? 0) > 0 ? (
          <ArrowUpRight size={15} />
        ) : (
          <ArrowDownRight size={15} />
        )}
      </span>
    </div>
  );
}
