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
import { useAvent } from '../../avent/progress';
import { useIdentite } from '../../data/identite';
import { useGame } from '../../data/store';
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

        {/* Navigation mobile, sous l'en-tête */}
        {section !== 'menu' && section !== 'compte' && (
          <nav className="grid grid-cols-3 gap-2 px-4 pb-3 sm:hidden" aria-label="Navigation">
            <NavLink
              to="/"
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-white text-sm font-bold text-navy"
            >
              <House size={16} /> Menu
            </NavLink>
            {section === 'cartes' ? (
              NAV_CARTES.map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  className={({ isActive }) =>
                    cx(
                      'flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-colors',
                      isActive
                        ? 'bg-sun text-navy-950 shadow-sm shadow-sun/30'
                        : 'border border-line bg-white text-navy',
                    )
                  }
                >
                  <i.icon size={16} />
                  {i.label === 'Ma collection' ? 'Collection' : 'Pack'}
                </NavLink>
              ))
            ) : (
              <NavLink
                to="/avent"
                end
                className={({ isActive }) =>
                  cx(
                    'col-span-2 flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold',
                    isActive ? 'bg-sun text-navy-950' : 'border border-line bg-white text-navy',
                  )
                }
              >
                <CalendarDays size={16} /> Calendrier
              </NavLink>
            )}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 md:pt-8">
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
    </div>
  );
}
