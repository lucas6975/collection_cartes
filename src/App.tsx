import { lazy, Suspense, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { RewardsProvider } from './components/cards/Rewards';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider } from './components/ui/overlay';
import { useSession } from './data/store';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Collection } from './pages/Collection';
import { Learn } from './pages/Learn';
import { Challenges } from './pages/Challenges';
import { QuizPlayer } from './pages/QuizPlayer';
import { ScenarioPlayer } from './pages/ScenarioPlayer';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';

// L'espace administrateur (graphiques compris) est chargé à la demande.
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCards = lazy(() => import('./pages/admin/AdminCards'));
const AdminQuestions = lazy(() => import('./pages/admin/AdminQuestions'));
const AdminValidation = lazy(() => import('./pages/admin/AdminValidation'));

function RequireAuth({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user } = useSession();
  if (!user) return <Navigate to="/connexion" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-navy/[0.06]" />
      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-navy/[0.06]" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-navy/[0.06]" />
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <RewardsProvider>
          <Routes>
            <Route path="/connexion" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="collection" element={<Collection />} />
              <Route path="apprendre" element={<Learn />} />
              <Route path="defis" element={<Challenges />} />
              <Route path="quiz/:mode/:id?" element={<QuizPlayer />} />
              <Route path="scenario/:id" element={<ScenarioPlayer />} />
              <Route path="classement" element={<Leaderboard />} />
              <Route path="profil" element={<Profile />} />
            </Route>
            <Route
              path="admin"
              element={
                <RequireAuth admin>
                  <AppShell admin />
                </RequireAuth>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<Loading />}>
                    <AdminDashboard />
                  </Suspense>
                }
              />
              <Route
                path="utilisateurs"
                element={
                  <Suspense fallback={<Loading />}>
                    <AdminUsers />
                  </Suspense>
                }
              />
              <Route
                path="cartes"
                element={
                  <Suspense fallback={<Loading />}>
                    <AdminCards />
                  </Suspense>
                }
              />
              <Route
                path="questions"
                element={
                  <Suspense fallback={<Loading />}>
                    <AdminQuestions />
                  </Suspense>
                }
              />
              <Route
                path="validation"
                element={
                  <Suspense fallback={<Loading />}>
                    <AdminValidation />
                  </Suspense>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RewardsProvider>
      </ToastProvider>
    </HashRouter>
  );
}
