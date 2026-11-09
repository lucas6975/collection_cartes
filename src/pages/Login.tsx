import { ArrowRight, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { Navigate, useNavigate } from 'react-router';
import { CardBack } from '../components/cards/CardBack';
import { CardFace } from '../components/cards/GameCard';
import { Logo } from '../components/cards/Logo';
import { PackArt } from '../components/cards/Pack';
import { Avatar } from '../components/ui/primitives';
import { DEMO_USER_ID } from '../data/seed';
import { backend, useSession } from '../data/store';

export function Login() {
  const { db, user, cards } = useSession();
  const navigate = useNavigate();
  if (user) return <Navigate to="/" replace />;

  const demo = db.users.find((u) => u.id === DEMO_USER_ID)!;
  const others = db.users.filter((u) => u.actif && u.id !== DEMO_USER_ID).slice(0, 8);
  const vitrine = cards.find((c) => c.rarete === 'legendaire') ?? cards[0];

  const login = (id: string) => {
    backend.login(id);
    navigate('/');
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
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <span className="font-display text-xl font-extrabold tracking-wide text-white">
              Vigie
            </span>
          </div>

          <div className="relative mx-auto h-[400px] w-full max-w-[520px]">
            <motion.div
              className="absolute left-1/2 top-1/2 w-[180px]"
              initial={{ opacity: 0, x: '-50%', y: '-40%', rotate: 0 }}
              animate={{ opacity: 1, x: 'calc(-50% - 150px)', y: '-50%', rotate: -12 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 110, damping: 16 }}
            >
              <div className="aspect-[5/7]">
                <CardBack size="md" />
              </div>
            </motion.div>
            <motion.div
              className="absolute left-1/2 top-1/2 w-[180px]"
              initial={{ opacity: 0, x: '-50%', y: '-40%', rotate: 0 }}
              animate={{ opacity: 1, x: 'calc(-50% + 150px)', y: '-50%', rotate: 12 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 110, damping: 16 }}
            >
              <div className="aspect-[5/7]">
                <CardFace card={vitrine} total={cards.length} size="md" />
              </div>
            </motion.div>
            <motion.div
              className="absolute left-1/2 top-1/2 z-10 w-[220px]"
              initial={{ opacity: 0, x: '-50%', y: '-30%' }}
              animate={{ opacity: 1, x: '-50%', y: '-50%' }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 120, damping: 16 }}
            >
              <PackArt />
            </motion.div>
          </div>

          <div>
            <h1 className="max-w-md text-4xl font-extrabold leading-[1.1] text-white">
              Un pack par jour, <span className="text-sun">cinq règles de sécurité.</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
              Ouvrez votre pack chaque jour, découvrez des cartes plus ou moins rares et complétez
              la collection avec toute l’équipe.
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
          <p className="mt-2 text-[15px] text-muted">Choisissez un profil de démonstration.</p>

          <button
            onClick={() => login(demo.id)}
            className="group mt-8 flex w-full items-center gap-4 rounded-2xl border border-line bg-white p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue/40 hover:shadow-lift"
          >
            <Avatar user={demo} size={48} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy-950">
                {demo.prenom} {demo.nom}
              </p>
              <p className="text-sm text-muted">{demo.service} · son pack du jour l’attend</p>
            </div>
            <ArrowRight
              size={18}
              className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-navy"
            />
          </button>

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
              En production, la connexion passe par un compte sécurisé et le tirage des packs est
              fait sur le serveur.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
