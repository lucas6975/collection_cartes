import { GalleryVerticalEnd, House, Layers } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavLink, useLocation, useOutlet } from 'react-router';
import { useGame } from '../../data/store';
import { cx } from '../ui/primitives';

const NAV = [
  { to: '/', label: 'Accueil', icon: House, end: true },
  { to: '/collection', label: 'Ma collection', icon: GalleryVerticalEnd, end: false },
];

export function AppShell() {
  const { progress, cards } = useGame();
  const location = useLocation();
  // On fige l'élément de route pour que la page sortante garde son contenu pendant la transition.
  const outlet = useOutlet();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-4 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL}ulysse-avatar.webp`}
              alt="Ulysse"
              width={42}
              height={42}
              className="size-[42px] rounded-full bg-navy object-cover ring-2 ring-sun"
            />
            <div className="leading-tight">
              <p className="font-display text-[17px] font-extrabold text-navy">Team Ulysse</p>
              <p className="hidden text-[11px] text-muted sm:block">Sécurité au travail</p>
            </div>
          </NavLink>

          <nav
            className="ml-auto hidden rounded-2xl bg-canvas p-1 sm:flex"
            aria-label="Navigation principale"
          >
            {NAV.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.end}
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

          <NavLink
            to="/collection"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-sun/20 px-3 py-1.5 text-sm font-bold text-navy-950 sm:ml-2"
            title="Cartes collectionnées"
          >
            <Layers size={15} />
            {progress.cards.length}/{cards.length}
          </NavLink>
        </div>

        {/* Onglets mobiles, sous l'en-tête */}
        <nav
          className="grid grid-cols-2 gap-2 px-4 pb-3 sm:hidden"
          aria-label="Navigation principale"
        >
          {NAV.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) =>
                cx(
                  'flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors',
                  isActive
                    ? 'bg-sun text-navy-950 shadow-sm shadow-sun/30'
                    : 'border border-line bg-white text-navy',
                )
              }
            >
              <i.icon size={17} />
              {i.label}
            </NavLink>
          ))}
        </nav>
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
