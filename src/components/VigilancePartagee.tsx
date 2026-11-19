import { QrCode } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { renderSVG } from 'uqr';
import { useIdentite } from '../data/identite';
import { jourDe } from '../domain/packs';
import { Modal } from './ui/overlay';
import { Button } from './ui/primitives';

const CLE = 'team-ulysse-vigilance-cache';
// Affiché jusqu'à l'ouverture du calendrier de l'Avent.
const FIN = '2026-12-01';

export const vigilanceVisible = (now: Date, cacheLe: string | null) =>
  jourDe(now) < FIN && cacheLe !== jourDe(now);

function lireCache() {
  try {
    return localStorage.getItem(CLE);
  } catch {
    return null;
  }
}

/** Accueil : « Et ton voisin, il a Team Ulysse ? » avec un QR code à lui faire scanner. */
export function VigilancePartagee() {
  const { identite } = useIdentite();
  const [cacheLe, setCacheLe] = useState(lireCache);
  const [qr, setQr] = useState(false);
  if (!identite || !vigilanceVisible(new Date(), cacheLe)) return null;

  const plusTard = () => {
    const j = jourDe(new Date());
    try {
      localStorage.setItem(CLE, j);
    } catch {
      /* caché pour cette visite seulement */
    }
    setCacheLe(j);
  };
  const lien = `${location.origin}${location.pathname}`;
  const image = `data:image/svg+xml;utf8,${encodeURIComponent(renderSVG(lien, { ecc: 'M', border: 2 }))}`;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-start gap-3 rounded-[20px] border-2 border-[#BCD3F0] bg-[#EEF4FC] p-3.5 text-navy-950"
      >
        <span className="grid size-[46px] shrink-0 place-items-center rounded-[14px] bg-white text-2xl shadow-sm">
          👀
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-navy-950/70">
            Vigilance partagée
          </p>
          <p className="mt-0.5 font-display text-base font-extrabold leading-tight">
            Et ton voisin, il a Team Ulysse ?
          </p>
          <p className="mt-1 text-[13px] leading-snug text-navy-950/85">
            La vigilance partagée, ça marche aussi pour l’appli : un collègue sans Team Ulysse,
            c’est un collègue qui rate des légendaires 😱
          </p>
          <div className="mt-2.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQr(true)}
              className="inline-flex items-center gap-1.5 rounded-[11px] bg-navy-950 px-3 py-2 text-[13px] font-extrabold text-white"
            >
              <QrCode size={15} /> Montrer le QR code
            </button>
            <button
              type="button"
              onClick={plusTard}
              className="text-xs font-bold text-navy-950/55 hover:text-navy-950"
            >
              Plus tard
            </button>
          </div>
        </div>
      </motion.section>

      <Modal open={qr} onClose={() => setQr(false)} title="Fais scanner ton voisin 📷" size="sm">
        <div className="space-y-3 p-5 text-center">
          <img
            src={image}
            alt="QR code Team Ulysse"
            className="mx-auto block w-full max-w-[280px] rounded-2xl [image-rendering:pixelated]"
          />
          <p className="text-sm text-muted">
            Ton collègue vise ce QR code avec <b className="text-navy-950">l’appareil photo</b> de
            son téléphone, puis suit les étapes pour installer Team Ulysse.
          </p>
          <Button variant="accent" className="w-full" onClick={() => setQr(false)}>
            C’est fait ✅
          </Button>
        </div>
      </Modal>
    </>
  );
}
