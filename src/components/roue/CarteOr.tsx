import { MASCOTTE_URL } from '../cards/CardBack';

const OR =
  'linear-gradient(150deg, #FFF3B0 0%, #F5C542 22%, #B7791F 48%, #FDE68A 70%, #C08A1E 100%)';

/** Carte collector « Ulysse en Or » : dorée, brillante, numérotée. Tailles en cqw. */
export function CarteOr({ numero }: { numero: number | null }) {
  return (
    <div
      className="relative aspect-[5/7] w-full [container-type:inline-size]"
      style={{ borderRadius: '8cqw', padding: '3.6cqw', background: OR }}
    >
      <div
        className="pointer-events-none absolute -inset-[3px] -z-10 animate-glow rounded-[inherit] opacity-80 blur-md"
        style={{ background: OR }}
      />
      <div
        className="relative flex size-full flex-col overflow-hidden"
        style={{
          borderRadius: '5.4cqw',
          background: 'radial-gradient(circle at 50% 38%, #4A3508 0%, #1C1303 70%)',
        }}
      >
        <span
          className="absolute left-1/2 top-[4cqw] z-10 -translate-x-1/2 whitespace-nowrap rounded-full font-display font-extrabold text-[#3B2A05]"
          style={{ background: OR, fontSize: '5.4cqw', padding: '1cqw 4cqw' }}
        >
          ✨ COLLECTOR
        </span>
        <div className="relative flex min-h-0 flex-1 items-end justify-center">
          <img
            src={MASCOTTE_URL}
            alt="Ulysse en Or"
            className="h-[88%] w-auto"
            style={{
              filter:
                'sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.08) drop-shadow(0 0 3cqw rgba(255,215,90,.85))',
            }}
          />
        </div>
        <div
          className="relative text-center font-display font-extrabold text-[#3B2A05]"
          style={{ background: OR, padding: '2.4cqw 2cqw', fontSize: '7cqw', lineHeight: 1.05 }}
        >
          Ulysse en Or
          <span className="block font-sans font-bold" style={{ fontSize: '4.6cqw' }}>
            {numero ? `n° ${String(numero).padStart(3, '0')}` : 'Roue de Secours'}
          </span>
        </div>
        <span
          className="pointer-events-none absolute inset-0 animate-pulse"
          style={{
            background:
              'linear-gradient(115deg, transparent 30%, rgba(255,240,180,.35) 45%, transparent 60%)',
          }}
        />
      </div>
    </div>
  );
}
