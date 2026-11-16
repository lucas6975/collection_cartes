import { ArrowRight, Download, MoreVertical, Share, SquarePlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { MASCOTTE_URL } from '../components/cards/CardBack';
import { Button } from '../components/ui/primitives';
import { estIOS } from '../data/rappels';
import { noterVisite } from '../data/visites';

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

  // Compteur anonyme de l'espace admin : ce téléphone a ouvert le lien.
  useEffect(() => {
    void noterVisite('lien');
  }, []);

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
              titre={
                <>
                  <LogoApple /> Sur iPhone (Safari)
                </>
              }
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
              titre={
                <>
                  <LogoAndroid /> Sur Android (Chrome)
                </>
              }
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

/** Logo Apple (pomme), en noir. */
function LogoApple() {
  return (
    <svg viewBox="0 0 384 512" className="inline size-4 align-[-2px]" aria-hidden fill="#000">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

/** Robot Android, en vert. */
function LogoAndroid() {
  return (
    <svg viewBox="0 0 24 24" className="inline size-[18px] align-[-3px]" aria-hidden fill="#3DDC84">
      <path d="M17.6 9.48l1.84-3.18a.38.38 0 0 0-.65-.38l-1.86 3.22a11.4 11.4 0 0 0-9.86 0L5.21 5.92a.38.38 0 0 0-.65.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  );
}

function Etapes({ titre, etapes }: { titre: React.ReactNode; etapes: React.ReactNode[] }) {
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
