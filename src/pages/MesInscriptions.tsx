import { CloudOff, Gift, KeyRound, LogOut, PartyPopper, Save, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { JoursSelection } from '../components/JoursSelection';
import { useToast } from '../components/ui/overlay';
import { Avatar, Button, PageHeader } from '../components/ui/primitives';
import { ApiError, api } from '../data/api';
import { identiteStore, useIdentite } from '../data/identite';

const champ =
  'h-11 w-full rounded-xl border border-line bg-white px-3 text-[16px] text-ink outline-none focus:border-blue focus:ring-4 focus:ring-blue/10';

export function MesInscriptions() {
  const { identite, codeAdmin } = useIdentite();
  const toast = useToast();
  const [prenom, setPrenom] = useState(identite?.prenom ?? '');
  const [nom, setNom] = useState(identite?.nom ?? '');
  const [jours, setJours] = useState<number[]>(identite?.jours ?? []);
  const [envoi, setEnvoi] = useState(false);
  const [gagne, setGagne] = useState<number[] | null>(null);
  const [code, setCode] = useState('');
  const [adminOuvert, setAdminOuvert] = useState(false);

  // Résultats des tirages pour cette personne.
  const jeton = identite?.jeton;
  useEffect(() => {
    if (!jeton) return;
    const charger = () =>
      api
        .maParticipation(jeton)
        .then((r) => setGagne(r?.gagne ?? []))
        .catch(() => undefined);
    void charger();
    // Rechargé quand on revient sur l'application (le tirage a pu avoir lieu entre-temps).
    const auRetour = () => document.visibilityState === 'visible' && void charger();
    document.addEventListener('visibilitychange', auRetour);
    return () => document.removeEventListener('visibilitychange', auRetour);
  }, [jeton]);

  const modifie =
    !!identite &&
    (prenom.trim() !== identite.prenom ||
      nom.trim() !== identite.nom ||
      jours.join() !== identite.jours.join());

  const enregistrer = async () => {
    if (!prenom.trim() || !nom.trim()) return toast('Indique ton prénom et ton nom.', 'error');
    setEnvoi(true);
    try {
      const ok = await identiteStore.enregistrer(prenom, nom, jours);
      toast(
        ok ? 'Inscription mise à jour' : 'Enregistré sur ce téléphone, envoi dès que possible',
        ok ? 'success' : 'info',
      );
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erreur, réessaie.', 'error');
    } finally {
      setEnvoi(false);
    }
  };

  const entrerAdmin = async () => {
    try {
      await identiteStore.devenirAdmin(code);
      toast('Mode administrateur activé');
      setCode('');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Code incorrect', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Mon compte"
        title="Mes inscriptions"
        description="Choisis les jours où tu veux être tiré(e) au sort pour le calendrier de l’Avent."
      />

      {gagne && gagne.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-5 flex items-center gap-4 rounded-3xl p-5 text-white shadow-lift"
          style={{ background: 'linear-gradient(140deg, #C8323A, #8E1F2A)' }}
        >
          <PartyPopper size={34} className="shrink-0 text-sun" />
          <div>
            <p className="font-display text-xl font-extrabold">Tu as été tiré(e) au sort !</p>
            <p className="text-sm text-white/85">
              Jour{gagne.length > 1 ? 's' : ''} {gagne.join(', ')} : un membre de la Team Ulysse va
              te contacter pour relever le défi.
            </p>
          </div>
        </motion.div>
      )}

      {identite ? (
        <section className="panel space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Avatar
              user={{
                id: identite.jeton ?? identite.nom,
                prenom: identite.prenom,
                nom: identite.nom,
              }}
              size={48}
            />
            <div>
              <p className="font-display text-lg font-extrabold text-navy-950">
                {identite.prenom} {identite.nom}
              </p>
              {identite.synchro ? (
                <p className="flex items-center gap-1 text-xs font-semibold text-success">
                  <Gift size={13} /> Inscrit(e) aux tirages au sort
                </p>
              ) : (
                <p className="flex items-center gap-1 text-xs font-semibold text-sun-dark">
                  <CloudOff size={13} /> Pas encore envoyé : nouvel essai automatique à la prochaine
                  ouverture
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-semibold text-navy-950">Prénom</span>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                maxLength={60}
                className={champ}
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-semibold text-navy-950">Nom</span>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                maxLength={60}
                className={champ}
              />
            </label>
          </div>

          <JoursSelection value={jours} onChange={setJours} />

          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={enregistrer}
            disabled={envoi || (!modifie && identite.synchro)}
          >
            <Save size={18} /> {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </section>
      ) : (
        <p className="panel p-5 text-sm text-muted">
          Ce téléphone est utilisé en mode administrateur, sans inscription aux tirages.
        </p>
      )}

      {/* Administration */}
      <section className="mt-6">
        {codeAdmin ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/admin"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-navy font-semibold text-white hover:bg-navy-900"
            >
              <ShieldCheck size={18} /> Espace administrateur
            </Link>
            <Button variant="ghost" size="lg" onClick={() => identiteStore.quitterAdmin()}>
              <LogOut size={17} /> Quitter le mode admin
            </Button>
          </div>
        ) : adminOuvert ? (
          <div className="panel flex flex-col gap-2 p-4 sm:flex-row">
            <input
              type="password"
              placeholder="Code administrateur"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={champ}
            />
            <Button onClick={entrerAdmin} disabled={!code.trim()}>
              <KeyRound size={16} /> Entrer
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setAdminOuvert(true)}
            className="mx-auto flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-navy"
          >
            <ShieldCheck size={15} /> Accès administrateur
          </button>
        )}
      </section>
    </div>
  );
}
