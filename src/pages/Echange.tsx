import { ArrowLeft, ArrowUpDown, Camera, Check, Hourglass, Repeat, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { renderSVG } from 'uqr';
import { Confetti } from '../avent/ui';
import { CardFace } from '../components/cards/GameCard';
import { useNomCartePerso } from '../components/cards/CartePerso';
import { ScannerQR } from '../components/ScannerQR';
import { useToast } from '../components/ui/overlay';
import { Button, cx } from '../components/ui/primitives';
import { CARDS } from '../content/cards';
import { RARITY_BY_ID } from '../content/categories';
import { ApiError, api, type Echange as EchangeServeur } from '../data/api';
import { doublons, game, useGame } from '../data/store';
import type { Card } from '../domain/types';

const CARTE = new Map(CARDS.map((c) => [c.id, c]));
const AVATAR = `${import.meta.env.BASE_URL}ulysse-avatar.webp`;

// ───────────── Échanges déjà appliqués sur ce téléphone (jamais deux fois) ─────────────

const KEY = 'team-ulysse-echanges';
function dejaFaits(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}
/** Met à jour la collection une seule fois par échange. Renvoie faux si déjà fait. */
function appliquer(code: string, donne: string, recoit: string) {
  const faits = dejaFaits();
  if (faits.includes(code)) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify([...faits, code].slice(-200)));
  } catch {
    // Stockage indisponible.
  }
  game.echanger(donne, recoit);
  return true;
}

/**
 * Lit le code d'échange dans le texte d'un QR code : « TEAM ULYSSE ECHANGE ABC123 », un ancien
 * lien de l'appli (…?code=ABC123) ou le code seul.
 */
export function lireCode(texte: string): string | null {
  const t = texte.trim();
  const m =
    /ECHANGE[\s:-]*([A-Za-z0-9]{6})\b/i.exec(t) ??
    /[?&]code=([A-Za-z0-9]{6})/.exec(t) ??
    /^([A-Za-z0-9]{6})$/.exec(t);
  return m ? m[1].toUpperCase() : null;
}

/**
 * Contenu du QR code : du texte, pas un lien. Ainsi, scanné par erreur avec l'appareil photo du
 * téléphone, il n'ouvre pas le site web (sur iPhone, un lien ne peut pas ouvrir l'appli installée).
 * Il se lit avec le scanner de l'appli.
 */
export const texteQR = (code: string) => `TEAM ULYSSE ECHANGE ${code}`;

const message = (e: unknown) => (e instanceof ApiError ? e.message : 'Erreur, réessaie.');

type Vue =
  | { k: 'moncode' }
  | { k: 'choix'; code: string; cle: string; e: EchangeServeur }
  | { k: 'attente'; code: string; cle: string; e: EchangeServeur }
  | { k: 'reussi'; donne: string; recoit: string; avec: string };

