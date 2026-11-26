// Portail d'entrée (pour l'instant : Lucas, Vincent, administrateur) : on choisit son monde,
// Team Ulysse (cartes, défis) ou l'Espace Sécurité. Les urgences restent à un toucher.
import { ArrowRight, Siren } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { BanniereEvacuation } from '../components/BanniereEvacuation';
import { useIdentite } from '../data/identite';

const BASE = import.meta.env.BASE_URL;

function Puce({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/18 px-2.5 py-1 text-xs font-bold backdrop-blur">
      {children}
    </span>
  );
}

export function Portail() {
  const { identite } = useIdentite();
  return (
    <div className="min-h-dvh bg-[#F4F6FA]">
      <BanniereEvacuation />
      <div className="mx-auto max-w-md px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
        <header className="mb-5 flex items-center gap-3">
          <img
            src={`${BASE}ulysse-avatar.webp`}
            alt=""
            className="size-12 rounded-full bg-navy object-cover ring-2 ring-sun"
          />
          <div>
            <h1 className="font-display text-[24px] leading-tight font-extrabold text-navy-950">
              Bonjour {identite?.prenom ?? ''} 👋
            </h1>
            <p className="text-sm text-muted">Où veux-tu aller ?</p>
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            to="/"
            className="relative mb-4 block h-[300px] overflow-hidden rounded-[28px] p-5 text-white shadow-lift transition-transform active:scale-[0.99]"
            style={{ background: 'linear-gradient(140deg,#1F3F74,#12305E 55%,#0B1A36)' }}
          >
            <img
              src={`${BASE}mascotte.webp`}
              alt=""
              className="pointer-events-none absolute -right-3 -bottom-2 h-[220px] w-auto"
            />
            <p className="eyebrow text-white/80">Team Ulysse</p>
            <h2 className="mt-1 font-display text-[30px] leading-[1.05] font-extrabold">
              Cartes &amp;
              <br />
              défis
            </h2>
            <p className="mt-1.5 max-w-[58%] text-sm text-white/90">
              Ta collection, tes packs, le calendrier et la coalition.
            </p>
            <span className="absolute bottom-5 left-5 flex max-w-[62%] flex-wrap gap-1.5">
              <Puce>🃏 Packs</Puce>
              <Puce>📚 Collection</Puce>
              <Puce>🎄 Calendrier</Puce>
              <Puce>🤝 Coalition</Puce>
            </span>
            <span className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white text-navy-950">
              <ArrowRight size={19} />
            </span>
          </Link>

          <Link
            to="/securite"
            className="relative mb-4 block h-[300px] overflow-hidden rounded-[28px] p-5 text-white shadow-lift transition-transform active:scale-[0.99]"
            style={{ background: 'linear-gradient(150deg,#3A4A63,#1E293B 55%,#0F172A)' }}
          >
            <span
              className="absolute inset-x-0 top-0 h-1.5"
              style={{
                background: 'repeating-linear-gradient(135deg,#F5C542 0 12px,#0F172A 12px 24px)',
              }}
            />
            <img
              src={`${BASE}securite/evacuation-carte.webp`}
              alt=""
              className="pointer-events-none absolute -right-3 -bottom-2 h-[180px] w-auto"
            />
            <p className="eyebrow text-sun">IMECA · Sécurité</p>
            <h2 className="mt-1 font-display text-[30px] leading-[1.05] font-extrabold">
              Espace
              <br />
              Sécurité
            </h2>
            <p className="mt-1.5 max-w-[58%] text-sm text-white/90">
              Les bons réflexes, en un toucher.
            </p>
            <span className="absolute bottom-5 left-5 flex max-w-[58%] flex-wrap gap-1.5">
              <Puce>🚑 Accident</Puce>
              <Puce>➕ SST</Puce>
              <Puce>⚠️ Remontée</Puce>
              <Puce>🗣️ EPS</Puce>
              <Puce>🚨 Évacuation</Puce>
            </span>
            <span className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white text-navy-950">
              <ArrowRight size={19} />
            </span>
          </Link>
        </motion.div>

        <div className="flex items-center gap-2 rounded-[20px] bg-white p-3 shadow-soft">
          <Siren size={22} className="ml-1 shrink-0 text-[#DC2626]" />
          <b className="flex-1 font-display text-[15px] text-navy-950">Urgence ?</b>
          {['15', '18', '112'].map((n) => (
            <a
              key={n}
              href={`tel:${n}`}
              className="rounded-xl bg-[#DC2626] px-3 py-2 font-display text-[15px] font-extrabold text-white"
            >
              {n}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
