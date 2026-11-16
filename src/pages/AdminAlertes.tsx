import { BellRing, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../components/ui/overlay';
import { Button, cx } from '../components/ui/primitives';
import { ApiError, api } from '../data/api';
import { endpointActuel, rappelsStore } from '../data/rappels';

const SANS_RAPPELS = 'Active d’abord les rappels sur ce téléphone (onglet Moi › Mes rappels).';

/** Alerte « Nouvel inscrit » sur le téléphone de l'administrateur, et son test. */
export function AlertesInscriptions({ code }: { code: string }) {
  const toast = useToast();
  const [actif, setActif] = useState<boolean | null>(null);
  const [occupe, setOccupe] = useState(false);

  const lire = useCallback(async () => {
    const endpoint = await endpointActuel();
    if (!endpoint) return setActif(false);
    try {
      setActif(await api.adminAlertesInscrits(code, endpoint));
    } catch {
      setActif(null);
    }
  }, [code]);

  useEffect(() => {
    // État de l'alerte pour ce téléphone.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void lire();
  }, [lire]);

  const action = async (f: (endpoint: string) => Promise<void>) => {
    setOccupe(true);
    try {
      const endpoint = await endpointActuel();
      if (!endpoint) return toast(SANS_RAPPELS, 'error');
      await rappelsStore.verifier().catch(() => undefined);
      await f(endpoint);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erreur', 'error');
    } finally {
      setOccupe(false);
    }
  };

  const basculer = () =>
    action(async (endpoint) => {
      try {
        const r = await api.adminAlertesInscrits(code, endpoint, !actif);
        setActif(r);
        toast(
          r ? 'Tu seras prévenu de chaque nouvel inscrit 🎉' : 'Alertes coupées sur ce téléphone',
          r ? 'success' : 'info',
        );
      } catch (e) {
        throw e instanceof ApiError && !/rappels/.test(e.message)
          ? new ApiError(`${e.message} (as-tu lancé supabase/maj-notif-inscrits.sql ?)`)
          : e;
      }
    });

  const tester = () =>
    action(async (endpoint) => {
      try {
        const r = await api.adminTesterInscription(code, endpoint);
        toast(
          r.envoyes ? 'Notification de test envoyée sur ce téléphone 🔔' : 'Rien n’a été envoyé',
          r.envoyes ? 'success' : 'error',
        );
      } catch (e) {
        throw e instanceof ApiError
          ? new ApiError(`${e.message} (as-tu remis à jour la fonction envoyer-rappels ?)`)
          : e;
      }
    });

  return (
    <section className="panel mb-5 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sun/25 text-navy-950">
          <UserPlus size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold text-navy-950">Nouvelles inscriptions</p>
          <p className="text-sm text-muted">
            Reçois une notification sur <b>ce téléphone</b> à chaque nouvel inscrit, avec son prénom
            et son nom. Les collaborateurs ne reçoivent rien.
          </p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={!!actif}
        disabled={occupe}
        onClick={() => void basculer()}
        className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl bg-canvas px-3.5 py-3 text-left text-sm font-semibold text-navy-950 disabled:opacity-60"
      >
        Me prévenir sur ce téléphone
        <span
          className={cx(
            'relative h-7 w-12 shrink-0 rounded-full transition-colors',
            actif ? 'bg-success' : 'bg-line',
          )}
        >
          <span
            className={cx(
              'absolute top-1 size-5 rounded-full bg-white shadow transition-[left]',
              actif ? 'left-6' : 'left-1',
            )}
          />
        </span>
      </button>
      <Button
        variant="accent"
        className="mt-2.5 w-full"
        onClick={() => void tester()}
        disabled={occupe}
      >
        <BellRing size={16} /> {occupe ? 'Envoi…' : 'M’envoyer une notif de test'}
      </Button>
    </section>
  );
}
