import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider } from './components/ui/overlay';
import { identiteStore, useIdentite } from './data/identite';
import { CoalitionAdmin } from './pages/CoalitionAdmin';
import { Admin } from './pages/Admin';
import { Advent } from './pages/Advent';
import { Bienvenue } from './pages/Bienvenue';
import { Installer } from './pages/Installer';
import { estInstallee, rappelsStore } from './data/rappels';
import { MesInscriptions } from './pages/MesInscriptions';
import { AdventDay } from './pages/AdventDay';
import { Collection } from './pages/Collection';
import { Echange } from './pages/Echange';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';

export function App() {
  const { identite, codeAdmin } = useIdentite();
  // Site ouvert dans le navigateur (pas depuis l'icône) : on explique d'abord l'installation.
  const [navigateur, setNavigateur] = useState(() => !estInstallee());

  // Une inscription faite hors ligne est renvoyée à chaque ouverture, jusqu'à ce qu'elle passe.
  useEffect(() => {
    identiteStore.synchroniser().catch(() => undefined);
    // Rappels actifs : on vérifie que ce téléphone est toujours bien inscrit.
    rappelsStore.verifier().catch(() => undefined);
  }, []);

  // Premier lancement : chacun indique son prénom et son nom (l'administrateur, son code).
  if (!identite && !codeAdmin && navigateur) {
    return (
      <ToastProvider>
        <Installer onContinuer={() => setNavigateur(false)} />
      </ToastProvider>
    );
  }
  if (!identite && !codeAdmin) {
    return (
      <ToastProvider>
        <Bienvenue />
      </ToastProvider>
    );
  }

  return (
    <HashRouter>
      <ToastProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Menu />} />
            <Route path="cartes" element={<Home />} />
            <Route path="collection" element={<Collection />} />
            <Route path="echange" element={<Echange />} />
            <Route path="avent" element={<Advent />} />
            <Route path="avent/:jour" element={<AdventDay />} />
            <Route path="moi" element={<MesInscriptions />} />
            <Route path="admin" element={<Admin />} />
            <Route path="coalition" element={<CoalitionAdmin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </HashRouter>
  );
}
