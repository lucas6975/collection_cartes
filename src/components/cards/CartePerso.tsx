import { useIdentite } from '../../data/identite';
import { MASCOTTE_URL } from './CardBack';
import { Holo } from './Holo';

const ARC_EN_CIEL =
  'conic-gradient(from 200deg, #FFE58A, #FF8FB1, #9B8CFF, #6FE3FF, #8CFFB4, #FFE58A)';

/** Prénom et nom affichés sur la carte personnelle. */
export function useNomCartePerso() {
  const { identite, codeAdmin } = useIdentite();
  if (identite) return { prenom: identite.prenom, nom: identite.nom };
  return { prenom: codeAdmin ? 'Administrateur' : 'Membre', nom: 'Team Ulysse' };
}

const initiales = (prenom: string, nom: string) =>
  `${prenom.trim()[0] ?? ''}${nom.trim()[0] ?? ''}`.toUpperCase();

const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/**
 * Carte personnelle de membre de la Team Ulysse : créée avec le prénom et le nom saisis dans
 * l'appli, offerte une fois dans un pack. Elle ne fait pas partie des cartes à collectionner.
 * Toutes les tailles sont relatives à la largeur de la carte (unités cqw).
 */
export function CartePerso({ recueLe }: { recueLe: string }) {
  const { prenom, nom } = useNomCartePerso();
  return (
    <div
      className="relative aspect-[5/7] w-full [container-type:inline-size]"
      style={{ borderRadius: '8cqw', padding: '3.6cqw', background: ARC_EN_CIEL }}
    >
      <div
        className="pointer-events-none absolute -inset-[3px] -z-10 animate-glow rounded-[inherit] opacity-70 blur-md"
        style={{ background: ARC_EN_CIEL }}
      />
      <div
        className="relative flex size-full flex-col overflow-hidden bg-white text-navy-950"
        style={{ borderRadius: '5.4cqw' }}
      >
        <div
          className="flex items-center justify-between font-extrabold"
          style={{ padding: '3.4cqw 4.4cqw 2.4cqw', fontSize: '4.4cqw' }}
        >
          <span className="text-[#B07A0E]">🦺 Team Ulysse</span>
          <span className="text-[#97A3B5]">Membre</span>
        </div>
        <div
          className="relative flex flex-1 items-end justify-center overflow-hidden"
          style={{
            margin: '0 3.2cqw',
            borderRadius: '4.4cqw',
            background: 'radial-gradient(circle at 50% 35%, #2563A6, #0B2347 80%)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'repeating-conic-gradient(from 0deg at 50% 60%, rgba(245,197,66,.18) 0 8deg, transparent 8deg 20deg)',
            }}
          />
          <span
            className="absolute z-10 grid place-items-center rounded-full bg-[#C8283A] font-display font-extrabold text-white"
            style={{
              left: '4.8cqw',
              top: '4.8cqw',
              width: '25cqw',
              height: '25cqw',
              fontSize: '9.6cqw',
              boxShadow: '0 0 0 1.6cqw #fff',
            }}
          >
            {initiales(prenom, nom)}
          </span>
          <img
            src={MASCOTTE_URL}
            alt=""
            draggable={false}
            className="relative w-auto"
            style={{ height: '92%', marginRight: '-12cqw' }}
          />
        </div>
        <p
          className="truncate font-display font-extrabold leading-tight"
          style={{ fontSize: '8cqw', padding: '4cqw 4.8cqw 0' }}
        >
          {prenom} {nom}
        </p>
        <p
          className="font-extrabold text-[#B07A0E]"
          style={{ fontSize: '4.6cqw', padding: '1.2cqw 4.8cqw 0' }}
        >
          ★ Membre de la Team Ulysse
        </p>
        <p className="text-muted" style={{ fontSize: '4cqw', padding: '1.6cqw 4.8cqw 3cqw' }}>
          Arrivée dans la Team le <b className="text-navy-950">{dateCourte(recueLe)}</b>
        </p>
        <div
          className="flex justify-between border-t border-line font-extrabold uppercase"
          style={{ padding: '2.8cqw 4.4cqw 3.4cqw', fontSize: '3.8cqw', letterSpacing: '.08em' }}
        >
          <span className="bg-gradient-to-r from-[#C9871A] via-[#D9488B] to-[#6C5CE7] bg-clip-text text-transparent">
            Légendaire · unique
          </span>
          <span className="text-[#97A3B5]">Carte perso</span>
        </div>
        <Holo rarete="legendaire" />
      </div>
    </div>
  );
}
