// Bannière « Échange en cours », sur toutes les pages sauf l'onglet Échange : l'échange continue
// même si on a quitté l'écran, et la collection se met à jour toute seule une fois accepté.
import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { api, type Echange } from '../data/api';
import { appliquerEchange, echangeEnCours, useEchangeEnCours } from '../data/echangeEnCours';

const prenom = (nom: string | null | undefined) => (nom ?? 'ton collègue').split(' ')[0];

export function BanniereEchange() {
  const en = useEchangeEnCours();
  const { pathname } = useLocation();
  const [e, setE] = useState<Echange | null>(null);
  const surEchange = pathname === '/echange';

  useEffect(() => {
    if (!en || surEchange) return;
    let actif = true;
    const verifier = () =>
      api
        .echangeVoir(en.code, en.cle)
        .then((r) => {
          if (!actif) return;
          if (!r || r.etat === 'annule') {
            echangeEnCours.set(null);
            return;
          }
          if (r.etat === 'accepte') {
            // Côté B : le collègue a accepté pendant qu'on était ailleurs.
            if (en.role === 'b' && r.donne_b && r.recoit_b)
              appliquerEchange(r.code, r.donne_b, r.recoit_b);
            echangeEnCours.set(null);
            return;
          }
          setE(r);
        })
        .catch(() => undefined);
    void verifier();
    const t = setInterval(verifier, 4000);
    return () => {
      actif = false;
      clearInterval(t);
    };
  }, [en, surEchange]);

  // Côté A, rien à signaler tant que personne n'a scanné le code.
  const texte = (() => {
    if (!en || !e) return null;
    if (en.role === 'a') {
      if (!e.nom_b) return null;
      return e.etat === 'propose'
        ? { titre: `${prenom(e.nom_b)} te propose un échange`, sous: 'Il attend ta réponse' }
        : { titre: `🔁 Échange avec ${prenom(e.nom_b)}`, sous: 'Il choisit les cartes…' };
    }
    return e.etat === 'propose'
      ? { titre: `🔁 Échange avec ${prenom(e.nom_a)}`, sous: 'En attente de sa réponse' }
      : {
          titre: `🔁 Échange avec ${prenom(e.nom_a)}`,
          sous: e.etat === 'refuse' ? 'Refusé : propose une autre carte' : 'À toi de choisir',
        };
  })();
  const visible = !surEchange && !!texte;

  return (
    <AnimatePresence>
      {visible && en && (
        <motion.div
          className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md sm:bottom-6"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        >
          <Link
            to="/echange"
            className="flex items-center gap-3 rounded-2xl bg-navy-950 px-4 py-3 text-white shadow-lift"
          >
            <span className="relative flex size-3 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-3 rounded-full bg-success" />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate font-display text-[15px]">{texte!.titre}</b>
              <span className="text-xs text-white/75">
                {texte!.sous} · encore {echangeEnCours.minutesRestantes(en)} min
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-xl bg-sun px-3 py-2 text-sm font-extrabold text-navy-950">
              Reprendre <ChevronRight size={15} />
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
