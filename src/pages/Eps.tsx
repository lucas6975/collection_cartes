// Échange Périodique de Sécurité (EPS), dans l'Espace Sécurité : les règles, le formulaire
// d'interview (formules du fichier Excel), la liste des EPS et les statistiques annuelles.
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeNiveau,
  Camembert,
  CourbeBradley,
  JaugeBradley,
  type Repere,
} from '../components/eps/Graphiques';
import { ChargementUlysse } from '../components/ui/vivant';
import { cx } from '../components/ui/primitives';
import { ApiError, api, type DonneesEps, type LigneEps, type ReponseEps } from '../data/api';
import { bravoStore } from '../data/bravo';
import { creerXlsx, proposerFichier } from '../data/excel';
import { useIdentite } from '../data/identite';
import { MOIS, feuillesEps, recapEps } from '../domain/epsRecap';
import {
  FREQUENCES,
  HISTORIQUE,
  LISTE_NIVEAUX,
  NIVEAUX,
  QUESTIONS,
  TYPES_REPONSE,
  blocageDeuxMois,
  clePersonne,
  dansDeuxMois,
  niveauGlobal,
  niveauQuestion,
  scoreEps,
  type Niveau,
} from '../domain/eps';

const BASE = import.meta.env.BASE_URL;
export const COULEUR_EPS = {
  fond: 'linear-gradient(150deg, #22B3A9 0%, #0F7F7A 50%, #08403E 100%)',
  vif: '#0F7F7A',
  doux: '#E7F6F4',
};

type Section = 'regles' | 'formulaire' | 'liste' | 'recap' | 'stats';
const SECTIONS: [Section, string][] = [
  ['regles', 'Règles'],
  ['formulaire', 'Formulaire'],
  ['liste', 'Liste'],
  ['recap', 'Récap'],
  ['stats', 'Stats'],
];

const virgule = (n: number, d = 2) => n.toFixed(d).replace('.', ',');
const dateFr = (iso: string) => {
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
};
const aujourdhui = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function OngletEps({ code, jeton }: { code: string | null; jeton: string | null }) {
  const [section, setSection] = useState<Section>('regles');
  const [donnees, setDonnees] = useState<DonneesEps | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setDonnees(await api.epsDonnees(jeton, code));
      setErreur(null);
    } catch (e) {
      setErreur(
        e instanceof ApiError
          ? `${e.message} (as-tu lancé supabase/maj-eps.sql ?)`
          : 'Erreur de chargement',
      );
    }
  }, [jeton, code]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, [charger]);

  const aller = (s: Section) => {
    setSection(s);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="space-y-4">
      <nav className="sticky top-2 z-10 grid grid-cols-5 gap-1 rounded-2xl bg-white/90 p-1 shadow-soft backdrop-blur">
        {SECTIONS.map(([id, nom]) => (
          <button
            key={id}
            type="button"
            onClick={() => aller(id)}
            className={cx(
              'h-10 rounded-xl text-[12.5px] font-extrabold transition-colors',
              section === id ? 'text-white' : 'text-muted',
            )}
            style={section === id ? { background: COULEUR_EPS.vif } : undefined}
          >
            {nom}
          </button>
        ))}
      </nav>

      {erreur && (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {erreur}
        </p>
      )}

      {section === 'regles' && <Regles onCommencer={() => aller('formulaire')} />}
      {section !== 'regles' && !donnees && !erreur && (
        <ChargementUlysse texte="Ulysse récupère les EPS…" />
      )}
      {section === 'formulaire' && donnees && (
        <Formulaire
          key={prefill ?? ''}
          donnees={donnees}
          prefill={prefill}
          code={code}
          jeton={jeton}
          onEnregistre={() => void charger()}
          onListe={() => aller('liste')}
        />
      )}
      {section === 'liste' && donnees && (
        <Liste
          donnees={donnees}
          code={code}
          jeton={jeton}
          onInterviewer={(nom) => {
            setPrefill(nom);
            aller('formulaire');
          }}
          onRecharger={() => void charger()}
        />
      )}
      {section === 'recap' && donnees && <Recap donnees={donnees} />}
      {section === 'stats' && donnees && <Stats donnees={donnees} />}
    </div>
  );
}

// ───────────── Règles (synthèse du support « Rappel EPS ») ─────────────

function Carte({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="panel p-4">
      <p className="mb-2 font-display text-lg font-extrabold text-navy-950">{titre}</p>
      <div className="space-y-1.5 text-[15px] text-navy-950">{children}</div>
    </section>
  );
}

