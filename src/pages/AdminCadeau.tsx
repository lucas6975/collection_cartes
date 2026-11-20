import { Gift, Search } from 'lucide-react';
import { useState } from 'react';
import { GameCard } from '../components/cards/GameCard';
import { Modal, useToast } from '../components/ui/overlay';
import { Avatar, Button, cx } from '../components/ui/primitives';
import { CARDS } from '../content/cards';
import { ApiError, api, type Participant } from '../data/api';

/** Espace admin : offrir n'importe quelle carte à une personne inscrite. */
export function OffrirCarte({ code, participants }: { code: string; participants: Participant[] }) {
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [q, setQ] = useState('');
  const [qui, setQui] = useState<Participant | null>(null);
  const [carte, setCarte] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const choisie = CARDS.find((c) => c.id === carte);
  const liste = participants
    .filter((p) => `${p.prenom} ${p.nom}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`));

  const fermer = () => {
    setOuvert(false);
    setQui(null);
    setCarte(null);
    setQ('');
  };

  const offrir = async () => {
    if (!qui || !carte) return;
    setEnvoi(true);
    try {
      await api.adminOffrirCarte(code, qui.id, carte);
      toast(`🎁 « ${choisie?.nom} » offerte à ${qui.prenom} ${qui.nom}`, 'success');
      fermer();
    } catch (e) {
      toast(
        e instanceof ApiError ? `${e.message} (as-tu lancé supabase/maj-cadeaux.sql ?)` : 'Erreur',
        'error',
      );
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <section className="panel mb-5 flex items-center gap-3 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#C8283A]/10 text-[#C8283A]">
          <Gift size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold text-navy-950">Offrir une carte</p>
          <p className="text-sm text-muted">
            Choisis une personne et une carte : elle la reçoit à sa prochaine ouverture de l’appli.
          </p>
        </div>
        <Button variant="accent" onClick={() => setOuvert(true)}>
          <Gift size={16} /> Offrir
        </Button>
      </section>

      <Modal
        open={ouvert}
        onClose={fermer}
        title={qui ? `Quelle carte pour ${qui.prenom} ?` : 'À qui offrir une carte ?'}
        size="lg"
      >
        {!qui ? (
          <div className="space-y-3 p-5">
            <label className="relative block">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un nom…"
                className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-[16px] outline-none focus:border-blue"
              />
            </label>
            <ul className="divide-y divide-line">
              {liste.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setQui(p)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-canvas"
                  >
                    <Avatar user={{ id: p.id, prenom: p.prenom, nom: p.nom }} size={34} />
                    <span className="font-semibold text-navy-950">
                      {p.prenom} {p.nom}
                    </span>
                  </button>
                </li>
              ))}
              {!liste.length && (
                <li className="py-6 text-center text-sm text-muted">Aucun inscrit trouvé.</li>
              )}
            </ul>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <button
              type="button"
              onClick={() => setQui(null)}
              className="text-sm font-semibold text-blue"
            >
              ← Changer de personne
            </button>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {CARDS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCarte(c.id)}
                  className={cx(
                    'rounded-2xl p-1 transition-all',
                    carte === c.id
                      ? 'bg-sun/30 ring-[3px] ring-sun'
                      : 'opacity-80 hover:opacity-100',
                  )}
                >
                  <GameCard
                    card={c}
                    total={CARDS.length}
                    size="sm"
                    className="w-full"
                    tilt={false}
                  />
                </button>
              ))}
            </div>
            <div className="sticky bottom-0 -mx-5 border-t border-line bg-white px-5 pt-3">
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={() => void offrir()}
                disabled={!carte || envoi}
              >
                <Gift size={18} />{' '}
                {envoi
                  ? 'Envoi…'
                  : choisie
                    ? `Offrir « ${choisie.nom} » à ${qui.prenom}`
                    : 'Choisis une carte'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
