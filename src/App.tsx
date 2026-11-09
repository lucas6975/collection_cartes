import type { ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider } from './components/ui/overlay';
import { useSession } from './data/store';
import { Collection } from './pages/Collection';
import { Home } from './pages/Home';
import { Login } from './pages/Login';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useSession();
  if (!user) return <Navigate to="/connexion" replace />;
  return children;
}

export function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <Routes>
          <Route path="/connexion" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Home />} />
            <Route path="collection" element={<Collection />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </HashRouter>
  );
}
