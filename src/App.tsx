import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider } from './components/ui/overlay';
import { identiteStore, useIdentite } from './data/identite';
import { inclinaisonStore } from './data/inclinaison';
import { demarrerPastille } from './data/pastille';
import { CoalitionAdmin } from './pages/CoalitionAdmin';
import { Admin } from './pages/Admin';
import { Advent } from './pages/Advent';
import { Bienvenue } from './pages/Bienvenue';
import { Installer } from './pages/Installer';
import { estInstallee, rappelsStore } from './data/rappels';
import { EtapeRappels, etapeRappels } from './components/Rappels';
import { MesInscriptions } from './pages/MesInscriptions';
import { AdventDay } from './pages/AdventDay';
import { Collection } from './pages/Collection';
import { Echange, EchangeHorsAppli, lireCode } from './pages/Echange';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';

export function App() {
  const { identite, codeAdmin } = useIdentite();
  // Site ouvert dans le navigateur (pas depuis l'icône) : on explique d'abord l'installation.
  const [navigateur, setNavigateur] = useState(() => !estInstallee());
  const [codeEchangeNavigateur, setCodeEchangeNavigateur] = useState(() =>
    /#\/echange\?/.test(location.hash) ? lireCode(location.hash) : null,
  );
  // Change quand l'écran des rappels est terminé, pour réafficher l'appli.
  const [, setEtapeFinie] = useState(false);

  // Une inscription faite hors ligne est renvoyée à chaque ouverture, jusqu'à ce qu'elle passe.
  useEffect(() => {
    // Rappels actifs : on vérifie que ce téléphone est toujours bien inscrit, et on le relie à
    // l'inscription (une fois celle-ci envoyée) pour prévenir la personne si elle est tirée au sort.
    identiteStore
      .synchroniser()
      .catch(() => undefined)
      .finally(() => rappelsStore.verifier().catch(() => undefined));
    // Cartes holographiques : le reflet suit les mouvements du téléphone.
    inclinaisonStore.demarrer();
    // Pastille « 1 » sur l'icône tant que le pack du jour n'est pas ouvert.
    demarrerPastille();
  }, []);

  // Lien d'échange ouvert dans le navigateur : l'échange se fait dans l'appli installée.
  if (navigateur && codeEchangeNavigateur) {
    return (
      <EchangeHorsAppli
        code={codeEchangeNavigateur}
        onContinuer={() => {
          history.replaceState(null, '', location.pathname);
          setCodeEchangeNavigateur(null);
        }}
      />
    );
  }
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
  // Nouvel inscrit : l'écran des rappels avant le premier menu.
  if (identite && etapeRappels.aAfficher()) {
    return (
      <ToastProvider>
        <EtapeRappels onFin={() => setEtapeFinie(true)} />
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
