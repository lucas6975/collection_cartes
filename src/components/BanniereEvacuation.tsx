// Pendant une évacuation : grande alerte plein écran à l'ouverture de l'appli, avec un bouton
// « Je suis au point de rassemblement » (prénom et nom déjà connus). Si on la ferme, un bandeau
// rouge reste en haut. Rien ne s'affiche une fois déclaré présent, ni à la fin de l'évacuation.
// Évacuation test : seuls Lucas, Vincent et l'administrateur la voient.
import { Camera, CheckCircle2, ChevronRight, ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useAccesSecurite } from '../data/accesSecurite';
import { ScannerQR } from './ScannerQR';
import { api } from '../data/api';
import {
  codeLieuDe,
  dejaPresent,
  heureFr,
  identifiantAppareil,
  noterPresent,
  useEvacuation,
} from '../data/evacuation';
import { useIdentite } from '../data/identite';

const BASE = import.meta.env.BASE_URL;

function depuis(debut: string) {
  const s = Math.max(0, Math.floor((Date.now() - Date.parse(debut)) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function BanniereEvacuation() {
  const etat = useEvacuation(20_000);
  const acces = useAccesSecurite();
  const { identite, codeAdmin } = useIdentite();
  const [scanner, setScanner] = useState(false);
  const [mauvaisQr, setMauvaisQr] = useState(false);
  const [fermee, setFermee] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [ok, setOk] = useState<{ heure: string } | null>(null);
  const [erreur, setErreur] = useState(false);
  const [, setTic] = useState(0);
  // Sur l'écran de gestion de l'évacuation (Lucas, Vincent), l'alerte ne cache rien.
  const surGestion = useLocation().pathname === '/securite/evacuation';

  const visible = Boolean(etat?.active && etat.id && (!etat.test || acces) && !surGestion);
  const deja = visible ? dejaPresent(etat!.id) : null;
  const plein = visible && !deja && fermee !== etat!.id;

  useEffect(() => {
    if (!plein) return;
    navigator.vibrate?.([500, 200, 500, 200, 800]);
    const t = setInterval(() => setTic((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [plein]);

  if (!visible) return null;

  // Lucas, Vincent et l'administrateur : un toucher. Les autres doivent scanner le QR du point
  // de rassemblement (preuve d'être sur place : pas de déclaration depuis le télétravail).
  const present = async (lieu: string | null = null) => {
    if (!identite) {
      location.hash = '#/rassemblement';
      return;
    }
    if (!acces && !lieu) {
      setMauvaisQr(false);
      setScanner(true);
      return;
    }
    setEnvoi(true);
    setErreur(false);
    try {
      const r = await api.rassemblementPresent({
        prenom: identite.prenom,
        nom: identite.nom,
        statut: 'Salarié IMECA',
        appareil: identifiantAppareil(),
        jeton: identite.jeton ?? null,
        lieu,
        code: codeAdmin,
      });
      noterPresent({
        evacuation: etat!.id!,
        heure: r.heure,
        nom: `${identite.prenom} ${identite.nom}`,
      });
      setOk({ heure: r.heure });
      navigator.vibrate?.(150);
    } catch {
      setErreur(true);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      {scanner && (
        <ScannerQR
          onCode={(texte) => {
            const c = codeLieuDe(texte);
            setScanner(false);
            if (c) void present(c);
            else setMauvaisQr(true);
          }}
          onFermer={() => setScanner(false)}
        />
      )}
      <AnimatePresence>
        {(plein || ok) && (
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label="Évacuation en cours"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex flex-col items-center overflow-y-auto px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-8 text-center text-white"
            style={{
              background: ok
                ? '#16A34A'
                : 'radial-gradient(120% 80% at 50% 0%, #EF4444, #B91C1C 50%, #7F1D1D)',
            }}
          >
            {ok ? (
              <>
                <CheckCircle2 size={88} className="mt-16" />
                <p className="mt-4 font-display text-[30px] leading-tight font-extrabold">
                  Tu es compté(e) présent(e)
                </p>
                <p className="mt-2 text-lg font-bold">
                  {identite?.prenom} {identite?.nom} · {heureFr(ok.heure)}
                </p>
                <p className="mt-6 max-w-sm rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold">
                  Reste au point de rassemblement et attends les consignes. Ne retourne pas dans le
                  bâtiment.
                </p>
                <button
                  type="button"
                  onClick={() => setOk(null)}
                  className="mt-6 h-12 w-full max-w-sm rounded-2xl bg-white font-extrabold text-[#15803D]"
                >
                  OK
                </button>
              </>
            ) : (
              <>
                {etat!.test && (
                  <span className="mb-3 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold tracking-wider">
                    🧪 ÉVACUATION TEST · LUCAS &amp; VINCENT
                  </span>
                )}
                <span className="grid size-20 place-items-center rounded-full bg-white/18 shadow-[0_0_0_12px_rgba(255,255,255,.1),0_0_0_26px_rgba(255,255,255,.06)]">
                  <ShieldAlert size={40} className="animate-pulse" />
                </span>
                <p className="mt-7 font-display text-[36px] leading-[1.02] font-extrabold">
                  ÉVACUATION
                  <br />
                  EN COURS
                </p>
                <p className="mt-3 text-[15px] text-white/95">
                  Rejoins le point de rassemblement
                  <br />
                  et déclare-toi présent(e).
                </p>
                <img
                  src={`${BASE}securite/evacuation-carte.webp`}
                  alt=""
                  className="mt-2 h-[210px] w-auto"
                />
                <button
                  type="button"
                  disabled={envoi}
                  onClick={() => void present()}
                  className="-mt-2 flex min-h-16 w-full max-w-sm items-center justify-center gap-2 rounded-[20px] bg-white px-4 font-display text-[18px] font-extrabold text-[#15803D] shadow-[0_10px_24px_rgba(0,0,0,.25)] disabled:opacity-70"
                >
                  {acces ? <CheckCircle2 size={24} /> : <Camera size={24} />}
                  {envoi
                    ? 'Envoi…'
                    : acces
                      ? 'Je suis au point de rassemblement'
                      : 'Scanner le QR du point de rassemblement'}
                </button>
                {!acces && (
                  <p className="mt-2 max-w-sm text-xs text-white/85">
                    Le QR est affiché au point de rassemblement et sur le téléphone des membres EP.
                  </p>
                )}
                {mauvaisQr && (
                  <p className="mt-3 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold">
                    Ce n’est pas le QR code du point de rassemblement. Réessaie.
                  </p>
                )}
                {erreur && (
                  <p className="mt-3 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold">
                    Ça n’a pas marché : réessaie, ou donne ton nom à un membre EP.
                  </p>
                )}
                {etat!.debut && (
                  <p className="mt-3 text-sm font-bold text-white/85">
                    ⏱ Lancée il y a {depuis(etat!.debut)}
                  </p>
                )}
                <p className="mt-3 text-xs text-white/80">
                  Ne retourne pas dans le bâtiment. Suis les consignes des membres EP.
                </p>
                <button
                  type="button"
                  onClick={() => setFermee(etat!.id)}
                  className="mt-5 text-sm font-semibold text-white/80 underline"
                >
                  Fermer (je me déclarerai plus tard)
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!deja && !ok && fermee === etat!.id && (
        <a
          href="#/rassemblement"
          className="flex items-center gap-3 bg-[#DC2626] px-4 py-3 text-white shadow-lift"
        >
          <ShieldAlert size={26} className="shrink-0 animate-pulse" />
          <span className="min-w-0 flex-1 leading-tight">
            <b className="block font-display text-[17px]">
              {etat!.test ? 'Évacuation test en cours' : 'Évacuation en cours'}
            </b>
            <span className="text-sm text-white/90">Touche ici pour te déclarer présent(e)</span>
          </span>
          <ChevronRight size={22} />
        </a>
      )}
    </>
  );
}
