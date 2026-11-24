// Petites animations qui rendent l'appli plus vivante : chargement avec Ulysse, écran vide,
// et Ulysse qui félicite après une réussite. Dessins officiels d'Ulysse uniquement.
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Confetti } from '../../avent/ui';
import { bravoStore } from '../../data/bravo';
import { MASCOTTE_URL } from '../cards/CardBack';

const PROFIL = `${import.meta.env.BASE_URL}ulysse-profil.webp`;
const AVATAR = `${import.meta.env.BASE_URL}ulysse-avatar.webp`;

/** Chargement : Ulysse de profil court au-dessus d'une barre jaune et noir. */
export function ChargementUlysse({ texte = 'Chargement…' }: { texte?: string }) {
  return (
    <div className="flex flex-col items-center py-10" role="status" aria-live="polite">
      <div className="relative h-[86px] w-[230px]">
        <img
          src={PROFIL}
          alt=""
          className="vi-coureur absolute bottom-0 w-[96px]"
          draggable={false}
        />
      </div>
      <div className="vi-piste relative mt-1 h-3 w-[230px] overflow-hidden rounded-full border-2 border-navy-950" />
      <p className="mt-3 text-sm font-semibold text-muted">{texte}</p>
    </div>
  );
}

/** Écran vide : Ulysse attend en se balançant, avec un message et une action éventuelle. */
export function UlysseAttend({
  titre,
  texte,
  children,
}: {
  titre: string;
  texte?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center px-6 py-10 text-center">
      <span className="vi-zzz font-display text-sm font-extrabold text-muted" aria-hidden>
        z z z
      </span>
      <img src={MASCOTTE_URL} alt="" className="vi-attend h-36 w-auto" draggable={false} />
      <p className="mt-3 font-display text-lg font-extrabold text-navy-950">{titre}</p>
      {texte && <p className="mt-1 max-w-xs text-sm text-muted">{texte}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/** Ulysse surgit en bas de l'écran pour féliciter (case réussie, échange terminé…). */
export function Bravo() {
  const b = useSyncExternalStore(bravoStore.subscribe, bravoStore.get, () => null);
  useEffect(() => {
    if (!b) return;
    const t = setTimeout(() => bravoStore.fermer(), 3200);
    return () => clearTimeout(t);
  }, [b]);
  return createPortal(
    <AnimatePresence>
      {b && (
        <motion.div
          key={b.id}
          className="pointer-events-none fixed inset-0 z-[250]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Confetti count={60} />
          <motion.button
            type="button"
            onClick={() => bravoStore.fermer()}
            className="pointer-events-auto absolute inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-navy-950 p-3 text-left text-white shadow-lift sm:bottom-6"
            initial={{ y: 140 }}
            animate={{ y: 0 }}
            exit={{ y: 140 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          >
            <img
              src={AVATAR}
              alt=""
              className="size-12 shrink-0 rounded-full bg-navy object-cover ring-2 ring-sun"
            />
            <span className="min-w-0">
              <b className="block font-display text-base">{b.titre}</b>
              {b.texte && <span className="text-[13px] text-white/80">{b.texte}</span>}
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
