import { ArrowLeft, ArrowRight, CalendarDays, Gift, Lock, RotateCcw, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/primitives';
import { Anomalies } from '../avent/jeux/Anomalies';
import { Association } from '../avent/jeux/Association';
import { Ordre } from '../avent/jeux/Ordre';
import { Memory } from '../avent/jeux/Memory';
import { MotsMeles } from '../avent/jeux/MotsMeles';
import { Pendu } from '../avent/jeux/Pendu';
import { Quiz } from '../avent/jeux/Quiz';
import { Erreur, Intrus, Scenes } from '../avent/jeux/Series';
import { Tri } from '../avent/jeux/Tri';
import { VraiFaux } from '../avent/jeux/VraiFaux';
import { ANNEE_AVENT, JOURS, caseOuverte } from '../avent/jours';
import { dateOuverture, etoilesJour } from '../avent/logic';
import { aventStore, useAvent } from '../avent/progress';
import { useIdentite } from '../data/identite';
import type { Jeu, ResultatJeu } from '../avent/types';
import { Confetti, Etoiles, NOEL, Neige } from '../avent/ui';

const NOM_JEU: Record<Jeu['type'], string> = {
  anomalies: 'Cherche et trouve',
  ordre: 'Remets dans l’ordre',
  quiz: 'Quiz',
  association: 'Associe',
  vraifaux: 'Vrai ou faux',
  pendu: 'Pendu',
  memory: 'Memory',
  intrus: 'Trouve l’intrus',
  motsmeles: 'Mots mêlés',
  scenes: 'Scènes chocs',
  tri: 'Le grand tri',
  erreur: 'Trouve l’erreur',
};

function RenduJeu({
  jeu,
  graine,
  onFini,
}: {
  jeu: Jeu;
  graine: number;
  onFini: (r: ResultatJeu) => void;
}) {
  switch (jeu.type) {
    case 'anomalies':
      return <Anomalies jeu={jeu} onFini={onFini} />;
    case 'ordre':
      return <Ordre jeu={jeu} graine={graine} onFini={onFini} />;
    case 'quiz':
      return <Quiz jeu={jeu} onFini={onFini} />;
    case 'association':
      return <Association jeu={jeu} graine={graine} onFini={onFini} />;
    case 'vraifaux':
      return <VraiFaux jeu={jeu} onFini={onFini} />;
    case 'pendu':
      return <Pendu jeu={jeu} graine={graine} onFini={onFini} />;
    case 'memory':
      return <Memory jeu={jeu} graine={graine} onFini={onFini} />;
    case 'intrus':
      return <Intrus jeu={jeu} onFini={onFini} />;
    case 'motsmeles':
      return <MotsMeles jeu={jeu} graine={graine} onFini={onFini} />;
    case 'scenes':
      return <Scenes jeu={jeu} onFini={onFini} />;
    case 'tri':
      return <Tri jeu={jeu} graine={graine} onFini={onFini} />;
    case 'erreur':
      return <Erreur jeu={jeu} onFini={onFini} />;
  }
}

/** En-tête de nuit enneigée commun aux pages du jour. */
function EnTeteJour({ jour, titre, lsr }: { jour: number; titre: string; lsr?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl px-5 pb-6 pt-5 text-white sm:px-8 sm:pb-8"
      style={{ background: `linear-gradient(160deg, #173A6B, ${NOEL.nuit})` }}
    >
      <Neige flocons={24} />
      <div className="relative flex items-start gap-4">
        <motion.div
          className="grid size-16 shrink-0 place-items-center rounded-2xl font-display text-3xl font-extrabold shadow-lg sm:size-20 sm:text-4xl"
          style={{
            background: jour % 3 === 0 ? NOEL.vert : jour % 3 === 1 ? NOEL.rouge : NOEL.kraft,
          }}
          initial={{ rotateY: -90 }}
          animate={{ rotateY: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        >
          {jour}
        </motion.div>
        <div className="min-w-0 pt-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sun">
            Jour {jour} · Calendrier de l’Avent
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            {titre}
          </h1>
          {lsr && <p className="mt-1 text-sm font-semibold text-white/75">{lsr}</p>}
        </div>
      </div>
    </div>
  );
}

export function AdventDay() {
  const { jour: param } = useParams();
  const navigate = useNavigate();
  const progression = useAvent();
  const { codeAdmin } = useIdentite();
  const jour = JOURS.find((j) => j.jour === Number(param));
  const [now] = useState(() => new Date());
  const [partie, setPartie] = useState(0);
  const [resultats, setResultats] = useState<(ResultatJeu | null)[]>(() =>
    jour ? jour.jeux.map(() => null) : [],
  );
  const [etape, setEtape] = useState(0);
  const [fete, setFete] = useState(false);

  if (!jour) return <p className="text-center text-muted">Ce jour n’existe pas.</p>;
  const ouverte = caseOuverte(jour, now, !!codeAdmin);
  const deja = progression[jour.jour];
  const retour = '/avent';

  if (!ouverte) {
    const d = dateOuverture(ANNEE_AVENT, jour.jour);
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <EnTeteJour jour={jour.jour} titre="Case encore fermée" />
        <div className="panel flex flex-col items-center p-8 text-center">
          <Lock size={36} className="text-navy/40" />
          <p className="mt-3 font-display text-xl font-extrabold text-navy-950">Patience !</p>
          <p className="mt-1 text-muted">
            Cette case s’ouvre le{' '}
            {d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}.
          </p>
          <Button className="mt-6" onClick={() => navigate(retour)}>
            <ArrowLeft size={17} /> Retour au calendrier
          </Button>
        </div>
      </div>
    );
  }

  if (jour.jeux.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <EnTeteJour jour={jour.jour} titre={jour.titre} />
        <div className="panel flex flex-col items-center p-8 text-center">
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
          >
            <Gift size={44} className="text-danger" />
          </motion.div>
          <p className="mt-4 font-display text-xl font-extrabold text-navy-950">
            Le défi de ce jour se prépare…
          </p>
          <p className="mt-1 max-w-sm text-muted">
            La Team Ulysse emballe encore cette surprise. Reviens bientôt !
          </p>
          <Button className="mt-6" onClick={() => navigate(retour)}>
            <ArrowLeft size={17} /> Retour au calendrier
          </Button>
        </div>
      </div>
    );
  }

  const jeu = jour.jeux[etape];
  const graine = jour.jour * 101 + partie * 13;
  const toutFini = resultats.every(Boolean);
  const total = etoilesJour(resultats.filter((r): r is ResultatJeu => !!r));

  const fini = (r: ResultatJeu) => {
    const next = resultats.map((x, i) => (i === etape ? (x && x.etoiles > r.etoiles ? x : r) : x));
    setResultats(next);
    if (next.every(Boolean)) {
      const res = next as ResultatJeu[];
      aventStore.terminer(jour.jour, {
        etoiles: etoilesJour(res),
        resultats: res,
        at: new Date().toISOString(),
      });
      if (etoilesJour(res) > 0) {
        setFete(true);
        setTimeout(() => setFete(false), 3800);
      }
    }
  };

  const rejouer = () => {
    setPartie((p) => p + 1);
    setResultats(jour.jeux.map(() => null));
    setEtape(0);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {fete && <Confetti />}
      <div className="flex items-center justify-between">
        <Link
          to={retour}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"
        >
          <ArrowLeft size={16} /> Calendrier
        </Link>
        {deja && (
          <span className="inline-flex items-center gap-2 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
            Meilleur score <Etoiles n={deja.etoiles} size={13} />
          </span>
        )}
      </div>

      <EnTeteJour jour={jour.jour} titre={jour.titre} lsr={jour.lsr} />

      {jour.jeux.length > 1 && (
        <div className="flex gap-2">
          {jour.jeux.map((j, i) => (
            <button
              key={i}
              type="button"
              onClick={() => (resultats[i] || i <= etape ? setEtape(i) : undefined)}
              className={`flex-1 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition-colors ${i === etape ? 'border-navy bg-white text-navy-950' : 'border-line bg-white/60 text-muted'}`}
            >
              <span className="block text-[11px] font-bold uppercase tracking-wider">
                {i === 0 ? 'Défi' : 'Bonus'}
              </span>
              {NOM_JEU[j.type]}{' '}
              {resultats[i] && (
                <Etoiles n={resultats[i]!.etoiles} size={12} clair className="ml-1 align-middle" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Contexte et consigne */}
      {jeu.type === 'ordre' ? (
        <div className="panel space-y-2 p-5">
          <p className="text-[15px] text-ink/85">
            <strong className="text-navy-950">Contexte : </strong>
            <em>{jeu.contexte}</em>
          </p>
          <p className="text-[15px] text-ink/85">
            <strong className="text-navy-950">Consigne : </strong>
            {jeu.consigne}
          </p>
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-blue-light px-4 py-3 text-[15px] font-medium text-navy">
          <Sparkles size={17} className="shrink-0 text-sun-dark" /> {jeu.consigne}
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.section
          key={`${etape}-${partie}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="panel p-4 sm:p-6"
        >
          <RenduJeu jeu={jeu} graine={graine} onFini={fini} />
        </motion.section>
      </AnimatePresence>

      {/* Passage au jeu bonus */}
      {resultats[etape] && etape < jour.jeux.length - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <Button variant="accent" size="lg" onClick={() => setEtape((e) => e + 1)}>
            Défi bonus : {NOM_JEU[jour.jeux[etape + 1].type]} <ArrowRight size={18} />
          </Button>
        </motion.div>
      )}

      {/* Bilan de la journée */}
      {toutFini && (
        <motion.section
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          className="relative overflow-hidden rounded-3xl p-6 text-center text-white"
          style={{ background: `linear-gradient(150deg, ${NOEL.rouge}, #8E1F2A)` }}
        >
          <Neige flocons={18} />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sun">
              Case du jour ouverte
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold">
              {total === 3
                ? 'Parfait !'
                : total === 2
                  ? 'Très bien !'
                  : total === 1
                    ? 'Bien joué !'
                    : 'Merci d’avoir joué !'}
            </p>
            <Etoiles n={total} size={38} animate className="mt-3" />
            <ul className="mt-3 space-y-0.5 text-sm text-white/85">
              {resultats.map(
                (r, i) =>
                  r && (
                    <li key={i}>
                      {jour.jeux.length > 1 ? `${NOM_JEU[jour.jeux[i].type]} : ` : ''}
                      {r.resume}
                    </li>
                  ),
              )}
            </ul>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                variant="ghost"
                onClick={rejouer}
                className="border border-white/30 text-white hover:bg-white/10"
              >
                <RotateCcw size={16} /> Rejouer
              </Button>
              <Button variant="accent" onClick={() => navigate(retour)}>
                <CalendarDays size={16} /> Retour au calendrier
              </Button>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
