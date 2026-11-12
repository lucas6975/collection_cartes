import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { surveillerMisesAJour } from './miseAJour';
import './styles/index.css';

/** Écran de secours : une erreur d'affichage ne doit jamais laisser une page blanche. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  reset = () => {
    try {
      localStorage.removeItem('vigie-db');
    } catch {
      // Stockage indisponible : le rechargement suffit.
    }
    location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-display text-xl font-extrabold text-navy-950">
          Oups, un problème est survenu
        </p>
        <p className="max-w-sm text-sm text-muted">
          Les données de démonstration enregistrées dans ce navigateur sont peut-être d’une ancienne
          version.
        </p>
        <button
          onClick={this.reset}
          className="h-11 rounded-xl bg-sun px-5 font-semibold text-navy-950"
        >
          Réinitialiser et recharger
        </button>
        <p className="max-w-sm text-xs text-muted/70">{this.state.error.message}</p>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// L'appli est affichée : l'écran de lancement s'efface en fondu.
requestAnimationFrame(() => {
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.add('fini');
  setTimeout(() => boot.remove(), 400);
});

surveillerMisesAJour();
