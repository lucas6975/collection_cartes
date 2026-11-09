import { ArrowRight, Info, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Navigate, useNavigate } from 'react-router';
import { GameCard } from '../components/cards/GameCard';
import { Logo } from '../components/cards/Rewards';
import { Avatar } from '../components/ui/primitives';
import { backend, useSession } from '../data/store';
import { DEMO_ADMIN_ID, DEMO_USER_ID } from '../data/seed';
import { niveauDepuisXp } from '../domain/engine';

const SHOWCASE = ['extincteur-co2', 'protection-collective', 'evacuation'];

export function Login() {
  const { db, user } = useSession();
  const navigate = useNavigate();
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;

  const total = db.catalog.cards.filter((c) => c.publie).length;
  const showcase = SHOWCASE.map((id) => db.catalog.cards.find((c) => c.id === id)).filter(
    (c) => !!c,
  );
  const featured = [DEMO_USER_ID, DEMO_ADMIN_ID]
    .map((id) => db.users.find((u) => u.id === id)!)
    .filter(Boolean);
  const others = db.users.filter((u) => u.actif && !featured.includes(u)).slice(0, 6);

  const login = (id: string) => {
    backend.login(id);
    const u = db.users.find((x) => x.id === id);
    navigate(u?.role === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Panneau de marque */}
      <section
        className="relative hidden overflow-hidden lg:block"
        style={{ background: 'linear-gradient(150deg, #2563A6 0%, #153E75 45%, #0B2347 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(#fff 1px, transparent 1.2px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="absolute -right-40 -top-40 size-[520px] rounded-full bg-sun/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <span className="font-display text-xl font-extrabold tracking-wide text-white">
              Vigie
            </span>
          </div>

          <div className="relative mx-auto h-[380px] w-full max-w-[520px]">
            {showcase.map((c, i) => (
              <motion.div
                key={c.id}
                className="absolute left-1/2 top-1/2"
                initial={{ opacity: 0, y: 60, rotate: 0, x: '-50%' }}
                animate={{
                  opacity: 1,
                  y: '-50%',
                  rotate: (i - 1) * 11,
                  x: `calc(-50% + ${(i - 1) * 150}px)`,
                }}
                transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 120, damping: 16 }}
                style={{ zIndex: i === 1 ? 2 : 1 }}
              >
                <GameCard
                  card={c}
                  total={total}
                  size="md"
                  tilt={false}
                  className={i === 1 ? 'scale-110' : ''}
                />
              </motion.div>
            ))}
          </div>

          <div>
            <h1 className="max-w-md text-4xl font-extrabold leading-[1.1] text-white">
              La sécurité au travail, <span className="text-sun">une carte à la fois.</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
              Relevez des défis, explorez des situations réelles et complétez votre collection en
              apprenant les règles qui protègent chaque jour.
            </p>
          </div>
        </div>
      </section>

      {/* Connexion */}
      <section className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={36} />
            <span className="font-display text-xl font-extrabold text-navy">Vigie</span>
          </div>
          <p className="eyebrow">Bienvenue</p>
          <h2 className="mt-2 text-3xl font-extrabold text-navy-950">Se connecter</h2>
          <p className="mt-2 text-[15px] text-muted">
            Choisissez un profil de démonstration pour découvrir la plateforme.
          </p>

          <div className="mt-8 space-y-3">
            {featured.map((u) => {
              const lvl = niveauDepuisXp(db.progress[u.id]?.xp ?? 0);
              return (
                <button
                  key={u.id}
                  onClick={() => login(u.id)}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-white p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue/40 hover:shadow-lift"
                >
                  <Avatar user={u} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy-950">
                      {u.prenom} {u.nom}
                    </p>
                    <p className="text-sm text-muted">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck size={14} className="text-blue" /> Responsable QSE ·
                          Administratrice
                        </span>
                      ) : (
                        `${u.service} · Niveau ${lvl.niveau}`
                      )}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-navy"
                  />
                </button>
              );
            })}
          </div>

          <p className="eyebrow mt-8">Autres collaborateurs</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {others.map((u) => (
              <button
                key={u.id}
                onClick={() => login(u.id)}
                className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm font-medium text-ink/80 hover:border-blue/40"
              >
                <Avatar user={u} size={26} />
                {u.prenom}
              </button>
            ))}
          </div>

          <div className="mt-10 flex gap-3 rounded-2xl bg-blue-light p-4 text-sm text-navy">
            <Info size={18} className="mt-0.5 shrink-0" />
            <p>
              <strong>Mode démonstration.</strong> Les données sont enregistrées dans ce navigateur.
              En production, la connexion passe par un compte sécurisé et la progression est
              sauvegardée sur le serveur.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
