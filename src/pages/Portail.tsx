// Portail d'entrée (pour l'instant : Lucas, Vincent, administrateur) : on choisit son monde,
// Team Ulysse (cartes, défis) ou l'Espace Sécurité. Les urgences restent à un toucher.
import {
  Ambulance,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  DoorOpen,
  HeartPulse,
  Layers,
  MessagesSquare,
  PackageOpen,
  Phone,
  Siren,
  TriangleAlert,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { BanniereEvacuation } from '../components/BanniereEvacuation';
import { CardFace } from '../components/cards/GameCard';
import { CARDS } from '../content/cards';
import { useIdentite } from '../data/identite';

const BASE = import.meta.env.BASE_URL;

/** Les sous-rubriques apparaissent l'une après l'autre, en « pop », puis flottent doucement. */
function Puces({
  puces,
  delai,
  grille,
}: {
  puces: [LucideIcon, string, string][];
  delai: number;
  /** Deux colonnes (comme sur la maquette Team Ulysse). */
  grille?: boolean;
}) {
  return (
    <motion.span
      className={
        grille
          ? 'absolute bottom-4 left-4 grid w-[64%] grid-cols-2 gap-1.5'
          : 'absolute inset-x-4 bottom-4 flex flex-wrap gap-1.5'
      }
      initial="cache"
      animate="vu"
      variants={{ vu: { transition: { staggerChildren: 0.11, delayChildren: delai } } }}
    >
      {puces.map(([Icone, texte, couleur], i) => (
        <motion.span
          key={texte}
          variants={{
            cache: { opacity: 0, scale: 0.3, y: 10 },
            vu: {
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { type: 'spring', stiffness: 520, damping: 17 },
            },
          }}
          className="pt-flotte flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-[#0B1A36]/75 py-1 pr-2.5 pl-1 text-[12.5px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,.3)] backdrop-blur"
          style={{ animationDelay: `${i * 0.35}s` }}
        >
          <span
            className="grid size-6 place-items-center rounded-full bg-white"
            style={{ color: couleur }}
          >
            <Icone size={14} strokeWidth={2.6} />
          </span>
          {texte}
        </motion.span>
      ))}
    </motion.span>
  );
}

function Carte({
  to,
  image,
  imageClasse,
  fond,
  eyebrow,
  titre,
  texte,
  children,
  index,
}: {
  to: string;
  image: ReactNode;
  imageClasse?: string;
  fond: string;
  eyebrow: string;
  titre: ReactNode;
  texte: string;
  children: ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12 }}
    >
      <Link
        to={to}
        className={`relative mb-4 block aspect-[976/760] overflow-hidden rounded-[26px] border border-[#5AA2FF]/40 text-white shadow-lift transition-transform active:scale-[0.99] ${imageClasse ?? ''}`}
        style={{ background: fond }}
      >
        {image}
        {/* Dégradé sombre à gauche pour lire le texte, comme sur la maquette. */}
        <span
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(7,18,40,.92) 0%, rgba(7,18,40,.7) 32%, rgba(7,18,40,.15) 58%, transparent 75%)',
          }}
        />
        <span
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: 'linear-gradient(0deg, rgba(7,18,40,.75), transparent)' }}
        />
        <span className="relative block p-4 pr-16">
          <span className="block text-[12px] font-extrabold tracking-[0.12em] text-sun uppercase">
            {eyebrow}
          </span>
          <span className="mt-1 block font-display text-[30px] leading-[1.02] font-extrabold drop-shadow-[0_2px_8px_rgba(0,0,0,.5)]">
            {titre}
          </span>
          <span className="mt-1.5 block max-w-[56%] text-[13px] leading-snug text-white/90">
            {texte}
          </span>
        </span>
        <span className="absolute top-3.5 right-3.5 grid size-11 place-items-center rounded-full bg-white text-navy-950 shadow-[0_4px_12px_rgba(0,0,0,.3)]">
          <ArrowRight size={20} />
        </span>
        {children}
      </Link>
    </motion.div>
  );
}

/** Vraies cartes du jeu autour d'Ulysse : [id, centre x, centre y, largeur (px de l'image), rotation]. */
const CARTES_SCENE: [string, number, number, number, number][] = [
  ['sst', 760, 96, 118, -14],
  ['chaussures', 888, 300, 128, 12],
  ['extincteur-co2', 950, 585, 118, -8],
  ['evacuation', 262, 452, 104, -12],
];
const L_IMG = 976;
const H_IMG = 660;
const LARGEUR_CARTE = 132; // largeur de rendu d'une carte « sm », ensuite réduite

