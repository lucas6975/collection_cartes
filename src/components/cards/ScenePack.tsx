// Scène « ouverture de pack » (carte « Cartes à collectionner » du menu) : Ulysse ouvre le vrai
// pack du jeu, de vraies cartes en sortent et il brandit la légendaire « Ulysse, gardien de la Team ».
// L'image de fond est une illustration ; le pack, les cartes et les mains sont posés par-dessus.
import { useEffect, useRef, useState } from 'react';
import { CARDS } from '../../content/cards';
import { CardFace } from './GameCard';
import { PackArt } from './Pack';

const BASE = import.meta.env.BASE_URL;

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
      src={`${BASE}${src}`}
      alt=""
      className="absolute"
      style={{ left: pc(x, L_IMG), top: pc(y, H_IMG), width: pc(l, L_IMG) }}
    />
  );
}

export function ScenePack({
  ouvert,
  decalage = '0%',
}: {
  ouvert?: boolean;
  /** Décale la scène vers la droite (laisse plus de place au texte à gauche). */
  decalage?: string;
}) {
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
      className="absolute inset-y-0 overflow-hidden"
      style={{
        right: `-${decalage}`,
        aspectRatio: `${L_IMG} / ${H_IMG}`,
        maskImage: 'linear-gradient(90deg, transparent 0%, #000 12%)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 12%)',
      }}
    >
      <img src={`${BASE}cartes-scene.webp`} alt="" className="absolute inset-0 size-full" />
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
            <PackArt opened={ouvert} />
          </span>
        </span>
      )}
      <Main src="cartes-main-gauche.webp" x={40} y={640} l={290} />
      <CarteDuJeu id="ulysse" x={565} y={195} l={245} rot={6} echelle={echelle} lueur />
      <Main src="cartes-main-droite.webp" x={630} y={100} l={170} />
    </span>
  );
}