export function Echange() {
  const { progress } = useGame();
  const { prenom, nom } = useNomCartePerso();
  const moi = `${prenom} ${nom}`.trim();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [vue, setVue] = useState<Vue>({ k: 'moncode' });
  const [scanner, setScanner] = useState(false);
  const mesDoublons = doublons(progress);
  const possedees = new Set(progress.cards.map((c) => c.cardId));

  const reussi = useCallback((donne: string, recoit: string, avec: string) => {
    setVue({ k: 'reussi', donne, recoit, avec });
  }, []);

  // B : rejoindre l'échange d'un collègue à partir de son code.
  const rejoindre = useCallback(
    async (code: string) => {
      try {
        const r = await api.echangeRejoindre(code, moi, doublons(game.getState().progress));
        const { cle, ...e } = r;
        if (!e.doublons_a.length) {
          toast(`${e.nom_a} n’a pas encore de doublon à échanger.`, 'info');
          await api.echangeAnnuler(code, cle).catch(() => undefined);
          return;
        }
        setVue({ k: 'choix', code, cle, e });
      } catch (e) {
        toast(message(e), 'error');
      }
    },
    [moi, toast],
  );

  // Lien ou code saisi : …#/echange?code=ABC123
  const codeLien = params.get('code');
  useEffect(() => {
    if (!codeLien) return;
    setParams({}, { replace: true });
    const c = lireCode(codeLien);
    if (c) void Promise.resolve().then(() => rejoindre(c));
  }, [codeLien, rejoindre, setParams]);

  const scanne = (texte: string) => {
    setScanner(false);
    const c = lireCode(texte);
    if (!c) return toast('Ce QR code n’est pas un code d’échange Team Ulysse.', 'error');
    void rejoindre(c);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/collection"
          className="grid size-10 place-items-center rounded-full border border-line bg-white text-navy hover:bg-blue-light"
          aria-label="Retour à la collection"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="eyebrow">Face à face</p>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Échanger une carte</h1>
        </div>
      </div>

      {vue.k === 'moncode' && (
        <MonCode
          moi={moi}
          mesDoublons={mesDoublons}
          onScanner={() => setScanner(true)}
          onCodeSaisi={(c) => void rejoindre(c)}
          onReussi={reussi}
        />
      )}

      {vue.k === 'choix' && (
        <Choix
          e={vue.e}
          mesDoublons={mesDoublons}
          possedees={possedees}
          onAnnuler={() => {
            void api.echangeAnnuler(vue.code, vue.cle).catch(() => undefined);
            setVue({ k: 'moncode' });
          }}
          onProposer={async (donne, recoit) => {
            try {
              const e = await api.echangeProposer(vue.code, vue.cle, donne, recoit);
              setVue({ k: 'attente', code: vue.code, cle: vue.cle, e });
            } catch (err) {
              toast(message(err), 'error');
            }
          }}
        />
      )}

      {vue.k === 'attente' && (
        <Attente
          code={vue.code}
          cle={vue.cle}
          e={vue.e}
          onRefus={(e) => {
            toast(`${e.nom_a} a refusé : choisis un autre échange.`, 'info');
            setVue({ k: 'choix', code: vue.code, cle: vue.cle, e });
          }}
          onAccepte={(e) => {
            appliquer(e.code, e.donne_b!, e.recoit_b!);
            reussi(e.donne_b!, e.recoit_b!, e.nom_a);
          }}
          onFin={() => {
            toast('L’échange a été annulé.', 'info');
            setVue({ k: 'moncode' });
          }}
        />
      )}

      {vue.k === 'reussi' && (
        <Reussi
          {...vue}
          onCollection={() => navigate('/collection')}
          onAutre={() => setVue({ k: 'moncode' })}
        />
      )}

      {scanner && <ScannerQR onCode={scanne} onFermer={() => setScanner(false)} />}
    </div>
  );
}

// ───────────── ① Mon code (côté A) ─────────────

