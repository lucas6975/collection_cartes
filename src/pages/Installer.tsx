import { ArrowRight, Download, MoreVertical, Share, SquarePlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { MASCOTTE_URL } from '../components/cards/CardBack';
import { Button } from '../components/ui/primitives';
import { estIOS } from '../data/rappels';

interface InvitationInstallation extends Event {
  prompt: () => Promise<void>;
}

const estAndroid = () => /Android/i.test(navigator.userAgent);

/**
 * Premier écran quand le site est ouvert dans le navigateur : on explique comment ajouter
 * Team Ulysse à l'écran d'accueil. L'inscription (prénom, nom) se fait ensuite dans l'appli
 * ouverte depuis son icône, qui garde ses propres données (surtout sur iPhone).
 */
export function Installer({ onContinuer }: { onContinuer: () => void }) {
  const [invitation, setInvitation] = useState<InvitationInstallation | null>(null);
  const ios = estIOS();
  const android = estAndroid();

  // Android (Chrome) : bouton d'installation directe quand le navigateur le propose.
  useEffect(() => {
    const garder = (e: Event) => {
      e.preventDefault();
      setInvitation(e as InvitationInstallation);
    };
    window.addEventListener('beforeinstallprompt', garder);
    return () => window.removeEventListener('beforeinstallprompt', garder);
  }, []);

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
            className="h-36 w-auto drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]"
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
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 rounded-3xl bg-white p-5 shadow-lift sm:p-6"
        >
          <p className="font-display text-xl font-extrabold leading-tight text-navy-950">
            📲 Installe d’abord l’appli sur ton téléphone
          </p>
          <p className="mt-1.5 text-sm text-muted">
            Pour jouer, ajoute Team Ulysse à ton <b className="text-navy-950">écran d’accueil</b>,
            puis ouvre-la depuis sa nouvelle icône. C’est là que tu t’inscris et que ta collection
            est gardée.
          </p>

          {invitation && (
            <Button
              variant="accent"
              size="lg"
              className="mt-4 h-13 w-full text-base"
              onClick={() => void invitation.prompt().then(() => setInvitation(null))}
            >
              <Download size={18} /> Installer Team Ulysse
            </Button>
          )}

          {(ios || !android) && (
            <Etapes
              titre="🍏 Sur iPhone (Safari)"
              etapes={[
                <>
                  Touche <Share size={16} className="inline align-[-3px] text-blue" />{' '}
                  <b>Partager</b> en bas de l’écran
                </>,
                <>
                  Fais défiler et touche{' '}
                  <SquarePlus size={16} className="inline align-[-3px] text-blue" />{' '}
                  <b>« Sur l’écran d’accueil »</b>
                </>,
                <>
                  Touche <b>Ajouter</b> en haut à droite
                </>,
              ]}
            />
          )}
          {(android || !ios) && (
            <Etapes
              titre="🤖 Sur Android (Chrome)"
              etapes={[
                <>
                  Touche <MoreVertical size={16} className="inline align-[-3px] text-blue" /> en
                  haut à droite
                </>,
                <>
                  Touche <b>« Ajouter à l’écran d’accueil »</b> ou <b>« Installer l’appli »</b>
                </>,
                <>
                  Confirme avec <b>Ajouter</b>
                </>,
              ]}
            />
          )}

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-sun/15 p-3 text-sm text-navy-950">
            <img
              src={`${import.meta.env.BASE_URL}apple-touch-icon.png`}
              alt=""
              className="size-11 shrink-0 rounded-xl shadow"
            />
            <p>
              Ensuite, ferme cette page et ouvre <b>Team Ulysse</b> depuis cette icône sur ton écran
              d’accueil.
            </p>
          </div>
        </motion.section>

        <button
          type="button"
          onClick={onContinuer}
          className="mx-auto mt-6 flex items-center gap-1.5 text-xs font-semibold text-white/55 hover:text-white"
        >
          Je suis sur ordinateur : continuer ici <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

function Etapes({ titre, etapes }: { titre: string; etapes: React.ReactNode[] }) {
  return (
    <div className="mt-4 rounded-2xl bg-blue-light p-4">
      <p className="font-display text-sm font-extrabold text-navy-950">{titre}</p>
      <ol className="mt-2 space-y-2">
        {etapes.map((e, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-ink/85">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">
              {i + 1}
            </span>
            <span className="pt-0.5">{e}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
