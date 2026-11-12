import { Bell, BellOff, BellRing, RefreshCw, CalendarDays, Layers, Share, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ApiError } from '../data/api';
import { disponibilite, rappelsStore, useRappels, type Choix } from '../data/rappels';
import { MASCOTTE_URL } from './cards/CardBack';
import { useToast } from './ui/overlay';
import { Button, cx } from './ui/primitives';

const HEURES = { pack: '8 h 30', avent: '7 h 30' };

function messageErreur(e: unknown) {
  if (e instanceof ApiError) return e.message;
  return 'Impossible d’activer les rappels sur ce téléphone.';
}

function Interrupteur({
  actif,
  onChange,
  label,
}: {
  actif: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={label}
      onClick={() => onChange(!actif)}
      className={cx(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
        actif ? 'bg-success' : 'bg-line',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 size-6 rounded-full bg-white shadow transition-all',
          actif ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  );
}

function LignesChoix({ choix, onChange }: { choix: Choix; onChange: (c: Choix) => void }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white text-left">
      <div className="flex items-center gap-3 p-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sun/20 text-navy-950">
          <Layers size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-extrabold text-navy-950">
            Pack du jour disponible
          </p>
          <p className="text-xs text-muted">Du lundi au vendredi, à {HEURES.pack}</p>
        </div>
        <Interrupteur
          label="Rappel du pack du jour"
          actif={choix.pack}
          onChange={(pack) => onChange({ ...choix, pack })}
        />
      </div>
      <div className="flex items-center gap-3 p-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/12 text-success">
          <CalendarDays size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-extrabold text-navy-950">Case du jour à ouvrir</p>
          <p className="text-xs text-muted">
            Calendrier de l’Avent, jours ouvrés, à {HEURES.avent}
          </p>
        </div>
        <Interrupteur
          label="Rappel de la case du calendrier"
          actif={choix.avent}
          onChange={(avent) => onChange({ ...choix, avent })}
        />
      </div>
    </div>
  );
}

/** Explication pour iPhone : les rappels n'existent que depuis l'icône de l'écran d'accueil. */
function AideEcranAccueil() {
  return (
    <div className="rounded-2xl bg-blue-light p-4 text-left text-sm text-navy">
      <p className="font-semibold">
        Sur iPhone, ajoute d’abord Team Ulysse à ton écran d’accueil :
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>
          Dans Safari, touche <Share size={14} className="inline align-[-2px]" /> <b>Partager</b>
        </li>
        <li>
          Choisis <b>« Sur l’écran d’accueil »</b>, puis <b>Ajouter</b>
        </li>
        <li>Ouvre Team Ulysse depuis sa nouvelle icône et reviens ici</li>
      </ol>
    </div>
  );
}

// ───────────── Proposition (menu d'accueil) ─────────────

/** Carte « Active les rappels » affichée sur le menu tant que la personne n'a pas choisi. */
export function PropositionRappels() {
  const etat = useRappels();
  const [ouvert, setOuvert] = useState(false);
  const dispo = disponibilite();
  if (etat.actifs || etat.ignore || dispo === 'impossible' || dispo === 'refusee') return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOuvert(true)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex w-full items-center gap-3 rounded-2xl border border-sun/50 bg-sun/15 p-3.5 text-left transition-colors hover:bg-sun/25"
      >
        <motion.span
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-sun text-navy-950"
          animate={{ rotate: [0, -14, 14, -8, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3 }}
        >
          <Bell size={20} />
        </motion.span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-extrabold text-navy-950">
            Je te préviens ?
          </span>
          <span className="block text-xs text-ink/70">
            Un rappel pour ne rater ni ton pack, ni la case du jour.
          </span>
        </span>
        <span className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white">
          Activer
        </span>
      </motion.button>
      <FeuilleRappels ouvert={ouvert} onClose={() => setOuvert(false)} />
    </>
  );
}

function FeuilleRappels({ ouvert, onClose }: { ouvert: boolean; onClose: () => void }) {
  const toast = useToast();
  const etat = useRappels();
  const [choix, setChoix] = useState<Choix>({ pack: etat.pack, avent: etat.avent });
  const [envoi, setEnvoi] = useState(false);
  const dispo = disponibilite();

  const activer = async () => {
    setEnvoi(true);
    try {
      await rappelsStore.activer(choix);
      toast('Rappels activés ! Ulysse te préviendra.', 'success');
      onClose();
    } catch (e) {
      toast(messageErreur(e), 'error');
    } finally {
      setEnvoi(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {ouvert && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-navy-950/55 p-3 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Activer les rappels"
        >
          <motion.div
            className="relative w-full max-w-md rounded-[28px] bg-white px-5 pb-5 pt-4 text-center shadow-lift"
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-muted hover:bg-line/60"
            >
              <X size={18} />
            </button>
            <img src={MASCOTTE_URL} alt="" className="mx-auto -mt-16 h-28 w-auto drop-shadow-lg" />
            <h2 className="mt-1 font-display text-xl font-extrabold text-navy-950">
              Je te préviens ?
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Ulysse t’envoie un petit rappel pour ne rater <b>ni ton pack, ni la case du jour</b>.
              Jamais le soir ni le week-end.
            </p>
            <div className="mt-4">
              {dispo === 'ecran-accueil' ? (
                <AideEcranAccueil />
              ) : (
                <LignesChoix choix={choix} onChange={setChoix} />
              )}
            </div>
            {dispo !== 'ecran-accueil' && (
              <Button
                variant="accent"
                size="lg"
                className="mt-4 h-12 w-full"
                onClick={activer}
                disabled={envoi || (!choix.pack && !choix.avent)}
              >
                <Bell size={18} /> {envoi ? 'Activation…' : 'Activer les rappels'}
              </Button>
            )}
            <button
              type="button"
              onClick={() => {
                rappelsStore.plusTard();
                onClose();
              }}
              className="mt-3 text-sm font-semibold text-muted hover:text-navy"
            >
              Plus tard
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ───────────── Réglages (page « Mes inscriptions ») ─────────────

export function ReglagesRappels() {
  const toast = useToast();
  const etat = useRappels();
  const [envoi, setEnvoi] = useState(false);
  const dispo = disponibilite();
  if (dispo === 'impossible') return null;

  const appliquer = async (action: () => Promise<void>, ok: string) => {
    setEnvoi(true);
    try {
      await action();
      toast(ok, 'success');
    } catch (e) {
      toast(messageErreur(e), 'error');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <section className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold text-navy-950">
        <Bell size={19} /> Mes rappels
      </h2>
      {dispo === 'ecran-accueil' ? (
        <AideEcranAccueil />
      ) : dispo === 'refusee' ? (
        <p className="panel p-4 text-sm text-muted">
          Les notifications sont bloquées pour Team Ulysse. Autorise-les dans les réglages du
          téléphone pour recevoir les rappels.
        </p>
      ) : etat.actifs ? (
        <div className={cx('space-y-3', envoi && 'pointer-events-none opacity-60')}>
          <LignesChoix
            choix={{ pack: etat.pack, avent: etat.avent }}
            onChange={(c) => appliquer(() => rappelsStore.modifier(c), 'Rappels mis à jour.')}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() =>
                appliquer(
                  () => rappelsStore.tester(),
                  'Notification de test envoyée : elle doit apparaître sur ce téléphone.',
                )
              }
            >
              <BellRing size={16} /> Tester sur ce téléphone
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() =>
                appliquer(() => rappelsStore.reparer(), 'Rappels réactivés sur ce téléphone.')
              }
            >
              <RefreshCw size={16} /> Réparer les rappels
            </Button>
          </div>
          <button
            type="button"
            onClick={() => appliquer(() => rappelsStore.desactiver(), 'Rappels désactivés.')}
            className="mx-auto flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-danger"
          >
            <BellOff size={15} /> Ne plus recevoir de rappels
          </button>
        </div>
      ) : (
        <div className="panel flex flex-col items-center gap-3 p-5 text-center">
          <p className="text-sm text-muted">
            Reçois un rappel quand ton <b>pack du jour</b> est disponible et quand la{' '}
            <b>case du calendrier</b> est à ouvrir.
          </p>
          <Button
            variant="accent"
            onClick={() =>
              appliquer(
                () => rappelsStore.activer({ pack: etat.pack, avent: etat.avent }),
                'Rappels activés ! Ulysse te préviendra.',
              )
            }
            disabled={envoi}
          >
            <Bell size={17} /> {envoi ? 'Activation…' : 'Activer les rappels'}
          </Button>
        </div>
      )}
    </section>
  );
}
