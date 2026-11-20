import { Gift } from 'lucide-react';
import { useState } from 'react';
import { renderSVG } from 'uqr';
import { GameCard } from '../components/cards/GameCard';
import { Modal, useToast } from '../components/ui/overlay';
import { Button, cx } from '../components/ui/primitives';
import { CARDS } from '../content/cards';
import { ApiError, api } from '../data/api';

/** Contenu du QR : du texte, lu par le scanner d'échange de l'appli (comme les échanges). */
export const texteCadeau = (code: string) => `TEAM ULYSSE CADEAU ${code}`;

export function lireCadeau(texte: string): string | null {
  const m = /CADEAU[\s:-]*([A-Za-z0-9]{10})\b/i.exec(texte.trim());
  return m ? m[1].toUpperCase() : null;
}

/** Espace admin : offrir n'importe quelle carte à une personne, par un QR code à usage unique. */
export function OffrirCarte({ code }: { code: string }) {
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [carte, setCarte] = useState<string | null>(null);
  const [cadeau, setCadeau] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const choisie = CARDS.find((c) => c.id === carte);

  const fermer = () => {
    setOuvert(false);
    setCarte(null);
    setCadeau(null);
  };

  const creer = async () => {
    if (!carte) return;
    setEnvoi(true);
    try {
      setCadeau(await api.adminCreerCadeau(code, carte));
    } catch (e) {
      toast(
        e instanceof ApiError ? `${e.message} (as-tu lancé supabase/maj-cadeaux.sql ?)` : 'Erreur',
        'error',
      );
    } finally {
      setEnvoi(false);
    }
  };

  const qr = cadeau
    ? `data:image/svg+xml;utf8,${encodeURIComponent(renderSVG(texteCadeau(cadeau), { ecc: 'M', border: 2 }))}`
    : '';

  return (
    <>
      <section className="panel mb-5 flex items-center gap-3 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#C8283A]/10 text-[#C8283A]">
          <Gift size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold text-navy-950">Offrir une carte</p>
          <p className="text-sm text-muted">
            Choisis une carte, puis fais scanner le QR code par la personne. Une seule fois.
          </p>
        </div>
        <Button variant="accent" onClick={() => setOuvert(true)}>
          <Gift size={16} /> Offrir
        </Button>
      </section>

      <Modal
        open={ouvert}
        onClose={fermer}
        title={cadeau ? 'Fais scanner ce QR code 📷' : 'Quelle carte offrir ?'}
        size="lg"
      >
        {!cadeau ? (
          <div className="space-y-4 p-5">
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
                onClick={() => void creer()}
                disabled={!carte || envoi}
              >
                <Gift size={18} />{' '}
                {envoi ? 'Création…' : choisie ? `Offrir « ${choisie.nom} »` : 'Choisis une carte'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-5 text-center">
            <img
              src={qr}
              alt="QR code du cadeau"
              className="mx-auto block w-full max-w-[280px] rounded-2xl [image-rendering:pixelated]"
            />
            <p className="font-display text-lg font-extrabold text-navy-950">🎁 {choisie?.nom}</p>
            <p className="text-sm text-muted">
              Dans son appli : <b className="text-navy-950">Collection › Échanger une carte ›</b>{' '}
              scanner le QR code. Valable <b className="text-navy-950">une seule fois</b>, pendant
              24 h.
            </p>
            <Button variant="secondary" className="w-full" onClick={fermer}>
              Terminé
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
