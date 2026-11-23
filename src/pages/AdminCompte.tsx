import { apercuCompte } from '../components/compte/CompteARebours';

/** Revoir l'animation du compte à rebours de n'importe quel jour (ce téléphone seulement). */
export function ApercuCompteARebours() {
  return (
    <section className="panel mb-5 p-4">
      <p className="font-display font-extrabold text-navy-950">⏳ Animation du compte à rebours</p>
      <p className="text-sm text-muted">
        Elle se joue toute seule chez tout le monde, une fois par jour, du 24 novembre (J-7) au 1er
        décembre (jour J). Ici, tu peux revoir chaque jour sur ton téléphone.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[7, 6, 5, 4, 3, 2, 1, 0].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => apercuCompte.ouvrir(n)}
            className="rounded-full bg-navy px-3 py-1.5 text-xs font-bold text-white"
          >
            {n ? `J-${n}` : 'Jour J'}
          </button>
        ))}
      </div>
    </section>
  );
}
