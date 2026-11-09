import {
  BarChart3,
  BookOpen,
  ClipboardList,
  GalleryVerticalEnd,
  House,
  Layers,
  LogOut,
  ShieldCheck,
  Swords,
  Trophy,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavLink, useLocation, useNavigate, useOutlet } from 'react-router';
import { backend, useSession } from '../../data/store';
import { niveauDepuisXp } from '../../domain/engine';
import { Logo } from '../cards/Rewards';
import { Avatar, ProgressBar, cx } from '../ui/primitives';

const PLAYER_NAV = [
  { to: '/', label: 'Accueil', icon: House, end: true },
  { to: '/collection', label: 'Ma collection', short: 'Collection', icon: GalleryVerticalEnd },
  { to: '/apprendre', label: 'Apprendre', icon: BookOpen },
  { to: '/defis', label: 'Défis', icon: Swords },
  { to: '/classement', label: 'Classement', icon: Trophy },
  { to: '/profil', label: 'Mon profil', short: 'Profil', icon: UserIcon },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Tableau de bord', short: 'Pilotage', icon: BarChart3, end: true },
  { to: '/admin/utilisateurs', label: 'Collaborateurs', short: 'Équipes', icon: Users },
  { to: '/admin/cartes', label: 'Cartes', icon: Layers },
  { to: '/admin/questions', label: 'Quiz et parcours', short: 'Quiz', icon: ClipboardList },
  { to: '/admin/validation', label: 'Validation', short: 'Valider', icon: ShieldCheck },
];

function NavItem({
  to,
  label,
  icon: I,
  end,
}: {
  to: string;
  label: string;
  short?: string;
  icon: typeof House;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          'group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors',
          isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active"
              className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-sun"
            />
          )}
          <I size={19} strokeWidth={isActive ? 2.2 : 1.8} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export function AppShell({ admin = false }: { admin?: boolean }) {
  const { user, progress } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  // On fige l'élément de route pour que la page sortante garde son contenu pendant la transition.
  const outlet = useOutlet();
  if (!user || !progress) return null;
  const lvl = niveauDepuisXp(progress.xp);
  const items = admin ? ADMIN_NAV : PLAYER_NAV;

  const logout = () => {
    backend.logout();
    navigate('/connexion');
  };

  return (
    <div className="min-h-dvh md:pl-[260px]">
      {/* ───── Barre latérale (ordinateur) ───── */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col bg-navy px-4 py-5 md:flex"
        style={{ background: 'linear-gradient(180deg, #153E75 0%, #102F5A 100%)' }}
      >
        <div className="flex items-center gap-2.5 px-2">
          <Logo size={34} />
          <div>
            <p className="font-display text-[17px] font-extrabold tracking-wide text-white">
              Vigie
            </p>
            <p className="text-[11px] text-white/55">
              {admin ? 'Espace administrateur' : 'Sécurité au travail'}
            </p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1" aria-label="Navigation principale">
          {items.map((i) => (
            <NavItem key={i.to} {...i} />
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          {user.role === 'admin' && (
            <NavLink
              to={admin ? '/' : '/admin'}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-medium text-white/85 hover:bg-white/5"
            >
              {admin ? <House size={16} /> : <ShieldCheck size={16} />}
              {admin ? 'Espace collaborateur' : 'Espace administrateur'}
            </NavLink>
          )}
          {!admin && (
            <NavLink
              to="/profil"
              className="block rounded-2xl bg-white/[0.06] p-3 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <Avatar user={user} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {user.prenom} {user.nom}
                  </p>
                  <p className="text-xs text-white/60">
                    Niveau {lvl.niveau} · {lvl.titre}
                  </p>
                </div>
              </div>
              <ProgressBar
                value={lvl.progression}
                tone="sun"
                height={5}
                className="mt-3 bg-white/10"
              />
            </NavLink>
          )}
          <button
            onClick={logout}
            className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm text-white/60 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* ───── En-tête (mobile) ───── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-display text-base font-extrabold text-navy">
            {admin ? 'Vigie Admin' : 'Vigie'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user.role === 'admin' && (
            <NavLink
              to={admin ? '/' : '/admin'}
              className="grid size-9 place-items-center rounded-full text-navy hover:bg-blue-light"
              aria-label={admin ? 'Espace collaborateur' : 'Espace administrateur'}
            >
              {admin ? <House size={18} /> : <ShieldCheck size={18} />}
            </NavLink>
          )}
          {!admin && (
            <span className="rounded-full bg-sun/20 px-2.5 py-1 text-xs font-bold text-navy">
              Niv. {lvl.niveau}
            </span>
          )}
          <NavLink to="/profil" aria-label="Mon profil">
            <Avatar user={user} size={32} />
          </NavLink>
          <button
            onClick={logout}
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-canvas"
            aria-label="Se déconnecter"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* ───── Contenu avec transition de page ───── */}
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-28 pt-5 sm:px-6 md:px-8 md:pb-12 md:pt-8 lg:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ───── Navigation basse (mobile) ───── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Navigation principale"
      >
        <div className="grid grid-cols-5">
          {(admin ? ADMIN_NAV : PLAYER_NAV.slice(0, 5)).map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) =>
                cx(
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-medium',
                  isActive ? 'text-navy' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="mnav-active"
                      className="absolute top-0 h-[3px] w-8 rounded-b-full bg-sun"
                    />
                  )}
                  <span
                    className={cx(
                      'grid h-7 w-12 place-items-center rounded-full transition-colors',
                      isActive && 'bg-blue-light',
                    )}
                  >
                    <i.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  {'short' in i && i.short ? i.short : i.label.split(' ')[0]}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
