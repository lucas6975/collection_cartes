import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider } from './components/ui/overlay';
import { Advent } from './pages/Advent';
import { AdventDay } from './pages/AdventDay';
import { Collection } from './pages/Collection';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';

export function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Menu />} />
            <Route path="cartes" element={<Home />} />
            <Route path="collection" element={<Collection />} />
            <Route path="avent" element={<Advent />} />
            <Route path="avent/:jour" element={<AdventDay />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </HashRouter>
  );
}
