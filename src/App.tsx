import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { CadeauxRecus } from './components/CadeauxRecus';
import { Bravo } from './components/ui/vivant';
import { CompteARebours } from './components/compte/CompteARebours';
import { ToastProvider } from './components/ui/overlay';
import { aventStore } from './avent/progress';
import { identiteStore, useIdentite } from './data/identite';
import { inclinaisonStore } from './data/inclinaison';
import { demarrerPastille } from './data/pastille';
import { demarrerSuiviPacks } from './data/suiviPacks';
import { CoalitionAdmin } from './pages/CoalitionAdmin';
import { Admin } from './pages/Admin';
import { Advent } from './pages/Advent';
import { Bienvenue } from './pages/Bienvenue';
import { Installer } from './pages/Installer';
import { estInstallee, rappelsStore } from './data/rappels';
import { EtapeRappels, etapeRappels } from './components/Rappels';
import { EtapeTirage, etapeTirage } from './avent/EtapeTirage';
import { MesInscriptions } from './pages/MesInscriptions';
import { AdventDay } from './pages/AdventDay';
import { Collection } from './pages/Collection';
import { Classement } from './pages/Classement';
import { Echange, EchangeHorsAppli, lireCode } from './pages/Echange';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { Securite } from './pages/Securite';
import { Remontees } from './pages/Remontees';
import { Rassemblement } from './pages/Rassemblement';

export function App() {
  const { identite, codeAdmin } = useIdentite();
  // Site ouvert dans le navigateur (pas depuis l'icône) : on explique d'abord l'installation.
  const [navigateur, setNavigateur] = useState(() => !estInstallee());
  const [codeEchangeNavigateur, setCodeEchangeNavigateur] = useState(() =>
    /#\/echange\?/.test(location.hash) ? lireCode(location.hash) : null,
  );
  const [rassemblement, setRassemblement] = useState(() =>
    location.hash.startsWith('#/rassemblement'),
  );
  useEffect(() => {
    const suivre = () => setRassemblement(location.hash.startsWith('#/rassemblement'));
    window.addEventListener('hashchange', suivre);
    return () => window.removeEventListener('hashchange', suivre);
  }, []);
  // Change quand l'écran des rappels est terminé, pour réafficher l'appli.
  const [, setEtapeFinie] = useState(0);

  // Une inscription faite hors ligne est renvoyée à chaque ouverture, jusqu'à ce qu'elle passe.
  useEffect(() => {
    // Rappels actifs : on vérifie que ce téléphone est toujours bien inscrit, et on le relie à
    // l'inscription (une fois celle-ci envoyée) pour prévenir la personne si elle est tirée au sort.
    identiteStore
      .synchroniser()
      .catch(() => undefined)
      .finally(() => {
        rappelsStore.verifier().catch(() => undefined);
        // Résultats du calendrier pas encore transmis à l'administrateur.
        void aventStore.synchroniser();
        // Packs du jour ouverts : pour l'onglet « Packs » de l'administrateur.
        demarrerSuiviPacks();
      });
    // Cartes holographiques : le reflet suit les mouvements du téléphone.
    inclinaisonStore.demarrer();
    // Pastille « 1 » sur l'icône tant que le pack du jour n'est pas ouvert.
    demarrerPastille();
  }, []);

  // QR du point de rassemblement : page ouverte à tous, sans inscription ni installation.
  if (rassemblement) return <Rassemblement />;

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
        <EtapeRappels onFin={() => setEtapeFinie((n) => n + 1)} />
      </ToastProvider>
    );
  }

  // Puis l'inscription au tirage au sort du calendrier de l'Avent.
  if (etapeTirage.aAfficher()) {
    return (
      <ToastProvider>
        <EtapeTirage onFin={() => setEtapeFinie((n) => n + 1)} />
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
            <Route path="classement" element={<Classement />} />
            <Route path="echange" element={<Echange />} />
            <Route path="avent" element={<Advent />} />
            <Route path="avent/:jour" element={<AdventDay />} />
            <Route path="moi" element={<MesInscriptions />} />
            <Route path="admin" element={<Admin />} />
            <Route path="coalition" element={<CoalitionAdmin />} />
            {/* Test administrateur : espace Sécurité. */}
            <Route path="securite" element={<Securite />} />
            <Route path="remontees" element={<Remontees />} />
          </Route>
          {/* Point de rassemblement ouvert depuis le bandeau d'évacuation (sans la barre d'onglets). */}
          <Route path="rassemblement" element={<Rassemblement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* Cartes offertes par l'administrateur. */}
        <CadeauxRecus />
        {/* Ulysse qui félicite. */}
        <Bravo />
        {/* Compte à rebours avant le calendrier de l'Avent (J-7 → jour J). */}
        <CompteARebours />
      </ToastProvider>
    </HashRouter>
  );
}
