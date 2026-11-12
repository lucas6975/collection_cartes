import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Detecteur {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type DetecteurCtor = new (o: { formats: string[] }) => Detecteur;

/**
 * Scanner de QR code avec la caméra arrière. Utilise le détecteur intégré du téléphone quand
 * il existe (Android), sinon une petite bibliothèque chargée à la demande (iPhone).
 */
export function ScannerQR({
  onCode,
  onFermer,
}: {
  onCode: (texte: string) => void;
  onFermer: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const rappel = useRef(onCode);
  useEffect(() => {
    rappel.current = onCode;
  });

  useEffect(() => {
    let flux: MediaStream | null = null;
    let fini = false;
    let minuteur: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        flux = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
      } catch {
        setErreur(
          'Caméra inaccessible : autorise l’appareil photo pour Team Ulysse dans les réglages.',
        );
        return;
      }
      if (fini || !video.current) return flux.getTracks().forEach((t) => t.stop());
      const v = video.current;
      v.srcObject = flux;
      await v.play().catch(() => undefined);

      const Natif = (window as unknown as { BarcodeDetector?: DetecteurCtor }).BarcodeDetector;
      let lire: () => Promise<string | null>;
      if (Natif) {
        const d = new Natif({ formats: ['qr_code'] });
        lire = async () => (await d.detect(v))[0]?.rawValue ?? null;
      } else {
        const jsQR = (await import('jsqr')).default;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        lire = async () => {
          const w = v.videoWidth;
          const h = v.videoHeight;
          if (!w || !h) return null;
          const k = Math.min(1, 640 / Math.max(w, h));
          canvas.width = Math.round(w * k);
          canvas.height = Math.round(h * k);
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          return jsQR(img.data, img.width, img.height)?.data ?? null;
        };
      }
      const boucle = async () => {
        if (fini) return;
        const texte = await lire().catch(() => null);
        if (texte && !fini) {
          fini = true;
          rappel.current(texte);
          return;
        }
        minuteur = setTimeout(() => void boucle(), 180);
      };
      void boucle();
    })();

    return () => {
      fini = true;
      clearTimeout(minuteur);
      flux?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black px-6 text-center text-white">
      <button
        onClick={onFermer}
        className="fixed right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/15 hover:bg-white/25"
        aria-label="Fermer"
      >
        <X size={20} />
      </button>
      <p className="eyebrow text-sun">Scanner</p>
      <p className="mt-1 font-display text-xl font-extrabold">Vise le QR code de ton collègue</p>
      <div className="relative mt-6 aspect-square w-full max-w-xs overflow-hidden rounded-3xl bg-white/5">
        <video ref={video} playsInline muted className="size-full object-cover" />
        <div className="pointer-events-none absolute inset-6 rounded-2xl border-4 border-sun/90" />
      </div>
      {erreur && <p className="mt-5 max-w-xs text-sm text-white/80">{erreur}</p>}
    </div>,
    document.body,
  );
}
