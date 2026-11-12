import { ArrowRight, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { MASCOTTE_URL } from '../components/cards/CardBack';
import { Button } from '../components/ui/primitives';
import { ApiError } from '../data/api';
import { identiteStore } from '../data/identite';
import { etapeRappels } from '../components/Rappels';

const champ =
  'h-12 w-full rounded-xl border border-line bg-white px-4 text-[16px] text-ink outline-none transition-shadow placeholder:text-muted/70 focus:border-blue focus:ring-4 focus:ring-blue/10';

/** Premier lancement : prénom et nom. Les jours du tirage au sort se choisissent dans le calendrier. */
export function Bienvenue() {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modeAdmin, setModeAdmin] = useState(false);
  const [code, setCode] = useState('');

  const valider = async (e: FormEvent) => {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim()) return setErreur('Indique ton prénom et ton nom.');
    setErreur(null);
    setEnvoi(true);
    try {
      // Juste après l'inscription, on propose les rappels avant d'arriver sur le menu.
      etapeRappels.demander();
      // Même hors ligne, l'inscription est gardée et sera envoyée plus tard.
      await identiteStore.enregistrer(prenom, nom, [], false);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Une erreur est survenue, réessaie.');
      setEnvoi(false);
    }
  };

  const validerAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      await identiteStore.devenirAdmin(code);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Code incorrect.');
      setEnvoi(false);
    }
  };

  return (
    <div
      className="min-h-dvh px-4 py-8 sm:py-12"
      style={{ background: 'linear-gradient(170deg, #2563A6 0%, #153E75 45%, #0B2347 100%)' }}
    >
      <div className="mx-auto max-w-md">
        <motion.div
          className="flex flex-col items-center text-center text-white"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.img
            src={MASCOTTE_URL}
            alt="Ulysse, la mascotte"
            className="h-40 w-auto drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 0.1 }}
          />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-sun">
            Bienvenue dans la
          </p>
          <h1 className="font-display text-4xl font-extrabold">Team Ulysse</h1>
          <p className="mt-1 font-display text-lg font-bold italic text-sun">
            La sécurité, notre Odyssée
          </p>
          <p className="mt-2 text-sm text-white/75">
            Dis-nous qui tu es pour participer aux jeux et aux tirages au sort.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {modeAdmin ? (
            <motion.form
              key="admin"
              onSubmit={validerAdmin}
              className="mt-6 space-y-4 rounded-3xl bg-white p-5 shadow-lift sm:p-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <p className="flex items-center gap-2 font-display text-lg font-extrabold text-navy-950">
                <ShieldCheck size={20} className="text-blue" /> Accès administrateur
              </p>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-navy-950">
                  Code administrateur
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={champ}
                  autoFocus
                />
              </label>
              {erreur && (
                <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                  {erreur}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                className="h-12 w-full"
                disabled={envoi || !code.trim()}
              >
                <KeyRound size={18} /> {envoi ? 'Vérification…' : 'Entrer'}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setModeAdmin(false);
                  setErreur(null);
                }}
                className="w-full text-center text-sm font-semibold text-muted hover:text-navy"
              >
                Retour
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="joueur"
              onSubmit={valider}
              className="mt-6 space-y-5 rounded-3xl bg-white p-5 shadow-lift sm:p-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-navy-950">Prénom</span>
                  <input
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    autoComplete="given-name"
                    maxLength={60}
                    className={champ}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-navy-950">Nom</span>
                  <input
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    autoComplete="family-name"
                    maxLength={60}
                    className={champ}
                  />
                </label>
              </div>

              {erreur && (
                <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                  {erreur}
                </p>
              )}

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="h-13 w-full text-base"
                disabled={envoi}
              >
                {envoi ? 'Inscription…' : 'C’est parti !'} <ArrowRight size={18} />
              </Button>

              <p className="flex items-start gap-2 text-xs text-muted">
                <Lock size={13} className="mt-0.5 shrink-0" />
                Ton nom sert uniquement à l’organisation des jeux et des tirages au sort de la Team
                Ulysse.
              </p>
            </motion.form>
          )}
        </AnimatePresence>

        {!modeAdmin && (
          <button
            type="button"
            onClick={() => {
              setModeAdmin(true);
              setErreur(null);
            }}
            className="mx-auto mt-5 flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white"
          >
            <ShieldCheck size={15} /> Je suis l’administrateur
          </button>
        )}
      </div>
    </div>
  );
}
