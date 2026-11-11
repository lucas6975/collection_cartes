import { ArrowRight, Check, HandHeart, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError, api } from '../data/api';
import { useNombreVolontaires } from '../pages/CoalitionAdmin';
import { useIdentite } from '../data/identite';
import { MASCOTTE_URL } from './cards/CardBack';
import { Modal, useToast } from './ui/overlay';
import { Button } from './ui/primitives';

// Mémorise sur le téléphone que la personne a déjà rejoint la coalition.
const KEY = 'team-ulysse-coalition';

interface Etat {
  prenom: string;
}

function lire(): Etat | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Etat) : null;
  } catch {
    return null;
  }
}

let etat = lire();
const listeners = new Set<() => void>();
const store = {
  get: () => etat,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  set(e: Etat) {
    etat = e;
    try {
      localStorage.setItem(KEY, JSON.stringify(e));
    } catch {
      // Stockage indisponible : le choix vaut pour la visite.
    }
    listeners.forEach((l) => l());
  },
};

const champ =
  'h-12 w-full rounded-xl border border-line bg-white px-4 text-[16px] text-ink outline-none transition-shadow placeholder:text-muted/70 focus:border-blue focus:ring-4 focus:ring-blue/10';

/** Encadré du menu : « Rejoins la coalition Team Ulysse ». */
export function RejoindreCoalition() {
  const { identite, codeAdmin } = useIdentite();
  const rejoint = useSyncExternalStore(store.subscribe, store.get);
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [envoi, setEnvoi] = useState(false);

  // L'administrateur ne remplit rien : l'encadré ouvre directement la liste des volontaires.
  if (codeAdmin) return <CoalitionPourAdmin code={codeAdmin} />;

  const ouvrir = () => {
    setPrenom(identite?.prenom ?? '');
    setNom(identite?.nom ?? '');
    setOuvert(true);
  };

  const valider = async (e: FormEvent) => {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim()) return toast('Indique ton prénom et ton nom.', 'error');
    setEnvoi(true);
    try {
      await api.rejoindreCoalition(prenom, nom, identite?.jeton);
      store.set({ prenom: prenom.trim() });
      setOuvert(false);
      toast('Bienvenue dans la coalition Team Ulysse !', 'success');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erreur, réessaie.', 'error');
    } finally {
      setEnvoi(false);
    }
  };

  if (rejoint) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/[0.07] p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success text-white">
          <Check size={20} strokeWidth={3} />
        </span>
        <p className="text-sm text-navy-950">
          <b>Merci {rejoint.prenom} !</b> Tu fais partie des volontaires de la coalition Team
          Ulysse. On revient vers toi très vite.
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={ouvrir}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F7A4D] to-[#0E4D31] p-5 pr-28 text-left text-white shadow-lift transition-transform hover:-translate-y-0.5 sm:pr-40"
      >
        <div
          className="absolute inset-x-0 top-0 h-1.5"
          style={{
            background: 'repeating-linear-gradient(135deg, #F5C542 0 10px, #15171C 10px 20px)',
          }}
        />
        <div className="relative min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider">
            <Users size={12} /> On recrute
          </span>
          <p className="mt-2 font-display text-xl font-extrabold leading-tight sm:text-2xl">
            Rejoins la coalition Team Ulysse
          </p>
          <p className="mt-1 text-sm text-white/80">
            Envie de faire bouger la sécurité à IMECA ? Rejoins l’équipe qui prépare les jeux, les
            défis et les actions sécurité.
          </p>
          <span className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0E4D31] shadow-lg">
            <HandHeart size={16} /> Je veux en faire partie
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
        <img
          src={MASCOTTE_URL}
          alt=""
          className="pointer-events-none absolute -bottom-6 right-0 h-40 w-auto drop-shadow-[0_10px_16px_rgba(0,0,0,0.4)] sm:right-4 sm:h-48"
        />
      </motion.button>

      <Modal
        open={ouvert}
        onClose={() => setOuvert(false)}
        title="Rejoindre la coalition"
        size="sm"
      >
        <form onSubmit={valider} className="space-y-4 p-6">
          <p className="text-[15px] text-ink/85">
            Super ! Laisse ton nom : l’équipe de la coalition Team Ulysse reviendra vers toi.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-navy-950">Prénom</span>
            <input
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              autoComplete="given-name"
              className={champ}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-navy-950">Nom</span>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              autoComplete="family-name"
              className={champ}
            />
          </label>
          {identite && (
            <p className="text-xs text-muted">
              Rempli avec ton inscription. Tu peux le modifier si besoin.
            </p>
          )}
          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="h-12 w-full"
            disabled={envoi || !prenom.trim() || !nom.trim()}
          >
            <HandHeart size={18} /> {envoi ? 'Envoi…' : 'Je rejoins la coalition'}
          </Button>
        </form>
      </Modal>
    </>
  );
}

/** Version administrateur de l'encadré : accès direct à la liste des volontaires. */
function CoalitionPourAdmin({ code }: { code: string }) {
  const n = useNombreVolontaires(code);
  return (
    <Link
      to="/coalition"
      className="group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F7A4D] to-[#0E4D31] p-5 pr-28 text-left text-white shadow-lift transition-transform hover:-translate-y-0.5 sm:pr-40"
    >
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{
          background: 'repeating-linear-gradient(135deg, #F5C542 0 10px, #15171C 10px 20px)',
        }}
      />
      <div className="relative min-w-0">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider">
          <ShieldCheck size={12} /> Administrateur
        </span>
        <p className="mt-2 font-display text-xl font-extrabold leading-tight sm:text-2xl">
          Coalition Team Ulysse
        </p>
        <p className="mt-1 text-sm text-white/80">
          {n === null
            ? 'Les personnes qui veulent rejoindre la coalition.'
            : n === 0
              ? 'Personne ne s’est encore porté volontaire.'
              : `${n} volontaire${n > 1 ? 's' : ''} pour rejoindre la coalition.`}
        </p>
        <span className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0E4D31] shadow-lg">
          <Users size={16} /> Voir les volontaires
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
      <img
        src={MASCOTTE_URL}
        alt=""
        className="pointer-events-none absolute -bottom-6 right-0 h-40 w-auto drop-shadow-[0_10px_16px_rgba(0,0,0,0.4)] sm:right-4 sm:h-48"
      />
    </Link>
  );
}
