// Page ouverte par le QR code du point de rassemblement : chacun se déclare présent, même sans
// l'appli (visiteurs, prestataires…). Pour un inscrit, le nom est déjà rempli : un seul bouton.
import { Camera, CheckCircle2, MapPin, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { ScannerQR } from '../components/ScannerQR';
import { cx } from '../components/ui/primitives';
import { useAccesSecurite } from '../data/accesSecurite';
import { ApiError, api } from '../data/api';
import {
  STATUTS,
  codeLieuDe,
  dejaPresent,
  heureFr,
  identifiantAppareil,
  noterPresent,
  useEvacuation,
} from '../data/evacuation';
import { useIdentite } from '../data/identite';

const BASE = import.meta.env.BASE_URL;
const champ =
  'mt-1.5 h-14 w-full rounded-2xl border-2 border-line bg-white px-4 text-lg outline-none focus:border-[#16A34A]';

export function Rassemblement() {
  const etat = useEvacuation(15_000);
  const { identite, codeAdmin } = useIdentite();
  // Lucas, Vincent et l'administrateur n'ont pas besoin de scanner le QR.
  const dispense = useAccesSecurite() === true;
  // Code du point de rassemblement : présent dans le lien du QR scanné avec l'appareil photo,
  // ou lu par le scanner de l'appli. Sans lui, on ne peut pas se déclarer présent.
  const [lieu, setLieu] = useState<string | null>(() => codeLieuDe(location.href));
  const [scanner, setScanner] = useState(false);
  const [mauvaisQr, setMauvaisQr] = useState(false);
  const [prenom, setPrenom] = useState(identite?.prenom ?? '');
  const [nom, setNom] = useState(identite?.nom ?? '');
  const [statut, setStatut] = useState<string>(identite ? 'Salarié IMECA' : '');
  const [societe, setSociete] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState<{ heure: string; nom: string } | null>(null);
  // Enregistrer quelqu'un d'autre (collègue sans téléphone) depuis ce téléphone.
  const [autre, setAutre] = useState(false);

  const deja = ok ?? (!autre && etat?.id ? dejaPresent(etat.id) : null);
  const inscrit = Boolean(identite) && !autre;

  const pourUnAutre = () => {
    setAutre(true);
    setOk(null);
    setPrenom('');
    setNom('');
    setStatut('');
    setSociete('');
    setErreur(null);
  };
  const complet = prenom.trim() && nom.trim() && statut;

  const valider = async () => {
    if (!etat?.id || !complet) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const r = await api.rassemblementPresent({
        prenom: prenom.trim(),
        nom: nom.trim(),
        statut,
        societe: statut === 'Salarié IMECA' ? '' : societe.trim(),
        appareil: identifiantAppareil(),
        jeton: identite?.jeton ?? null,
        lieu,
        code: codeAdmin,
      });
      const v = { evacuation: etat.id, heure: r.heure, nom: `${prenom.trim()} ${nom.trim()}` };
      if (!autre) noterPresent(v);
      setOk(v);
      navigator.vibrate?.(120);
    } catch (e) {
      setErreur(
        e instanceof ApiError
          ? e.message
          : 'Pas de réseau : réessaie dans un instant, ou signale-toi au responsable.',
      );
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F6FA] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10">
      <div className="mx-auto w-full max-w-md">
        <header className="flex items-center gap-3">
          <img src={`${BASE}mascotte.webp`} alt="" className="h-16 w-auto" />
          <div>
            <p className="text-xs font-bold tracking-wider text-[#B91C1C] uppercase">
              IMECA · Sécurité
            </p>
            <h1 className="font-display text-[26px] leading-tight font-extrabold text-navy-950">
              Point de rassemblement
            </h1>
          </div>
        </header>
        {identite && (
          <a href="#/" className="mt-2 inline-block text-sm font-bold text-navy">
            ← Retour à l’appli
          </a>
        )}

        {!etat && <p className="mt-10 text-center text-muted">Vérification…</p>}

        {etat && !etat.active && !deja && (
          <section className="panel mt-6 p-5 text-center">
            <MapPin className="mx-auto text-muted" size={40} />
            <p className="mt-2 font-display text-xl font-extrabold text-navy-950">
              Aucune évacuation en cours
            </p>
            <p className="mt-1 text-sm text-muted">
              Ce QR code sert uniquement pendant une évacuation, pour être compté présent au point
              de rassemblement.
            </p>
          </section>
        )}

        {etat?.active && deja && (
          <motion.section
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-6 rounded-3xl bg-[#16A34A] p-6 text-center text-white shadow-lift"
          >
            <CheckCircle2 className="mx-auto" size={64} />
            <p className="mt-2 font-display text-[26px] leading-tight font-extrabold">
              Tu es compté(e) présent(e)
            </p>
            <p className="mt-1 text-lg font-semibold">{deja.nom}</p>
            <p className="text-white/90">à {heureFr(deja.heure)}</p>
            <p className="mt-4 rounded-2xl bg-white/15 px-3 py-2.5 text-sm font-semibold">
              Reste au point de rassemblement et attends les consignes. Ne retourne pas dans le
              bâtiment.
            </p>
            <button
              type="button"
              onClick={pourUnAutre}
              className="mt-4 h-12 w-full rounded-2xl bg-white text-[15px] font-extrabold text-[#15803D]"
            >
              + Enregistrer un collègue sans téléphone
            </button>
          </motion.section>
        )}

        {etat?.active && !deja && !lieu && !dispense && (
          <section className="mt-5 rounded-3xl bg-[#DC2626] p-5 text-center text-white shadow-lift">
            <ShieldAlert className="mx-auto" size={40} />
            <p className="mt-2 font-display text-[24px] leading-tight font-extrabold">
              Évacuation en cours
            </p>
            <p className="mt-2 text-[15px] text-white/95">
              Une fois au point de rassemblement, <b>scanne le QR code</b> affiché sur place (ou sur
              le téléphone d’un membre EP) pour être compté(e) présent(e).
            </p>
            <button
              type="button"
              onClick={() => {
                setMauvaisQr(false);
                setScanner(true);
              }}
              className="mt-5 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-white text-lg font-extrabold text-[#B91C1C]"
            >
              <Camera size={24} /> Scanner le QR code
            </button>
            {mauvaisQr && (
              <p className="mt-3 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold">
                Ce n’est pas le QR code du point de rassemblement. Réessaie.
              </p>
            )}
            <p className="mt-4 text-xs text-white/85">
              Pas de téléphone ou pas de caméra ? Donne ton prénom et ton nom à un membre EP.
            </p>
          </section>
        )}
        {scanner && (
          <ScannerQR
            onCode={(texte) => {
              const c = codeLieuDe(texte);
              setScanner(false);
              if (c) setLieu(c);
              else setMauvaisQr(true);
            }}
            onFermer={() => setScanner(false)}
          />
        )}

        {etat?.active && !deja && (lieu || dispense) && (
          <>
            <section className="mt-5 flex items-center gap-3 rounded-3xl bg-[#DC2626] p-4 text-white shadow-lift">
              <ShieldAlert className="shrink-0" size={34} />
              <div>
                <p className="font-display text-xl font-extrabold">Évacuation en cours</p>
                <p className="text-sm text-white/90">Déclare-toi présent(e) pour être compté(e).</p>
              </div>
            </section>

            <section className="panel mt-4 space-y-4 p-5">
              {inscrit ? (
                <div className="rounded-2xl bg-[#EEF1F6] p-4 text-center">
                  <p className="text-sm text-muted">Tu es</p>
                  <p className="font-display text-2xl font-extrabold text-navy-950">
                    {prenom} {nom}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-sm font-bold text-navy-950">Prénom *</span>
                      <input
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        autoComplete="given-name"
                        className={champ}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-navy-950">Nom *</span>
                      <input
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        autoComplete="family-name"
                        className={champ}
                      />
                    </label>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-navy-950">Tu es *</span>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {STATUTS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatut(s)}
                          className={cx(
                            'h-12 rounded-2xl border-2 text-[15px] font-bold',
                            statut === s
                              ? 'border-navy-950 bg-navy-950 text-white'
                              : 'border-line bg-white text-navy-950',
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  {statut && statut !== 'Salarié IMECA' && (
                    <label className="block">
                      <span className="text-sm font-bold text-navy-950">Société</span>
                      <input
                        value={societe}
                        onChange={(e) => setSociete(e.target.value)}
                        autoComplete="organization"
                        className={champ}
                      />
                    </label>
                  )}
                </>
              )}

              <button
                type="button"
                disabled={!complet || envoi}
                onClick={() => void valider()}
                className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[#16A34A] text-xl font-extrabold text-white shadow-lift transition-transform active:scale-[0.98] disabled:opacity-40"
              >
                <CheckCircle2 size={26} /> {envoi ? 'Envoi…' : 'Je suis présent(e)'}
              </button>
              {erreur && (
                <p className="rounded-xl bg-danger/10 px-3 py-2.5 text-center text-sm font-bold text-danger">
                  {erreur}
                </p>
              )}
            </section>
            {inscrit ? (
              <button
                type="button"
                onClick={pourUnAutre}
                className="mx-auto mt-3 block text-sm font-bold text-navy"
              >
                Enregistrer quelqu’un d’autre
              </button>
            ) : (
              autre && (
                <p className="mt-3 text-center text-xs text-muted">
                  Mets le prénom et le nom de la personne que tu enregistres.
                </p>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
