// Monde « Espace Sécurité » : en-tête sombre, bouton pour passer à Team Ulysse, et ses propres
// onglets en bas (Accueil, Urgences, Remontée, EPS, Évacuation).
// Réservé pour l'instant à Lucas, Vincent et l'administrateur.
import { House, MessagesSquare, Phone, ShieldAlert, TriangleAlert } from 'lucide-react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAccesSecurite } from '../../data/accesSecurite';
import { BanniereEvacuation } from '../BanniereEvacuation';
import { ChargementUlysse } from '../ui/vivant';
import { cx } from '../ui/primitives';

const BASE = import.meta.env.BASE_URL;

export function SecuriteShell() {
  const acces = useAccesSecurite();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (acces === false) return <Navigate to="/" replace />;

  const onglets = [
    {
      to: '/securite',
      label: 'Accueil',
      icon: House,
      actif:
        pathname === '/securite' ||
        pathname === '/remontees' ||
        pathname === '/securite/eps-recues' ||
        ['/securite/sst', '/securite/visites'].includes(pathname),
    },
    { to: '/securite/accident', label: 'Urgences', icon: Phone },
    { to: '/securite/remontee', label: 'Remontée', icon: TriangleAlert },
    { to: '/securite/eps', label: 'EPS', icon: MessagesSquare },
    {
      to: '/securite/evacuation',
      label: 'Évacuation',
      icon: ShieldAlert,
      actif: pathname === '/securite/evacuation' || pathname.startsWith('/securite/bilans'),
    },
  ];

  return (
    <div className="min-h-dvh bg-[#EEF1F6]">
      <header className="sticky top-0 z-30 bg-[#0F172A] pt-[env(safe-area-inset-top)] text-white">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4">
          <img
            src={`${BASE}securite/evacuation.webp`}
            alt=""
            className="size-10 shrink-0 rounded-full object-cover ring-2 ring-sun"
          />
          <p className="min-w-0 flex-1 font-display text-[17px] font-extrabold">Espace Sécurité</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex h-9 items-center gap-1.5 rounded-full bg-sun px-3 text-xs font-extrabold text-navy-950"
          >
            ⇄ Team Ulysse
          </button>
        </div>
        <div
          className="h-1.5"
          style={{
            background: 'repeating-linear-gradient(135deg,#F5C542 0 10px,#0F172A 10px 20px)',
          }}
        />
      </header>
      <BanniereEvacuation />

      <main className="mx-auto max-w-2xl px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {acces === null ? <ChargementUlysse texte="Ulysse ouvre l’espace Sécurité…" /> : <Outlet />}
      </main>

      <nav
        aria-label="Navigation Espace Sécurité"
        className="fixed inset-x-0 bottom-0 z-40 bg-[#0F172A] pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_18px_rgba(11,35,71,0.18)]"
      >
        <div className="mx-auto flex h-16 max-w-2xl items-stretch px-1">
          {onglets.map((o) => {
            const actif = o.actif ?? pathname.startsWith(o.to);
            return (
              <NavLink
                key={o.to}
                to={o.to}
                aria-current={actif ? 'page' : undefined}
                className={cx(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors',
                  actif ? 'font-extrabold text-white' : 'font-semibold text-[#94A3B8]',
                )}
              >
                <span
                  className={cx(
                    'grid h-8 w-12 place-items-center rounded-full transition-colors',
                    actif && 'bg-[#DC2626]',
                  )}
                >
                  <o.icon size={20} strokeWidth={actif ? 2.4 : 2} />
                </span>
                {o.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