function Regles({ onCommencer }: { onCommencer: () => void }) {
  return (
    <div className="space-y-4">
      <section
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lift"
        style={{ background: COULEUR_EPS.fond }}
      >
        <img
          src={`${BASE}mascotte.webp`}
          alt=""
          className="pointer-events-none absolute -right-3 -bottom-2 h-36 w-auto opacity-95"
        />
        <div className="relative max-w-[68%]">
          <p className="eyebrow text-white/80">🗣️ Échange Périodique de Sécurité</p>
          <h2 className="mt-1 font-display text-[26px] leading-tight font-extrabold">
            Un échange cadré, 5 questions
          </h2>
          <p className="mt-1.5 text-sm text-white/90">
            Pour situer la culture sécurité de chacun sur la courbe de Bradley.
          </p>
        </div>
        <span className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-extrabold text-navy-950">
          🎯 Objectif 2026 : 1 EPS par salarié
        </span>
      </section>

      <Carte titre="👥 Qui interroger ?">
        <p>
          <b>Toutes les personnes qui travaillent pour IMECA</b> : salariés, intérimaires,
          prestataires, alternants, stagiaires.
        </p>
        <p>
          ➜ De préférence <b>une personne d’un autre service</b> que le vôtre, et{' '}
          <b>sans lien hiérarchique</b>.
        </p>
        <p className="rounded-xl bg-[#E7F6F4] px-3 py-2 text-sm">
          💡 Le but : <b>oser questionner</b> quelqu’un avec qui vous n’avez pas l’habitude de
          travailler.
        </p>
        <p>
          🏗️ <b>Sur les chantiers</b> : le personnel IMECA et le personnel sous-traitant IMECA.
        </p>
        <p>
          🎥 Interview possible <b>en visio, caméras allumées</b> !
        </p>
        <p>
          ⏳ <b>Pas deux fois la même personne en moins de 2 mois</b> : l’appli vérifie toute seule.
        </p>
      </Carte>

      <Carte titre="📈 La courbe de Bradley">
        <p className="text-sm text-muted">
          Plus la culture sécurité progresse, plus le taux d’accident baisse.
        </p>
        <CourbeBradley />
        <ul className="space-y-2">
          {LISTE_NIVEAUX.map((n) => (
            <li key={n} className="flex gap-2.5">
              <span
                className="mt-1 size-3 shrink-0 rounded-full"
                style={{ background: NIVEAUX[n].couleur }}
              />
              <span className="text-sm">
                <b>{NIVEAUX[n].nom}</b> · {NIVEAUX[n].phrase}
              </span>
            </li>
          ))}
        </ul>
      </Carte>

      <Carte titre="🧮 Comment le niveau est calculé">
        <p className="text-sm">
          Pour chacune des 4 questions, on note <b>le type de réponse</b> (de « pas de souvenir » à
          « promouvoir une dynamique collective ») et <b>la fréquence</b> (de « plus d’un mois » à «
          aujourd’hui ou hier »). Le croisement donne un niveau de Bradley.
        </p>
        <p className="text-sm">
          La moyenne finale compte <b>davantage les questions 2 et 4</b> (×1,5) que les questions 1
          et 3 (×0,5) : ce que vous faites vous-même et l’implication du manager pèsent plus.
        </p>
      </Carte>

      <Carte titre="🚀 Comment progresser ?">
        <ul className="space-y-1.5 text-sm">
          <li>
            🗣️ <b>Vigilance partagée</b> : oser dire, savoir expliquer, accepter les remarques
          </li>
          <li>
            ⚠️ <b>Remonter</b> les presque accidents et situations dangereuses
          </li>
          <li>
            🦺 <b>Échanger</b> avec son correspondant sécurité et son manager (visites, quart
            d’heure sécurité)
          </li>
        </ul>
      </Carte>

      <button
        type="button"
        onClick={onCommencer}
        className="vi-elastique flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-extrabold text-white shadow-soft"
        style={{ background: COULEUR_EPS.fond }}
      >
        Commencer une EPS <ChevronRight size={20} />
      </button>
    </div>
  );
}

// ───────────── Formulaire d'interview ─────────────

const champ =
  'mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-[#0F7F7A] focus:ring-4 focus:ring-[#0F7F7A]/10';

const REPONSE_VIDE: ReponseEps = { type: 0, interaction: '', frequence: 0, resume: '' };

