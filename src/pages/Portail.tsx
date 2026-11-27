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
import { PackArt } from '../components/cards/Pack';
import { CARDS } from '../content/cards';
import { useIdentite } from '../data/identite';

const BASE = import.meta.env.BASE_URL;

/** Les sous-rubriques apparaissent l'une après l'autre, en « pop », puis flottent doucement. */
function Puces({
  puces,
  delai,
  colonne,
}: {
  puces: [LucideIcon, string, string][];
  delai: number;
  /** Une seule colonne à gauche (laisse la scène visible à droite). */
  colonne?: boolean;
}) {
  return (
    <motion.span
      className={
        colonne
          ? 'absolute bottom-4 left-4 flex flex-col items-start gap-1.5'
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
  degrade,
  children,
  index,
}: {
  to: string;
  image: ReactNode;
  imageClasse?: string;
  fond: string;
  eyebrow: string;
  titre: ReactNode;
  texte?: string;
  degrade?: string;
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
        className={`relative mb-4 block aspect-[976/840] overflow-hidden rounded-[26px] border border-[#5AA2FF]/40 text-white shadow-lift transition-transform active:scale-[0.99] ${imageClasse ?? ''}`}
        style={{ background: fond }}
      >
        {image}
        {/* Dégradé sombre à gauche pour lire le texte, comme sur la maquette. */}
        <span
          className="absolute inset-0"
          style={{
            background:
              degrade ??
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
          {texte && (
            <span className="mt-1.5 block max-w-[56%] text-[13px] leading-snug text-white/90">
              {texte}
            </span>
          )}
        </span>
        <span className="absolute top-3.5 right-3.5 grid size-11 place-items-center rounded-full bg-white text-navy-950 shadow-[0_4px_12px_rgba(0,0,0,.3)]">
          <ArrowRight size={20} />
        </span>
        {children}
      </Link>
    </motion.div>
  );
}

// Scène « ouverture de pack » (image 800 × 1024) : Ulysse ouvre un vrai pack du jeu, les vraies
// cartes en sortent et il brandit la carte légendaire « Ulysse, gardien de la Team ».
const L_IMG = 800;
const H_IMG = 1024;
const LARGEUR_CARTE = 132; // largeur de rendu d'une carte « sm », ensuite réduite
const LARGEUR_PACK = 300;
const pc = (v: number, total: number) => `${(v / total) * 100}%`;

/** Cartes qui jaillissent du pack (de l'arrière vers l'avant) : [id, x, y, largeur, rotation]. */
const CARTES_PACK: [string, number, number, number, number][] = [
  ['lsr-3-lototo', 575, 380, 92, 12],
  ['extincteur-co2', 275, 425, 128, -12],
  ['sst', 390, 398, 124, -2],
  ['circulation', 495, 447, 132, 6],
  ['pictogrammes-chimiques', 605, 474, 132, 16],
  ['casque', 330, 525, 110, -6],
  ['gants', 470, 548, 105, 4],
];

function CarteDuJeu({
  id,
  x,
  y,
  l,
  rot,
  echelle,
  lueur,
}: {
  id: string;
  x: number;
  y: number;
  l: number;
  rot: number;
  echelle: number;
  lueur?: boolean;
}) {
  const carte = CARDS.find((c) => c.id === id);
  if (!carte || !echelle) return null;
  const k = (l * echelle) / LARGEUR_CARTE;
  return (
    <span className="absolute" style={{ left: pc(x, L_IMG), top: pc(y, H_IMG) }}>
      <span
        className="block"
        style={{
          width: LARGEUR_CARTE,
          height: (LARGEUR_CARTE * 7) / 5,
          transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${k})`,
          filter: lueur ? 'drop-shadow(0 0 12px rgba(255,214,90,.85))' : undefined,
        }}
      >
        <CardFace card={carte} total={CARDS.length} size="sm" />
      </span>
    </span>
  );
}

/** Découpe d'une main d'Ulysse, posée devant le pack ou la carte : il les tient vraiment. */
function Main({ src, x, y, l }: { src: string; x: number; y: number; l: number }) {
  return (
    <img
      src={`${BASE}portail/${src}`}
      alt=""
      className="absolute"
      style={{ left: pc(x, L_IMG), top: pc(y, H_IMG), width: pc(l, L_IMG) }}
    />
  );
}

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
  const kPack = (405 * echelle) / LARGEUR_PACK;
  return (
    <span
      ref={ref}
      className="absolute inset-y-0 right-0 overflow-hidden"
      style={{
        aspectRatio: `${L_IMG} / ${H_IMG}`,
        maskImage: 'linear-gradient(90deg, transparent 0%, #000 12%)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 12%)',
      }}
    >
      <img src={`${BASE}portail/team.webp`} alt="" className="absolute inset-0 size-full" />
      {CARTES_PACK.map(([id, x, y, l, rot]) => (
        <CarteDuJeu key={id} id={id} x={x} y={y} l={l} rot={rot} echelle={echelle} lueur />
      ))}
      {/* Étincelles qui sortent du pack. */}
      {[
        [300, 330],
        [450, 300],
        [560, 330],
        [380, 470],
        [640, 420],
      ].map(([x, y], i) => (
        <span
          key={x}
          className="pt-etincelle absolute size-2 rounded-full bg-[#FFE7A0] shadow-[0_0_8px_3px_rgba(255,214,90,.8)]"
          style={{ left: pc(x, L_IMG), top: pc(y, H_IMG), animationDelay: `${i * 0.37}s` }}
        />
      ))}
      {/* Le vrai pack du jeu, ouvert (bord déchiré en haut). */}
      {echelle > 0 && (
        <span className="absolute" style={{ left: pc(410, L_IMG), top: pc(790, H_IMG) }}>
          <span
            className="block"
            style={{
              width: LARGEUR_PACK,
              transform: `translate(-50%, -50%) rotate(4deg) scale(${kPack})`,
              clipPath:
                'polygon(0% 4%, 6% 1%, 12% 4.5%, 19% 0.5%, 26% 4%, 33% 1.5%, 40% 5%, 47% 1%, 54% 4%, 61% 0.5%, 68% 4.5%, 75% 1%, 82% 4%, 89% 0.5%, 95% 4%, 100% 2%, 100% 100%, 0% 100%)',
            }}
          >
            <PackArt />
          </span>
        </span>
      )}
      <Main src="main-gauche.webp" x={40} y={640} l={290} />
      <CarteDuJeu id="ulysse" x={565} y={195} l={245} rot={6} echelle={echelle} lueur />
      <Main src="main-droite.webp" x={630} y={100} l={170} />
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
          image={<SceneTeam />}
          degrade="linear-gradient(90deg, rgba(7,18,40,.95) 0%, rgba(7,18,40,.8) 25%, rgba(7,18,40,.1) 40%, transparent 50%)"
        >
          <Puces
            colonne
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
