import {
  CalendarDays,
  GalleryVerticalEnd,
  Gift,
  House,
  Layers,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { NavLink, useLocation, useOutlet } from 'react-router';
import { ANNEE_AVENT, JOURS, caseOuverte } from '../../avent/jours';
import { caseDuJour } from '../../avent/logic';
import { useAvent } from '../../avent/progress';
import { useIdentite } from '../../data/identite';
import { useGame } from '../../data/store';
import { packDuJourOuvert } from '../../domain/packs';
import { Avatar, cx } from '../ui/primitives';

/** Onglets de la partie « cartes à collectionner ». */
const NAV_CARTES = [
  { to: '/cartes', label: 'Pack du jour', icon: Gift },
  { to: '/collection', label: 'Ma collection', icon: GalleryVerticalEnd },
];

export function AppShell() {
  const { progress, cards } = useGame();
  const avent = useAvent();
  const location = useLocation();
  // On fige l'élément de route pour que la page sortante garde son contenu pendant la transition.
  const outlet = useOutlet();
  const { identite, codeAdmin } = useIdentite();
  const chemin = location.pathname;
  const section = chemin.startsWith('/avent')
    ? 'avent'
    : chemin === '/'
      ? 'menu'
      : chemin === '/moi' || chemin === '/admin' || chemin === '/coalition'
        ? 'compte'
        : 'cartes';
  const etoiles = Object.values(avent).reduce((s, j) => s + j.etoiles, 0);

  // Chaque nouvelle page s'affiche depuis le haut.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-4 sm:px-6">
          <NavLink
            to="/"
            className="flex min-w-0 items-center gap-2.5"
            aria-label="Team Ulysse, retour au menu"
          >
            <img
              src={`${import.meta.env.BASE_URL}ulysse-avatar.webp`}
              alt=""
              width={42}
              height={42}
              className="size-[42px] shrink-0 rounded-full bg-navy object-cover ring-2 ring-sun"
            />
            <div className="min-w-0 leading-tight">
              <p className="font-display text-[17px] font-extrabold text-navy">Team Ulysse</p>
              <p className="hidden text-[11px] text-muted sm:block">
                {section === 'avent'
                  ? 'Calendrier de l’Avent'
                  : section === 'cartes'
                    ? 'Cartes à collectionner'
                    : 'La sécurité, notre Odyssée'}
              </p>
            </div>
          </NavLink>

          {section === 'cartes' && (
            <nav
              className="ml-auto hidden rounded-2xl bg-canvas p-1 sm:flex"
              aria-label="Cartes à collectionner"
            >
              {NAV_CARTES.map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  className={({ isActive }) =>
                    cx(
                      'relative flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors',
                      isActive ? 'text-navy-950' : 'text-muted hover:text-navy',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-xl bg-white shadow-soft"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <i.icon size={17} className="relative" />
                      <span className="relative">{i.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          )}

          <div
            className={cx(
              'flex items-center gap-2',
              section === 'cartes' ? 'ml-auto sm:ml-2' : 'ml-auto',
            )}
          >
            {section !== 'menu' && (
              <NavLink
                to="/"
                className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-navy hover:bg-canvas sm:inline-flex"
              >
                <House size={16} /> Menu
              </NavLink>
            )}
            {section === 'avent' ? (
              <NavLink
                to="/avent"
                className="inline-flex items-center gap-1.5 rounded-full bg-sun/20 px-3 py-1.5 text-sm font-bold text-navy-950"
                title="Étoiles gagnées dans le calendrier"
              >
                <Star size={15} className="fill-sun text-sun-dark" />
                {etoiles}
              </NavLink>
            ) : (
              <NavLink
                to="/collection"
                className="inline-flex items-center gap-1.5 rounded-full bg-sun/20 px-3 py-1.5 text-sm font-bold text-navy-950"
                title="Cartes collectionnées"
              >
                <Layers size={15} />
                {progress.cards.length}/{cards.length}
              </NavLink>
            )}
            {codeAdmin && (
              <NavLink
                to="/admin"
                className="inline-flex h-9 items-center gap-1 rounded-full bg-navy px-3 text-sm font-bold text-white"
                title="Espace administrateur"
              >
                <ShieldCheck size={15} /> <span className="hidden sm:inline">Admin</span>
              </NavLink>
            )}
            <NavLink
              to="/moi"
              aria-label="Mes inscriptions"
              title="Mes inscriptions"
              className="shrink-0"
            >
              {identite ? (
                <Avatar
                  user={{
                    id: identite.jeton ?? identite.nom,
                    prenom: identite.prenom,
                    nom: identite.nom,
                  }}
                  size={36}
                />
              ) : (
                <span className="grid size-9 place-items-center rounded-full bg-canvas text-navy">
                  <UserRound size={17} />
                </span>
              )}
            </NavLink>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-16 md:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      <BarreOnglets />
    </div>
  );
}

/** Onglets en bas de l'écran, sur téléphone (comme la plupart des applis). */
function BarreOnglets() {
  const { progress } = useGame();
  const avent = useAvent();
  const { codeAdmin } = useIdentite();
  const { pathname } = useLocation();
  const now = new Date();
  const packDispo = !packDuJourOuvert(progress, now);
  const jour = caseDuJour(ANNEE_AVENT, now);
  const caseDispo = (() => {
    const j = jour ? JOURS.find((x) => x.jour === jour) : undefined;
    return !!j && !avent[j.jour] && caseOuverte(j, now, !!codeAdmin);
  })();

  const onglets = [
    { to: '/', label: 'Accueil', icon: House, actif: pathname === '/' },
    {
      to: '/cartes',
      label: 'Pack',
      icon: Gift,
      actif: pathname === '/cartes',
      pastille: packDispo ? '1' : null,
    },
    {
      to: '/collection',
      label: 'Collection',
      icon: Layers,
      actif: pathname === '/collection' || pathname === '/echange',
    },
    {
      to: '/avent',
      label: 'Calendrier',
      icon: CalendarDays,
      actif: pathname.startsWith('/avent'),
      pastille: caseDispo ? '' : null,
    },
    {
      to: '/moi',
      label: 'Moi',
      icon: UserRound,
      actif: ['/moi', '/admin', '/coalition'].includes(pathname),
    },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_18px_rgba(11,35,71,0.06)] backdrop-blur-md sm:hidden"
    >
      <div className="flex h-16 items-stretch px-1">
        {onglets.map((o) => (
          <NavLink
            key={o.to}
            to={o.to}
            aria-current={o.actif ? 'page' : undefined}
            className={cx(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors',
              o.actif ? 'font-extrabold text-navy-950' : 'font-semibold text-[#7A889B]',
            )}
          >
            <span className="relative grid h-8 w-12 place-items-center">
              {o.actif && (
                <motion.span
                  layoutId="onglet-actif"
                  className="absolute inset-0 rounded-2xl bg-sun"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <o.icon size={22} strokeWidth={o.actif ? 2.3 : 1.9} className="relative" />
              {o.pastille != null && (
                <span
                  className={cx(
                    'absolute grid place-items-center rounded-full bg-danger font-extrabold text-white ring-2 ring-white',
                    o.pastille
                      ? 'right-1.5 top-0 h-4 min-w-4 px-1 text-[10px]'
                      : 'right-3 top-1 size-2.5',
                  )}
                  aria-label={o.label === 'Pack' ? 'Pack à ouvrir' : 'Case du jour à ouvrir'}
                >
                  {o.pastille}
                </span>
              )}
            </span>
            {o.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