function Formulaire({
  donnees,
  prefill,
  code,
  jeton,
  onEnregistre,
  onListe,
}: {
  donnees: DonneesEps;
  prefill: string | null;
  code: string | null;
  jeton: string | null;
  onEnregistre: () => void;
  onListe: () => void;
}) {
  const { identite } = useIdentite();
  const [etape, setEtape] = useState(0);
  const [infos, setInfos] = useState({
    interviewe: prefill ?? '',
    interviewer: identite ? `${identite.prenom} ${identite.nom}` : '',
    date: aujourdhui(),
    service: '',
    secteur: '',
    correspondant: '',
    manager: '',
  });
  const [reponses, setReponses] = useState<ReponseEps[]>(() =>
    QUESTIONS.map(() => ({ ...REPONSE_VIDE })),
  );
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fini, setFini] = useState(false);

  const maj = (k: keyof typeof infos, v: string) => {
    setInfos((i) => {
      const suivant = { ...i, [k]: v };
      if (k === 'interviewe') {
        const fiche = donnees.annuaire.find((a) => a.nom === v);
        if (fiche?.service && !i.service) suivant.service = fiche.service;
      }
      return suivant;
    });
  };
  const majReponse = (i: number, r: Partial<ReponseEps>) =>
    setReponses((l) => l.map((x, k) => (k === i ? { ...x, ...r } : x)));

  const cle = clePersonne(infos.interviewe);
  const blocage = cle ? blocageDeuxMois(cle, infos.date, donnees.eps) : null;
  const niveaux = reponses.map((r) => niveauQuestion(r.type, r.frequence));
  const score = scoreEps(niveaux);
  const complet = niveaux.every((n) => n !== null);
  const infosOk = Boolean(
    infos.interviewe.trim() && infos.interviewer.trim() && infos.date && !blocage,
  );

  const enregistrer = async () => {
    if (!complet || score === null) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await api.epsEnregistrer(
        {
          ...infos,
          interviewe: infos.interviewe.trim(),
          cle,
          reponses,
          niveaux: niveaux as number[],
          score: Math.round(score * 1000) / 1000,
          niveau: niveauGlobal(score),
        },
        jeton,
        code,
      );
      setFini(true);
      bravoStore.montrer(
        'EPS enregistrée ! 🦺',
        `${infos.interviewe} · ${NIVEAUX[niveauGlobal(score)].nom}`,
      );
      onEnregistre();
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : 'L’envoi n’a pas marché, réessaie.');
    } finally {
      setEnvoi(false);
    }
  };

  const nbEtapes = QUESTIONS.length + 2;
  const suivant = () => {
    setEtape((e) => Math.min(nbEtapes - 1, e + 1));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const precedent = () => {
    setEtape((e) => Math.max(0, e - 1));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const managers = donnees.annuaire.filter((a) => a.manager);

  return (
    <div className="space-y-4">
      {/* Progression */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: nbEtapes }, (_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ background: i <= etape ? COULEUR_EPS.vif : '#DCE1EA' }}
          />
        ))}
      </div>

      <datalist id="eps-annuaire">
        {donnees.annuaire.map((a) => (
          <option key={a.nom} value={a.nom} />
        ))}
      </datalist>
      <datalist id="eps-managers">
        {managers.map((a) => (
          <option key={a.nom} value={a.nom} />
        ))}
      </datalist>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={etape}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="space-y-4"
        >
          {etape === 0 && (
            <section className="panel space-y-4 p-4">
              <p className="font-display text-xl font-extrabold text-navy-950">L’interview</p>
              <label className="block">
                <span className="eyebrow">Nom de l’interviewé(e) *</span>
                <input
                  list="eps-annuaire"
                  value={infos.interviewe}
                  onChange={(e) => maj('interviewe', e.target.value)}
                  placeholder="Tape un nom…"
                  className={champ}
                />
              </label>
              {cle &&
                (blocage ? (
                  <p className="rounded-xl bg-danger/10 px-3 py-2.5 text-sm font-semibold text-danger">
                    ⛔ Déjà interviewé(e) le {dateFr(blocage.date)} par {blocage.interviewer}.
                    <br />
                    Possible à nouveau à partir du {dateFr(dansDeuxMois(blocage.date))} : trouve une
                    autre personne.
                  </p>
                ) : (
                  <p className="rounded-xl bg-success/10 px-3 py-2.5 text-sm font-semibold text-success">
                    ✅ Pas d’EPS depuis plus de 2 mois : c’est parti !
                  </p>
                ))}
              <label className="block">
                <span className="eyebrow">Nom de l’interviewer *</span>
                <input
                  list="eps-annuaire"
                  value={infos.interviewer}
                  onChange={(e) => maj('interviewer', e.target.value)}
                  className={champ}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="eyebrow">Date *</span>
                  <input
                    type="date"
                    value={infos.date}
                    onChange={(e) => maj('date', e.target.value)}
                    className={champ}
                  />
                </label>
                <label className="block">
                  <span className="eyebrow">Service / atelier</span>
                  <input
                    value={infos.service}
                    onChange={(e) => maj('service', e.target.value)}
                    className={champ}
                  />
                </label>
              </div>
            </section>
          )}

          {etape >= 1 && etape <= QUESTIONS.length && (
            <EtapeQuestion
              i={etape - 1}
              reponse={reponses[etape - 1]}
              onReponse={(r) => majReponse(etape - 1, r)}
              qui={QUESTIONS[etape - 1].qui ? infos[QUESTIONS[etape - 1].qui!.champ] : ''}
              onQui={(v) => maj(QUESTIONS[etape - 1].qui!.champ, v)}
              niveaux={niveaux}
            />
          )}

          {etape === nbEtapes - 1 && (
            <Resultat interviewe={infos.interviewe} niveaux={niveaux} score={score} fini={fini} />
          )}
        </motion.div>
      </AnimatePresence>

      {erreur && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {erreur}
        </p>
      )}

      {/* Navigation */}
      {fini ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onListe}
            className="h-12 rounded-xl bg-white font-bold text-navy-950 shadow-soft"
          >
            Voir la liste
          </button>
          <button
            type="button"
            onClick={() => {
              setFini(false);
              setEtape(0);
              setReponses(QUESTIONS.map(() => ({ ...REPONSE_VIDE })));
              setInfos((i) => ({
                ...i,
                interviewe: '',
                service: '',
                secteur: '',
                correspondant: '',
                manager: '',
              }));
            }}
            className="h-12 rounded-xl font-bold text-white"
            style={{ background: COULEUR_EPS.vif }}
          >
            Nouvelle EPS
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          {etape > 0 && (
            <button
              type="button"
              onClick={precedent}
              aria-label="Précédent"
              className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-navy-950 shadow-soft"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {etape < nbEtapes - 1 ? (
            <button
              type="button"
              disabled={etape === 0 ? !infosOk : niveaux[etape - 1] === null}
              onClick={suivant}
              className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl font-extrabold text-white transition-opacity disabled:opacity-40"
              style={{ background: COULEUR_EPS.vif }}
            >
              {etape === QUESTIONS.length ? 'Voir le résultat' : 'Suivant'}{' '}
              <ChevronRight size={19} />
            </button>
          ) : (
            <button
              type="button"
              disabled={!complet || envoi}
              onClick={() => void enregistrer()}
              className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl font-extrabold text-white transition-opacity disabled:opacity-40"
              style={{ background: COULEUR_EPS.fond }}
            >
              <CheckCircle2 size={19} /> {envoi ? 'Enregistrement…' : 'Enregistrer l’EPS'}
            </button>
          )}
        </div>
      )}
      {etape === 0 && !infosOk && !blocage && (
        <p className="text-center text-xs text-muted">
          Interviewé(e), interviewer et date sont obligatoires.
        </p>
      )}
    </div>
  );
}