function MonCode({
  moi,
  mesDoublons,
  onScanner,
  onCodeSaisi,
  onReussi,
}: {
  moi: string;
  mesDoublons: string[];
  onScanner: () => void;
  onCodeSaisi: (code: string) => void;
  onReussi: (donne: string, recoit: string, avec: string) => void;
}) {
  const toast = useToast();
  const [mon, setMon] = useState<{ code: string; cle: string } | null>(null);
  const [etat, setEtat] = useState<EchangeServeur | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [saisie, setSaisie] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [essai, setEssai] = useState(0);
  const n = mesDoublons.length;
  const cleDoublons = mesDoublons.join(',');

  // Crée un échange (un nouveau code) dès que la page s'ouvre.
  useEffect(() => {
    if (!n) return;
    let actif = true;
    let cree: { code: string; cle: string } | null = null;
    api
      .echangeCreer(moi, cleDoublons.split(','))
      .then((r) => {
        cree = r;
        if (actif) {
          setMon(r);
          setEtat(null);
          setErreur(null);
        } else void api.echangeAnnuler(r.code, r.cle).catch(() => undefined);
      })
      .catch((e: unknown) => actif && setErreur(message(e)));
    return () => {
      actif = false;
      if (cree) {
        const { code, cle } = cree;
        void api.echangeVoir(code, cle).then((e) => {
          if (e && e.etat !== 'accepte') void api.echangeAnnuler(code, cle);
        });
      }
    };
  }, [moi, cleDoublons, n, essai]);

  // Toutes les 2 secondes : un collègue a-t-il scanné le code, ou fait une proposition ?
  useEffect(() => {
    if (!mon) return;
    const t = setInterval(() => {
      api
        .echangeVoir(mon.code, mon.cle)
        .then((e) => {
          if (e?.etat === 'annule') setEssai((x) => x + 1);
          else setEtat(e);
        })
        .catch(() => undefined);
    }, 2000);
    return () => clearInterval(t);
  }, [mon]);

  const repondre = async (accepte: boolean) => {
    if (!mon || !etat?.donne_b || !etat.recoit_b) return;
    const encore = game.getState().progress.cards.find((c) => c.cardId === etat.recoit_b);
    if (accepte && (encore?.count ?? 0) < 2) {
      toast(
        'Tu n’as plus ce doublon : refuse et laisse ton collègue choisir une autre carte.',
        'error',
      );
      return;
    }
    setEnvoi(true);
    try {
      const e = await api.echangeRepondre(mon.code, mon.cle, accepte);
      if (accepte) {
        appliquer(e.code, e.recoit_b!, e.donne_b!);
        onReussi(e.recoit_b!, e.donne_b!, e.nom_b ?? 'ton collègue');
      } else setEtat(e);
    } catch (err) {
      toast(message(err), 'error');
    } finally {
      setEnvoi(false);
    }
  };

  // Un collègue propose un échange : A accepte ou refuse.
  if (etat?.etat === 'propose' && etat.donne_b && etat.recoit_b) {
    const recue = CARTE.get(etat.donne_b)!;
    const donnee = CARTE.get(etat.recoit_b)!;
    const nouvelle = !game.getState().progress.cards.some((c) => c.cardId === recue.id);
    return (
      <section className="overflow-hidden rounded-3xl bg-navy-950 p-5 text-center text-white shadow-lift">
        <p className="eyebrow text-sun">Proposition</p>
        <h2 className="mt-1 font-display text-xl font-extrabold">
          {etat.nom_b} te propose un échange
        </h2>
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/60">
              Tu donnes
            </p>
            <div className="mx-auto aspect-[5/7] w-[120px]">
              <CardFace card={donnee} total={CARDS.length} size="sm" />
            </div>
          </div>
          <Repeat className="text-sun" />
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/60">
              Tu reçois
            </p>
            <div className="relative mx-auto aspect-[5/7] w-[120px]">
              <CardFace card={recue} total={CARDS.length} size="sm" />
              {nouvelle && <Badge vert>Nouvelle !</Badge>}
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            size="lg"
            className="border border-white/25 text-white hover:bg-white/10"
            disabled={envoi}
            onClick={() => void repondre(false)}
          >
            <X size={18} /> Refuser
          </Button>
          <Button variant="accent" size="lg" disabled={envoi} onClick={() => void repondre(true)}>
            <Check size={18} /> Accepter
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_35%,#1E4C8C,#0B2347_62%,#060F22)] px-5 pb-6 pt-5 text-center text-white shadow-lift">
        <p className="eyebrow text-sun">Mon code d’échange</p>
        <p className="mt-1 font-display text-xl font-extrabold">Montre ce code à un collègue</p>
        {n === 0 ? (
          <div className="mx-auto mt-5 max-w-xs rounded-2xl bg-white/10 px-4 py-5 text-sm text-white/85">
            Tu n’as pas encore de <b className="text-sun">doublon</b>. Seuls les doublons
            s’échangent : ouvre tes packs, ils arrivent vite !
          </div>
        ) : (
          <>
            <div className="relative mx-auto mt-5 w-[230px] rounded-[22px] bg-white p-3.5 shadow-[0_0_0_6px_rgba(245,197,66,0.4)]">
              {mon ? (
                <>
                  <img
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(renderSVG(texteQR(mon.code), { ecc: 'Q', border: 0 }))}`}
                    alt={`QR code d’échange ${mon.code}`}
                    className="block w-full [image-rendering:pixelated]"
                  />
                  <img
                    src={AVATAR}
                    alt=""
                    className="absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-0.5 shadow"
                  />
                </>
              ) : (
                <div className="grid aspect-square place-items-center text-sm text-muted">
                  {erreur ?? 'Création du code…'}
                </div>
              )}
            </div>
            {mon && (
              <p className="mt-3 font-mono text-2xl font-bold tracking-[0.3em] text-sun">
                {mon.code}
              </p>
            )}
            <p className="mx-auto mt-2 max-w-xs rounded-xl bg-white/10 px-3 py-2 text-xs text-white/85">
              📲 Ton collègue scanne ce code <b className="text-sun">depuis l’appli Team Ulysse</b>{' '}
              (Collection › Échanger une carte › Scanner), pas avec l’appareil photo.
            </p>
            <p className="mt-2 text-sm text-white/75">
              {etat?.nom_b ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                  <Hourglass size={14} className="text-sun" /> {etat.nom_b} choisit les cartes…
                </span>
              ) : (
                <>
                  <b className="text-sun">
                    {n} doublon{n > 1 ? 's' : ''}
                  </b>{' '}
                  à échanger
                </>
              )}
            </p>
          </>
        )}
      </section>

      <section className="panel space-y-3 p-5">
        <Button
          variant="accent"
          size="lg"
          className="h-13 w-full"
          onClick={onScanner}
          disabled={n === 0}
        >
          <Camera size={19} /> Scanner le code d’un collègue
        </Button>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const c = lireCode(saisie);
            if (!c) return toast('Le code fait 6 caractères.', 'error');
            if (c === mon?.code) return toast('C’est ton propre code !', 'error');
            setSaisie('');
            onCodeSaisi(c);
          }}
        >
          <input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value.toUpperCase())}
            placeholder="ou tape son code"
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 font-mono text-base uppercase tracking-[0.2em] outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/80 focus:border-blue focus:ring-4 focus:ring-blue/10"
            disabled={n === 0}
          />
          <Button variant="secondary" type="submit" disabled={n === 0 || saisie.length < 6}>
            OK
          </Button>
        </form>
        <p className="text-xs text-muted">
          Seuls les <b className="text-navy-950">doublons</b> s’échangent : tu ne perds jamais une
          carte de ta collection. Ulysse ne s’échange pas.
        </p>
      </section>
    </div>
  );
}

// ───────────── ② Choisir l'échange (côté B) ─────────────

function Badge({ children, vert }: { children: React.ReactNode; vert?: boolean }) {
  return (
    <span
      className={cx(
        'absolute -right-1.5 -top-2 z-10 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-[0_0_0_2px_#fff]',
        vert ? 'bg-success' : 'bg-navy',
      )}
    >
      {children}
    </span>
  );
}

function Mini({
  card,
  badge,
  vert,
  choisie,
  attenuee,
  onClick,
}: {
  card: Card;
  badge?: string;
  vert?: boolean;
  choisie: boolean;
  attenuee?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'relative aspect-[5/7] w-full rounded-[13px] transition-transform',
        choisie ? 'scale-[1.04] ring-[3px] ring-sun ring-offset-2' : 'hover:scale-[1.02]',
        attenuee && !choisie && 'opacity-60',
      )}
      aria-pressed={choisie}
      aria-label={card.nom}
    >
      <CardFace card={card} total={CARDS.length} size="sm" />
      {badge && <Badge vert={vert}>{badge}</Badge>}
    </button>
  );
}

function Choix({
  e,
  mesDoublons,
  possedees,
  onAnnuler,
  onProposer,
}: {
  e: EchangeServeur;
  mesDoublons: string[];
  possedees: Set<string>;
  onAnnuler: () => void;
  onProposer: (donne: string, recoit: string) => Promise<void>;
}) {
  const { progress } = useGame();
  const nombre = new Map(progress.cards.map((c) => [c.cardId, c.count]));
  const rang = (id: string) => RARITY_BY_ID[CARTE.get(id)!.rarete].rang;
  // Ses doublons : les cartes qui me manquent d'abord, puis les plus rares.
  const siens = e.doublons_a
    .filter((id) => CARTE.has(id))
    .sort((a, b) => Number(possedees.has(a)) - Number(possedees.has(b)) || rang(b) - rang(a));
  const miens = mesDoublons.filter((id) => CARTE.has(id)).sort((a, b) => rang(b) - rang(a));
  const [donne, setDonne] = useState<string | null>(null);
  const [recoit, setRecoit] = useState<string | null>(
    () => siens.find((id) => !possedees.has(id)) ?? null,
  );
  const [envoi, setEnvoi] = useState(false);
  const prenomA = e.nom_a.split(' ')[0];

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <div className="mb-3 flex items-center gap-3">
          <img src={AVATAR} alt="" className="size-10 rounded-full ring-2 ring-sun" />
          <div>
            <p className="font-display font-extrabold text-navy-950">Échange avec {e.nom_a}</p>
            <p className="text-xs text-muted">Choisis une carte de chaque côté</p>
          </div>
        </div>
        <p className="eyebrow text-muted">Tu donnes (tes doublons)</p>
        {miens.length ? (
          <div className="mt-2.5 grid grid-cols-4 gap-2.5">
            {miens.map((id) => (
              <Mini
                key={id}
                card={CARTE.get(id)!}
                badge={`×${nombre.get(id) ?? 2}`}
                choisie={donne === id}
                onClick={() => setDonne(id)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">Tu n’as plus de doublon à donner.</p>
        )}
        <div className="my-3 flex justify-center text-navy">
          <ArrowUpDown size={26} />
        </div>
        <p className="eyebrow text-muted">Tu reçois (doublons de {prenomA})</p>
        <div className="mt-2.5 grid grid-cols-4 gap-2.5">
          {siens.map((id) => (
            <Mini
              key={id}
              card={CARTE.get(id)!}
              badge={possedees.has(id) ? 'déjà' : 'Nouvelle !'}
              vert={!possedees.has(id)}
              attenuee={possedees.has(id)}
              choisie={recoit === id}
              onClick={() => setRecoit(id)}
            />
          ))}
        </div>
        {recoit && !possedees.has(recoit) && (
          <p className="mt-4 rounded-2xl bg-sun/15 px-3.5 py-2.5 text-sm text-navy-950">
            ✨ <b>{CARTE.get(recoit)!.nom}</b> est nouvelle pour toi !
          </p>
        )}
      </section>
      <div className="flex flex-col gap-2">
        <Button
          variant="accent"
          size="lg"
          className="h-13 w-full"
          disabled={!donne || !recoit || envoi}
          onClick={async () => {
            setEnvoi(true);
            await onProposer(donne!, recoit!);
            setEnvoi(false);
          }}
        >
          <Repeat size={18} /> {envoi ? 'Envoi…' : `Proposer l’échange à ${prenomA}`}
        </Button>
        <Button variant="ghost" onClick={onAnnuler}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

// ───────────── En attente de la réponse de A ─────────────

function Attente({
  code,
  cle,
  e,
  onAccepte,
  onRefus,
  onFin,
}: {
  code: string;
  cle: string;
  e: EchangeServeur;
  onAccepte: (e: EchangeServeur) => void;
  onRefus: (e: EchangeServeur) => void;
  onFin: () => void;
}) {
  const rappels = useRef({ onAccepte, onRefus, onFin });
  useEffect(() => {
    rappels.current = { onAccepte, onRefus, onFin };
  });
  useEffect(() => {
    const t = setInterval(() => {
      api
        .echangeVoir(code, cle)
        .then((r) => {
          if (!r) return;
          if (r.etat === 'accepte') rappels.current.onAccepte(r);
          else if (r.etat === 'refuse') rappels.current.onRefus(r);
          else if (r.etat === 'annule') rappels.current.onFin();
        })
        .catch(() => undefined);
    }, 2000);
    return () => clearInterval(t);
  }, [code, cle]);
  const donne = CARTE.get(e.donne_b!)!;
  const recoit = CARTE.get(e.recoit_b!)!;
  return (
    <section className="panel p-6 text-center">
      <motion.div
        className="mx-auto grid size-14 place-items-center rounded-full bg-sun/20 text-navy"
        animate={{ rotate: [0, 180, 180, 360] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        <Hourglass size={24} />
      </motion.div>
      <h2 className="mt-3 font-display text-xl font-extrabold text-navy-950">
        En attente de {e.nom_a.split(' ')[0]}…
      </h2>
      <p className="mt-1 text-sm text-muted">
        Tu donnes <b className="text-navy-950">{donne.nom}</b> et tu reçois{' '}
        <b className="text-navy-950">{recoit.nom}</b>. Ton collègue doit accepter sur son téléphone.
      </p>
      <Button variant="ghost" className="mt-4" onClick={onFin}>
        Annuler
      </Button>
    </section>
  );
}

// ───────────── ③ Échange réussi ─────────────

function Reussi({
  donne,
  recoit,
  avec,
  onCollection,
  onAutre,
}: {
  donne: string;
  recoit: string;
  avec: string;
  onCollection: () => void;
  onAutre: () => void;
}) {
  const d = CARTE.get(donne)!;
  const r = CARTE.get(recoit)!;
  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_35%,#1E4C8C,#0B2347_62%,#060F22)] px-5 pb-6 pt-6 text-center text-white shadow-lift"
      >
        <Confetti count={70} />
        <p className="eyebrow text-sun">Échange avec {avec}</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold">Échange réussi ! 🎉</h2>
        <div className="relative mx-auto mt-6 h-[220px] max-w-[300px]">
          <motion.div
            className="absolute left-0 top-6 aspect-[5/7] w-[120px]"
            initial={{ x: 90, rotate: 0, opacity: 0 }}
            animate={{ x: 0, rotate: -10, opacity: 0.85 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            <CardFace card={d} total={CARDS.length} size="sm" />
          </motion.div>
          <motion.div
            className="absolute right-0 top-0 aspect-[5/7] w-[140px]"
            initial={{ x: -90, rotate: 0, opacity: 0 }}
            animate={{ x: 0, rotate: 6, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.15 }}
          >
            <CardFace card={r} total={CARDS.length} size="sm" />
          </motion.div>
        </div>
        <p className="mt-2 text-sm text-white/85">
          Tu as donné <b>{d.nom}</b> et reçu <b className="text-sun">{r.nom}</b>.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button variant="accent" size="lg" onClick={onCollection}>
            Voir ma collection
          </Button>
          <Button
            variant="ghost"
            className="border border-white/25 text-white hover:bg-white/10"
            onClick={onAutre}
          >
            Faire un autre échange
          </Button>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

/**
 * Lien d'échange ouvert dans le navigateur (et non dans l'appli installée) : on explique comment
 * faire l'échange depuis l'appli, avec le code à taper.
 */
export function EchangeHorsAppli({ code, onContinuer }: { code: string; onContinuer: () => void }) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-5 py-10 text-center text-white"
      style={{ background: 'linear-gradient(170deg, #2563A6 0%, #153E75 45%, #0B2347 100%)' }}
    >
      <img src={AVATAR} alt="" className="size-20 rounded-full ring-4 ring-sun" />
      <p className="eyebrow mt-5 text-sun">Échange de cartes</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold">Fais l’échange dans l’appli 📲</h1>
      <div className="mt-5 w-full max-w-sm rounded-3xl bg-white p-5 text-left text-sm text-navy-950 shadow-lift">
        <ol className="space-y-2.5">
          <li>
            1. Ouvre <b>Team Ulysse</b> depuis son <b>icône</b> sur ton écran d’accueil.
          </li>
          <li>
            2. Va dans <b>Collection › Échanger une carte</b>.
          </li>
          <li>3. Tape ce code (ou scanne le QR code avec le bouton de l’appli) :</li>
        </ol>
        <p className="mt-3 rounded-2xl bg-navy-950 py-3 text-center font-mono text-3xl font-bold tracking-[0.3em] text-sun">
          {code}
        </p>
      </div>
      <button
        type="button"
        onClick={onContinuer}
        className="mt-6 text-sm font-semibold text-white/60 hover:text-white"
      >
        Je n’ai pas encore l’appli
      </button>
    </div>
  );
}
