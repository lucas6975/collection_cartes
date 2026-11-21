import { useNavigate } from 'react-router';
import { Button, cx } from '../components/ui/primitives';
import {
  DEBUT_NOEL,
  THEMES_NOEL,
  THEME_NOEL,
  apercuNoelStore,
  periodeNoel,
  useApercuNoel,
} from '../data/noel';

/** Essayer le thème de Noël avant le 1er décembre, sur ce téléphone uniquement. */
export function ApercuNoel() {
  const apercu = useApercuNoel();
  const naviguer = useNavigate();
  const pourTous = THEMES_NOEL.find((t) => t.id === THEME_NOEL)!;
  const choisir = (id: (typeof THEMES_NOEL)[number]['id'] | null) => {
    apercuNoelStore.set(id);
    if (id) naviguer('/');
  };
  return (
    <section
      className="mb-5 overflow-hidden rounded-3xl p-4 text-white shadow-lift"
      style={{ background: 'linear-gradient(125deg, #C62A38, #931626 55%, #5E0C18)' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl" aria-hidden>
          🎄
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-extrabold">Tester le thème de Noël</p>
          <p className="text-sm text-white/85">
            Vois l’appli comme les salariés la verront à partir du 1er décembre. Seulement sur{' '}
            <b>ce téléphone</b> : les autres ne voient rien.
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {THEMES_NOEL.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => choisir(t.id)}
            className={cx(
              'rounded-xl px-3 py-2.5 text-sm font-bold transition-colors',
              apercu === t.id ? 'bg-sun text-navy-950' : 'bg-white/15 text-white hover:bg-white/25',
            )}
          >
            {t.emoji} {t.nom}
            {apercu === t.id && ' ✓'}
          </button>
        ))}
        <button
          type="button"
          onClick={() => choisir(null)}
          className={cx(
            'rounded-xl px-3 py-2.5 text-sm font-bold transition-colors',
            !apercu ? 'bg-white text-navy-950' : 'bg-white/15 text-white hover:bg-white/25',
          )}
        >
          Thème habituel{!apercu && ' ✓'}
        </button>
      </div>
      <p className="mt-3 text-xs text-white/75">
        {periodeNoel(new Date())
          ? `En ce moment, tout le monde voit « ${pourTous.nom} ».`
          : `Le ${new Date(DEBUT_NOEL).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}, tout le monde verra « ${pourTous.nom} » (jusqu’au 3 janvier).`}
      </p>
      {apercu && (
        <Button variant="accent" className="mt-3 w-full" onClick={() => naviguer('/')}>
          Voir l’accueil en mode Noël →
        </Button>
      )}
    </section>
  );
}