function Choix({
  actif,
  onClick,
  children,
  numero,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
  numero?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left text-[15px] font-semibold transition-colors',
        actif ? 'text-navy-950' : 'border-line bg-white text-muted',
      )}
      style={actif ? { borderColor: COULEUR_EPS.vif, background: COULEUR_EPS.doux } : undefined}
    >
      {numero !== undefined && (
        <span
          className={cx(
            'grid size-7 shrink-0 place-items-center rounded-full text-sm font-extrabold',
            actif ? 'text-white' : 'bg-canvas text-muted',
          )}
          style={actif ? { background: COULEUR_EPS.vif } : undefined}
        >
          {numero}
        </span>
      )}
      <span className="leading-snug">{children}</span>
    </button>
  );
}

function EtapeQuestion({
  i,
  reponse,
  onReponse,
  qui,
  onQui,
  niveaux,
}: {
  i: number;
  reponse: ReponseEps;
  onReponse: (r: Partial<ReponseEps>) => void;
  qui: string;
  onQui: (v: string) => void;
  niveaux: (Niveau | null)[];
}) {
  const q = QUESTIONS[i];
  const niveau = niveaux[i];
  const moyenne = scoreEps(niveaux.slice(0, i + 1));
  return (
    <>
      <section
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lift"
        style={{ background: COULEUR_EPS.fond }}
      >
        <p className="eyebrow text-white/80">
          Question {i + 1} / {QUESTIONS.length} · {q.court}
        </p>
        <p className="mt-2 font-display text-[19px] leading-snug font-extrabold">« {q.texte} »</p>
        <span className="mt-3 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
          Poids {virgule(q.poids, 1)} dans la moyenne
        </span>
      </section>

      {q.qui && (
        <section className="panel p-4">
          <label className="block">
            <span className="eyebrow">{q.qui.texte}</span>
            <input
              list={q.qui.champ === 'manager' ? 'eps-managers' : 'eps-annuaire'}
              value={qui}
              onChange={(e) => onQui(e.target.value)}
              placeholder="Nom…"
              className={champ}
            />
          </label>
        </section>
      )}

      <section className="panel p-4">
        <label className="block">
          <span className="eyebrow">1 · On détaille d’abord : résumé de l’échange</span>
          <textarea
            value={reponse.resume}
            onChange={(e) => onReponse({ resume: e.target.value })}
            rows={4}
            maxLength={800}
            placeholder="Ce que la personne raconte…"
            className="mt-1.5 w-full rounded-xl border border-line p-3 text-[15px] outline-none focus:border-[#0F7F7A] focus:ring-4 focus:ring-[#0F7F7A]/10"
          />
        </label>
      </section>

      <section className="panel space-y-2 p-4">
        <p className="eyebrow">2 · Puis on coche : type de réponse *</p>
        {TYPES_REPONSE.map((t, k) => (
          <Choix
            key={t}
            numero={k + 1}
            actif={reponse.type === k + 1}
            onClick={() => onReponse({ type: k + 1 })}
          >
            {t}
          </Choix>
        ))}
      </section>

      <section className={cx('panel space-y-2 p-4', reponse.type === 1 && 'opacity-50')}>
        <p className="eyebrow">
          3 · Fréquence de renforcement{' '}
          {reponse.type === 1 ? '(sans effet : pas de souvenir)' : '*'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {FREQUENCES.map((f, k) => (
            <Choix
              key={f}
              numero={k + 1}
              actif={reponse.frequence === k + 1}
              onClick={() => onReponse({ frequence: k + 1 })}
            >
              {f}
            </Choix>
          ))}
        </div>
      </section>

      {/* Résultat de la question + moyenne en cours */}
      <section className="panel space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-navy-950">Cette question</span>
          <BadgeNiveau niveau={niveau} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-navy-950">
            Moyenne en cours{' '}
            {moyenne !== null && <span className="text-muted">({virgule(moyenne)})</span>}
          </span>
          <BadgeNiveau niveau={moyenne !== null ? niveauGlobal(moyenne) : null} />
        </div>
        <JaugeBradley score={moyenne} />
        <div className="flex justify-between text-[10px] font-bold text-muted">
          {LISTE_NIVEAUX.map((n) => (
            <span key={n}>{NIVEAUX[n].nom}</span>
          ))}
        </div>
      </section>
    </>
  );
}

function Resultat({
  interviewe,
  niveaux,
  score,
  fini,
}: {
  interviewe: string;
  niveaux: (Niveau | null)[];
  score: number | null;
  fini: boolean;
}) {
  const global = score !== null ? niveauGlobal(score) : null;
  return (
    <>
      <section className="panel p-4 text-center">
        <p className="eyebrow">Culture sécurité de {interviewe || '…'}</p>
        <div className="mt-2 flex justify-center">
          <BadgeNiveau niveau={global} grand />
        </div>
        {score !== null && (
          <p className="mt-2 text-sm text-muted">
            Moyenne pondérée : <b className="text-navy-950">{virgule(score)} / 4</b>
          </p>
        )}
        {global && <p className="mt-1 text-sm text-navy-950">{NIVEAUX[global].phrase}</p>}
        {score !== null && <CourbeBradley reperes={[{ score, libelle: 'Résultat' }]} />}
        {fini && (
          <p className="mt-2 rounded-xl bg-success/10 px-3 py-2 text-sm font-bold text-success">
            ✅ EPS enregistrée
          </p>
        )}
      </section>
      <section className="panel divide-y divide-line p-4">
        {QUESTIONS.map((q, i) => (
          <div key={q.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-sm">
              <b className="text-navy-950">Q{i + 1}</b> · {q.court}{' '}
              <span className="text-muted">(×{virgule(q.poids, 1)})</span>
            </span>
            <BadgeNiveau niveau={niveaux[i]} />
          </div>
        ))}
      </section>
    </>
  );
}

// ───────────── Liste des EPS ─────────────

function Liste({
  donnees,
  code,
  jeton,
  onInterviewer,
  onRecharger,
}: {
  donnees: DonneesEps;
  code: string | null;
  jeton: string | null;
  onInterviewer: (nom: string) => void;
  onRecharger: () => void;
}) {
  const [recherche, setRecherche] = useState('');
  const [ouvert, setOuvert] = useState<string | null>(null);
  const aujourd = aujourdhui();
  const filtre = recherche.trim().toLowerCase();
  const liste = donnees.eps.filter(
    (e) =>
      !filtre ||
      [e.interviewe, e.interviewer, e.manager ?? ''].some((v) => v.toLowerCase().includes(filtre)),
  );

  const supprimer = async (e: LigneEps) => {
    if (!confirm(`Supprimer l’EPS de ${e.interviewe} du ${dateFr(e.date)} ?`)) return;
    try {
      await api.epsSupprimer(e.id, jeton, code);
      onRecharger();
    } catch {
      alert('La suppression n’a pas marché.');
    }
  };

  return (
    <div className="space-y-4">
      {donnees.volontaires.length > 0 && (
        <section className="panel p-4">
          <p className="eyebrow mb-2">🙋 Veulent être interviewé(e)s</p>
          <ul className="space-y-2">
            {donnees.volontaires.map((v) => (
              <li key={v} className="flex items-center gap-2">
                <span className="flex-1 font-semibold text-navy-950">{v}</span>
                <button
                  type="button"
                  onClick={() => onInterviewer(v)}
                  className="rounded-full px-3 py-1.5 text-xs font-extrabold text-white"
                  style={{ background: COULEUR_EPS.vif }}
                >
                  Interviewer
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <label className="relative block">
        <Search size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Chercher un nom, un interviewer, un manager…"
          className="h-12 w-full rounded-2xl border border-line bg-white pr-3 pl-10 text-[15px] shadow-soft outline-none"
        />
      </label>
      <p className="px-1 text-sm font-semibold text-muted">
        {liste.length} EPS {filtre ? 'trouvées' : 'au total'}
      </p>

      <ul className="space-y-2">
        {liste.map((e) => {
          const libre = dansDeuxMois(e.date);
          const bloque = libre > aujourd;
          const detail = ouvert === e.id;
          return (
            <li key={e.id} className="panel overflow-hidden">
              <button
                type="button"
                onClick={() => setOuvert(detail ? null : e.id)}
                className="flex w-full items-center gap-3 p-3.5 text-left"
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-2xl font-display text-sm font-extrabold text-white"
                  style={{
                    background: e.niveau ? NIVEAUX[e.niveau as Niveau].couleur : COULEUR_EPS.vif,
                  }}
                >
                  {dateFr(e.date).slice(0, 5)}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-navy-950">{e.interviewe}</b>
                  <span className="block truncate text-xs text-muted">
                    par {e.interviewer}
                    {e.manager ? ` · manager ${e.manager}` : ''}
                  </span>
                  <span
                    className={cx(
                      'mt-0.5 block text-[11px] font-bold',
                      bloque ? 'text-[#C2410C]' : 'text-success',
                    )}
                  >
                    {bloque
                      ? `⏳ Réinterview possible le ${dateFr(libre)}`
                      : '✅ Réinterview possible'}
                  </span>
                </span>
                {e.niveau ? <BadgeNiveau niveau={e.niveau as Niveau} /> : null}
              </button>
              {detail && (
                <div className="space-y-2 border-t border-line bg-canvas/50 p-3.5 text-sm">
                  <p>
                    📅 {dateFr(e.date)}
                    {e.service ? ` · ${e.service}` : ''}
                  </p>
                  {e.correspondant && <p>🦺 Correspondant sécurité : {e.correspondant}</p>}
                  {e.reponses ? (
                    <>
                      {QUESTIONS.map((q, i) => {
                        const r = e.reponses![i];
                        return (
                          <div key={q.id} className="rounded-xl bg-white p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <b className="text-navy-950">
                                Q{i + 1} · {q.court}
                              </b>
                              <BadgeNiveau niveau={(e.niveaux?.[i] ?? null) as Niveau | null} />
                            </div>
                            <p className="text-xs text-muted">
                              {TYPES_REPONSE[r.type - 1]} · {FREQUENCES[r.frequence - 1] ?? '—'}
                            </p>
                            {r.resume && <p className="mt-1 whitespace-pre-line">{r.resume}</p>}
                          </div>
                        );
                      })}
                      {e.score !== null && (
                        <p className="font-bold text-navy-950">
                          Moyenne : {virgule(Number(e.score))} / 4
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted">
                      Importée du fichier Excel : pas de détail des réponses.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void supprimer(e)}
                    className="mt-1 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-danger/30 bg-white text-sm font-bold text-danger"
                  >
                    <Trash2 size={16} /> Supprimer cette EPS
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ───────────── Statistiques ─────────────

const compteVide = (): Record<Niveau, number> => ({ 1: 0, 2: 0, 3: 0, 4: 0 });

function Stats({ donnees }: { donnees: DonneesEps }) {
  const annees = useMemo(() => {
    const s = new Set(donnees.eps.map((e) => Number(e.date.slice(0, 4))));
    s.add(new Date().getFullYear());
    return [...s].sort();
  }, [donnees.eps]);
  const [annee, setAnnee] = useState(annees[annees.length - 1]);

  const duAn = donnees.eps.filter((e) => e.date.startsWith(String(annee)));
  const personnes = new Set(duAn.map((e) => e.cle)).size;
  const taux = donnees.inscrits ? Math.round((personnes / donnees.inscrits) * 100) : 0;
  const detaillees = duAn.filter((e) => e.niveau && e.niveaux?.length === 4);

  const global = compteVide();
  const parQuestion = QUESTIONS.map(() => compteVide());
  for (const e of detaillees) {
    global[e.niveau as Niveau]++;
    e.niveaux!.forEach((n, i) => parQuestion[i][n as Niveau]++);
  }
  const moyenne = detaillees.length
    ? detaillees.reduce((s, e) => s + Number(e.score), 0) / detaillees.length
    : null;
  const moyQuestion = parQuestion.map((c) => {
    const n = LISTE_NIVEAUX.reduce((s, k) => s + c[k], 0);
    return n ? niveauGlobal(LISTE_NIVEAUX.reduce((s, k) => s + k * c[k], 0) / n) : null;
  });

  const historique = Object.entries(HISTORIQUE).filter(([a]) => Number(a) < annee);
  const reperes: Repere[] = historique.map(([a, h]) => {
    const tot = LISTE_NIVEAUX.reduce((s, k) => s + h.repartition[k], 0);
    return {
      score: LISTE_NIVEAUX.reduce((s, k) => s + k * h.repartition[k], 0) / tot,
      libelle: a,
      discret: true,
    };
  });
  if (moyenne !== null) reperes.push({ score: moyenne, libelle: String(annee) });

  const pct = (c: Record<Niveau, number>, n: Niveau) => {
    const tot = LISTE_NIVEAUX.reduce((s, k) => s + c[k], 0);
    return tot ? Math.round((c[n] / tot) * 100) : null;
  };
  const anneesBarres: {
    libelle: string;
    couleur: string;
    valeurs: Record<Niveau, number> | null;
  }[] = [
    ...historique.map(([a, h], k) => ({
      libelle: a,
      couleur: k === 0 ? '#AEB6C6' : '#5B6478',
      valeurs: h.repartition,
    })),
    {
      libelle: String(annee),
      couleur: COULEUR_EPS.vif,
      valeurs: detaillees.length ? global : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {annees.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAnnee(a)}
            className={cx(
              'h-10 shrink-0 rounded-full px-4 text-sm font-extrabold',
              a === annee ? 'text-white' : 'bg-white text-muted shadow-soft',
            )}
            style={a === annee ? { background: COULEUR_EPS.vif } : undefined}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Taux de réalisation */}
      <section className="panel p-4">
        <p className="eyebrow">Taux de réalisation {annee}</p>
        <div className="mt-1 flex items-end gap-3">
          <p className="font-display text-5xl font-extrabold text-navy-950">{taux} %</p>
          <p className="pb-1.5 text-sm text-muted">
            {personnes} personnes interviewées
            <br />
            sur {donnees.inscrits} inscrits à l’appli
          </p>
        </div>
        <p className="mt-1 text-xs text-muted">
          Objectif : 1 EPS par personne · {duAn.length} EPS réalisées
        </p>
        <div className="mt-3 space-y-2">
          {[
            ...historique.map(([a, h]) => ({ a, t: h.taux, c: '#AEB6C6' })),
            { a: String(annee), t: taux, c: COULEUR_EPS.vif },
          ].map(({ a, t, c }) => (
            <div key={a} className="flex items-center gap-2 text-sm">
              <span className="w-10 font-bold text-navy-950">{a}</span>
              <span className="h-3 flex-1 overflow-hidden rounded-full bg-canvas">
                <motion.span
                  className="block h-full rounded-full"
                  style={{ background: c }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, t)}%` }}
                  transition={{ duration: 0.7 }}
                />
              </span>
              <b className="w-12 text-right text-navy-950 tabular-nums">{t} %</b>
            </div>
          ))}
        </div>
      </section>

      {/* Courbe de Bradley avec l'étoile */}
      <section className="panel p-4">
        <p className="eyebrow">Où en est IMECA sur la courbe de Bradley ?</p>
        {moyenne !== null ? (
          <p className="mt-1 text-sm text-navy-950">
            Moyenne {annee} : <b>{virgule(moyenne)} / 4</b> →{' '}
            <BadgeNiveau niveau={niveauGlobal(moyenne)} />
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            L’étoile {annee} apparaîtra dès la première EPS faite dans l’appli.
          </p>
        )}
        <CourbeBradley reperes={reperes} />
        {reperes.some((r) => r.discret) && (
          <p className="text-[11px] text-muted">
            ○ Repères des années passées, estimés à partir des bilans EPS.
          </p>
        )}
      </section>

      {/* Camemberts */}
      {!detaillees.length && duAn.length > 0 && (
        <p className="rounded-2xl bg-[#E7F6F4] px-4 py-3 text-sm text-navy-950">
          ℹ️ Les {duAn.length} EPS de {annee} importées du fichier Excel n’ont pas le détail des
          réponses : les camemberts se rempliront avec les EPS faites dans l’appli.
        </p>
      )}
      <Camembert titre={`Culture sécurité globale ${annee}`} compte={global} />
      <div className="grid grid-cols-2 gap-3">
        {QUESTIONS.map((q, i) => (
          <Camembert key={q.id} titre={`Q${i + 1} · ${q.court}`} compte={parQuestion[i]} petit />
        ))}
      </div>

      {/* Évolution par catégorie */}
      <section className="panel p-4">
        <p className="eyebrow mb-3">Évolution par catégorie de Bradley</p>
        <div className="space-y-3">
          {LISTE_NIVEAUX.map((n) => (
            <div key={n}>
              <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-navy-950">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: NIVEAUX[n].couleur }}
                />
                {NIVEAUX[n].nom}
              </p>
              {anneesBarres.map((b) => {
                const v = b.valeurs ? pct(b.valeurs, n) : null;
                return (
                  <div key={b.libelle} className="flex items-center gap-2 text-xs">
                    <span className="w-9 text-muted">{b.libelle}</span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-canvas">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ background: b.couleur }}
                        initial={{ width: 0 }}
                        animate={{ width: `${v ?? 0}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </span>
                    <b className="w-9 text-right text-navy-950 tabular-nums">
                      {v === null ? '—' : `${v} %`}
                    </b>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Typologie par question */}
      <section className="panel overflow-x-auto p-4">
        <p className="eyebrow mb-2">Typologie de réponses par question</p>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-muted">
              <th className="py-1.5 pr-2 font-bold">Question</th>
              {anneesBarres.map((b) => (
                <th key={b.libelle} className="py-1.5 pr-2 font-bold">
                  {b.libelle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {QUESTIONS.map((q, i) => (
              <tr key={q.id}>
                <td className="py-2 pr-2 font-semibold text-navy-950">Q{i + 1}</td>
                {historique.map(([a, h]) => (
                  <td key={a} className="py-2 pr-2">
                    <BadgeNiveau niveau={h.questions[i]} court />
                  </td>
                ))}
                <td className="py-2 pr-2">
                  <BadgeNiveau niveau={moyQuestion[i]} court />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-xs text-muted">
        <Star size={12} /> Taux calculé sur le nombre d’inscrits à l’appli Team Ulysse
      </p>
    </div>
  );
}

// ───────────── Récap et extraction Excel ─────────────

function Recap({ donnees }: { donnees: DonneesEps }) {
  const annees = useMemo(() => {
    const s = new Set(donnees.eps.map((e) => Number(e.date.slice(0, 4))));
    s.add(new Date().getFullYear());
    return [...s].sort();
  }, [donnees.eps]);
  const [annee, setAnnee] = useState(annees[annees.length - 1]);
  const [export_, setExport] = useState<'pret' | 'encours' | 'fait'>('pret');
  const jour = aujourdhui();
  const r = recapEps(donnees.eps, annee, jour);
  const maxMois = Math.max(1, ...r.parMois);
  const taux = donnees.inscrits ? Math.round((r.personnes / donnees.inscrits) * 100) : 0;

  const extraire = async () => {
    setExport('encours');
    try {
      const fichier = creerXlsx(feuillesEps(donnees.eps, donnees.inscrits, annee, jour));
      await proposerFichier(fichier, `EPS-IMECA-${annee}-${jour}.xlsx`);
      setExport('fait');
    } catch {
      setExport('pret');
      alert('L’extraction n’a pas marché, réessaie.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Extraction Excel */}
      <section
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lift"
        style={{ background: 'linear-gradient(150deg, #2AA567 0%, #1D7A4B 55%, #0F4A2C 100%)' }}
      >
        <FileSpreadsheet className="absolute -right-4 -bottom-4 size-32 rotate-12 text-white/15" />
        <p className="eyebrow text-white/80">📥 Extraction Excel</p>
        <p className="mt-1 font-display text-[22px] leading-tight font-extrabold">
          Toutes les EPS dans un fichier Excel
        </p>
        <p className="mt-1.5 max-w-[85%] text-sm text-white/90">
          5 feuilles : liste des EPS, réponses détaillées, récap {annee}, interviewers et managers.
        </p>
        <button
          type="button"
          disabled={export_ === 'encours'}
          onClick={() => void extraire()}
          className="vi-elastique relative mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white font-extrabold text-[#1D7A4B] disabled:opacity-60"
        >
          <FileSpreadsheet size={19} />
          {export_ === 'encours'
            ? 'Préparation…'
            : export_ === 'fait'
              ? 'Extraire à nouveau'
              : 'Extraire en Excel'}
        </button>
        {export_ === 'fait' && (
          <p className="relative mt-2 text-center text-xs font-semibold text-white/90">
            ✅ Fichier prêt : enregistre-le ou envoie-le par mail.
          </p>
        )}
      </section>

      <div className="flex gap-2 overflow-x-auto">
        {annees.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAnnee(a)}
            className={cx(
              'h-10 shrink-0 rounded-full px-4 text-sm font-extrabold',
              a === annee ? 'text-white' : 'bg-white text-muted shadow-soft',
            )}
            style={a === annee ? { background: COULEUR_EPS.vif } : undefined}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-3 gap-2">
        {[
          [r.total, 'EPS réalisées'],
          [r.personnes, 'personnes'],
          [`${taux} %`, 'des inscrits'],
        ].map(([v, t]) => (
          <div key={t} className="panel p-3 text-center">
            <p className="font-display text-2xl font-extrabold text-navy-950">{v}</p>
            <p className="text-[11px] font-semibold text-muted">{t}</p>
          </div>
        ))}
      </div>
      <p className="px-1 text-xs text-muted">
        {r.excel} EPS reprises du fichier Excel · {r.appli} faites dans l’appli
      </p>

      {/* Par mois */}
      <section className="panel p-4">
        <p className="eyebrow mb-3">EPS par mois</p>
        <div className="flex h-32 items-end gap-1">
          {r.parMois.map((n, i) => (
            <div key={MOIS[i]} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-navy-950">{n || ''}</span>
              <motion.span
                className="w-full rounded-t-md"
                style={{ background: n ? COULEUR_EPS.vif : '#E3E7EE' }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(4, (n / maxMois) * 96)}px` }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
              />
              <span className="text-[9px] text-muted">{MOIS[i].slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </section>

      <Classement titre="🎤 Interviewers les plus actifs" lignes={r.interviewers} />
      <Classement titre="👔 Personnes interviewées par manager" lignes={r.managers} />

      {r.plusieurs.length > 0 && (
        <section className="panel p-4">
          <p className="eyebrow mb-2">🔁 Interviewé(e)s plusieurs fois en {annee}</p>
          <ul className="divide-y divide-line text-sm">
            {r.plusieurs.map((p) => (
              <li key={p.nom} className="flex items-center justify-between gap-2 py-2">
                <b className="text-navy-950">{p.nom}</b>
                <span className="text-right text-xs text-muted">
                  {p.dates.map(dateFr).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.enAttente.length > 0 && (
        <section className="panel p-4">
          <p className="eyebrow mb-2">⏳ Pas encore réinterviewables ({r.enAttente.length})</p>
          <ul className="divide-y divide-line text-sm">
            {r.enAttente.map((p) => (
              <li key={p.nom} className="flex items-center justify-between gap-2 py-2">
                <b className="text-navy-950">{p.nom}</b>
                <span className="text-xs font-semibold text-[#C2410C]">
                  à partir du {dateFr(p.libre)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.excel > 0 && (
        <p className="rounded-2xl bg-[#E7F6F4] px-4 py-3 text-sm text-navy-950">
          ℹ️ Les EPS reprises du fichier Excel contiennent la personne, la date, l’interviewer et le
          manager. Leurs réponses (et donc leur niveau de Bradley) n’étaient pas dans le fichier.
        </p>
      )}
    </div>
  );
}

function Classement({ titre, lignes }: { titre: string; lignes: { nom: string; n: number }[] }) {
  const [tout, setTout] = useState(false);
  const max = Math.max(1, ...lignes.map((l) => l.n));
  return (
    <section className="panel p-4">
      <p className="eyebrow mb-2">{titre}</p>
      <ul className="space-y-1.5">
        {(tout ? lignes : lignes.slice(0, 8)).map((l) => (
          <li key={l.nom} className="flex items-center gap-2 text-sm">
            <span className="w-36 shrink-0 truncate font-semibold text-navy-950">{l.nom}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-canvas">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(l.n / max) * 100}%`, background: COULEUR_EPS.vif }}
              />
            </span>
            <b className="w-6 text-right text-navy-950 tabular-nums">{l.n}</b>
          </li>
        ))}
      </ul>
      {lignes.length > 8 && (
        <button
          type="button"
          onClick={() => setTout(!tout)}
          className="mt-2 text-sm font-bold"
          style={{ color: COULEUR_EPS.vif }}
        >
          {tout ? 'Voir moins' : `Voir les ${lignes.length}`}
        </button>
      )}
    </section>
  );
}