function CarteDuJeu({
  id,
  x,
  y,
  l,
  rot,
  echelle,
  flotte,
}: {
  id: string;
  x: number;
  y: number;
  l: number;
  rot: number;
  echelle: number;
  flotte?: boolean;
}) {
  const carte = CARDS.find((c) => c.id === id);
  if (!carte || !echelle) return null;
  const k = (l * echelle) / LARGEUR_CARTE;
  return (
    <span
      className={`absolute ${flotte ? 'pt-flotte' : ''}`}
      style={{ left: `${(x / L_IMG) * 100}%`, top: `${(y / H_IMG) * 100}%` }}
    >
      <span
        className="block"
        style={{
          width: LARGEUR_CARTE,
          height: (LARGEUR_CARTE * 7) / 5,
          transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${k})`,
          filter: flotte ? 'drop-shadow(0 0 10px rgba(90,162,255,.9)) blur(0.4px)' : undefined,
          opacity: flotte ? 0.92 : 1,
        }}
      >
        <CardFace card={carte} total={CARDS.length} size="sm" />
      </span>
    </span>
  );
}

/** Ulysse tient la vraie carte « Ulysse, gardien de la Team », entouré de vraies cartes du jeu. */
function SceneTeam() {
  const ref = useRef<HTMLSpanElement>(null);
  const [echelle, setEchelle] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setEchelle(el.clientWidth / L_IMG));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <span
      ref={ref}
      className="absolute top-0 left-1/2 h-full -translate-x-1/2"
      style={{ aspectRatio: `${L_IMG} / ${H_IMG}` }}
    >
      <img src={`${BASE}portail/team-carte.webp`} alt="" className="absolute inset-0 size-full" />
      {CARTES_SCENE.map(([id, x, y, l, rot]) => (
        <CarteDuJeu key={id} id={id} x={x} y={y} l={l} rot={rot} echelle={echelle} flotte />
      ))}
      <CarteDuJeu id="ulysse" x={742} y={250} l={150} rot={13} echelle={echelle} />
      {/* Les doigts d'Ulysse passent devant la carte : il la tient vraiment. */}
      <img
        src={`${BASE}portail/main-carte.webp`}
        alt=""
        className="absolute"
        style={{
          left: `${(570 / L_IMG) * 100}%`,
          top: `${(300 / H_IMG) * 100}%`,
          width: `${(190 / L_IMG) * 100}%`,
        }}
      />
    </span>
  );
}

export function Portail() {
  const { identite } = useIdentite();
  return (
    <div className="min-h-dvh bg-[#F4F6FA]">
      <BanniereEvacuation />
      <div className="mx-auto max-w-md px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
        <header className="mb-4 flex items-center gap-3">
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

        <Carte
          index={0}
          to="/"
          fond="#0B1F4A"
          eyebrow="Team Ulysse"
          titre={
            <>
              Cartes
              <br />
              &amp; défis
            </>
          }
          texte="Ta collection, tes packs, le calendrier et la coalition."
          image={<SceneTeam />}
        >
          <Puces
            grille
            delai={0.35}
            puces={[
              [PackageOpen, 'Packs', '#1F5AA6'],
              [Layers, 'Collection', '#1F5AA6'],
              [CalendarDays, 'Calendrier', '#C8283A'],
              [Users, 'Coalition', '#138A55'],
            ]}
          />
        </Carte>

        <Carte
          index={1}
          to="/securite"
          fond="#0B1F4A"
          eyebrow="IMECA · Sécurité"
          titre={
            <>
              Espace
              <br />
              Sécurité
            </>
          }
          texte="Tous les outils sécurité réunis dans un seul espace."
          image={
            <>
              <img
                src={`${BASE}portail/securite.webp`}
                alt=""
                className="absolute inset-y-0 right-0 h-full w-[62%] object-cover"
                style={{
                  objectPosition: '45% 30%',
                  maskImage: 'linear-gradient(90deg, transparent 0%, #000 30%)',
                  WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 30%)',
                }}
              />
              {/* Massage cardiaque : appuis au rythme de 110 par minute. */}
              <span className="absolute top-[60%] left-[64%] flex flex-col items-center">
                <span className="pt-appui block h-0 w-0 border-x-[9px] border-t-[9px] border-x-transparent border-t-white" />
                <span className="pt-appui mt-0.5 block h-0 w-0 border-x-[9px] border-t-[9px] border-x-transparent border-t-white [animation-delay:.08s]" />
              </span>
            </>
          }
        >
          <Puces
            delai={0.6}
            puces={[
              [Ambulance, 'Accident', '#C8283A'],
              [HeartPulse, 'SST', '#138A55'],
              [TriangleAlert, 'Remontée', '#D97706'],
              [MessagesSquare, 'EPS', '#14918B'],
              [DoorOpen, 'Évacuation', '#E2471F'],
              [ClipboardCheck, 'Visite', '#A16207'],
            ]}
          />
        </Carte>

        <div className="flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-[#E11D2E] to-[#B91C1C] p-2.5 pl-3 shadow-lift">
          <Siren size={26} className="shrink-0 text-white" />
          <span className="min-w-0 flex-1 leading-tight text-white">
            <b className="block font-display text-[16px] whitespace-nowrap">URGENCE&nbsp;?</b>
            <span className="text-[10.5px] text-white/85">Accident, malaise</span>
          </span>
          {(
            [
              ['15', 'SAMU', Phone],
              ['18', 'Pompiers', Truck],
              ['112', 'Europe', Phone],
            ] as const
          ).map(([n, nom, Icone]) => (
            <a
              key={n}
              href={`tel:${n}`}
              className="flex flex-col items-center rounded-xl border border-white/25 bg-white/10 px-1.5 py-1 text-white"
            >
              <span className="flex items-center gap-1 font-display text-[17px] leading-none font-extrabold">
                <Icone size={13} /> {n}
              </span>
              <span className="text-[9px] font-bold uppercase">{nom}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
