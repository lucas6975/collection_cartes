import { ArrowLeft, Camera, Check, Hourglass, Repeat, X } from 'lucide-react';
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
import { ChargementUlysse } from '../components/ui/vivant';
import { CARDS } from '../content/cards';
import { ApiError, api, type Echange as EchangeServeur } from '../data/api';
import {
  appliquerEchange,
  correspondance,
  echangeEnCours,
  type Correspondance,
} from '../data/echangeEnCours';
import { doublons, game, manquantes, useGame } from '../data/store';
import type { Card } from '../domain/types';

const CARTE = new Map(CARDS.map((c) => [c.id, c]));
const AVATAR = `${import.meta.env.BASE_URL}ulysse-avatar.webp`;
const prenom = (nom: string | null | undefined) => (nom ?? 'ton collègue').split(' ')[0];

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
  | { k: 'reprise' }
  | { k: 'choix'; code: string; cle: string; e: EchangeServeur }
  | { k: 'attente'; code: string; cle: string; e: EchangeServeur }
  | { k: 'reussi'; donne: string; recoit: string; avec: string };

export function Echange() {
  const { progress } = useGame();
  const { prenom: p, nom } = useNomCartePerso();
  const moi = `${p} ${nom}`.trim();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [vue, setVue] = useState<Vue>(() =>
    echangeEnCours.get()?.role === 'b' ? { k: 'reprise' } : { k: 'moncode' },
  );
  const [scanner, setScanner] = useState(false);
  const mesDoublons = doublons(progress);

  const reussi = useCallback((donne: string, recoit: string, avec: string) => {
    echangeEnCours.set(null);
    setVue({ k: 'reussi', donne, recoit, avec });
  }, []);

  // Retour sur l'onglet : on reprend l'échange commencé en scannant le code d'un collègue.
  useEffect(() => {
    const en = echangeEnCours.get();
    if (en?.role !== 'b') return;
    api
      .echangeVoir(en.code, en.cle)
      .then((e) => {
        if (!e || e.etat === 'annule') {
          echangeEnCours.set(null);
          return setVue({ k: 'moncode' });
        }
        if (e.etat === 'accepte') {
          appliquerEchange(e.code, e.donne_b!, e.recoit_b!);
          return reussi(e.donne_b!, e.recoit_b!, e.nom_a);
        }
        setVue({ k: e.etat === 'propose' ? 'attente' : 'choix', code: en.code, cle: en.cle, e });
      })
      .catch(() => setVue({ k: 'moncode' }));
  }, [reussi]);

  // B : rejoindre l'échange d'un collègue à partir de son code.
  const rejoindre = useCallback(
    async (code: string) => {
      try {
        const pr = game.getState().progress;
        const r = await api.echangeRejoindre(code, moi, doublons(pr), manquantes(pr));
        const { cle, ...e } = r;
        echangeEnCours.set({ role: 'b', code, cle, depuis: Date.now() });
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

  const annulerB = (code: string, cle: string) => {
    void api.echangeAnnuler(code, cle).catch(() => undefined);
    echangeEnCours.set(null);
    setVue({ k: 'moncode' });
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
          <h1 className="font-display text-2xl font-extrabold text-navy-950">
            {vue.k === 'choix' || vue.k === 'attente'
              ? `Échange avec ${prenom(vue.e.nom_a)}`
              : 'Échanger une carte'}
          </h1>
        </div>
      </div>

      {vue.k === 'reprise' && <ChargementUlysse texte="Reprise de ton échange…" />}

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
          onAnnuler={() => annulerB(vue.code, vue.cle)}
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
            toast(`${prenom(e.nom_a)} a refusé : choisis un autre échange.`, 'info');
            setVue({ k: 'choix', code: vue.code, cle: vue.cle, e });
          }}
          onAccepte={(e) => {
            appliquerEchange(e.code, e.donne_b!, e.recoit_b!);
            reussi(e.donne_b!, e.recoit_b!, e.nom_a);
          }}
          onAnnuler={() => annulerB(vue.code, vue.cle)}
          onFin={() => {
            toast('L’échange a été annulé.', 'info');
            echangeEnCours.set(null);
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

// ───────────── Ce qui arrange chacun ─────────────

function Rangee({ ids, vide }: { ids: string[]; vide: string }) {
  if (!ids.length) return <p className="mt-1.5 text-xs text-muted">{vide}</p>;
  return (
    <div className="mt-2 grid grid-cols-4 gap-2">
      {ids.map((id) => (
        <div key={id} className="aspect-[5/7]">
          <CardFace card={CARTE.get(id)!} total={CARDS.length} size="sm" />
        </div>
      ))}
    </div>
  );
}

/** Les deux colonnes de la maquette : ce que l'autre peut me donner, ce que je peux lui donner. */
function CeQuiArrange({ c, avec }: { c: Correspondance; avec: string }) {
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl bg-success/10 p-3">
        <p className="flex items-center justify-between text-sm font-extrabold text-navy-950">
          🎁 {avec} peut te donner
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-success">
            te manquent
          </span>
        </p>
        <Rangee ids={c.pourMoi} vide={`${avec} n’a aucun doublon qui te manque.`} />
      </div>
      <div className="rounded-2xl bg-blue-light p-3">
        <p className="flex items-center justify-between text-sm font-extrabold text-navy-950">
          🤝 Tu peux donner à {avec}
          {c.connu && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-blue">
              lui manquent
            </span>
          )}
        </p>
        <Rangee
          ids={c.pourLui}
          vide={
            c.connu
              ? `Aucun de tes doublons ne manque à ${avec}.`
              : 'Tu n’as pas de doublon à donner.'
          }
        />
      </div>
    </div>
  );
}

// ───────────── ① Mon code (côté A) ─────────────

/** Création de code en cours : évite d'en créer deux en même temps. */
let creation: Promise<{ code: string; cle: string }> | null = null;

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
  const { progress } = useGame();
  const [mon, setMon] = useState<{ code: string; cle: string } | null>(null);
  const [etat, setEtat] = useState<EchangeServeur | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [saisie, setSaisie] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [essai, setEssai] = useState(0);
  const n = mesDoublons.length;
  const nManquantes = manquantes(progress).length;
  const possedees = new Set(progress.cards.map((c) => c.cardId));

  // Un code : celui déjà ouvert sur ce téléphone (on ne le perd plus en changeant d'onglet),
  // sinon un nouveau.
  useEffect(() => {
    if (!n) return;
    let actif = true;
    const en = echangeEnCours.get();
    const creer = () => {
      if (!creation) {
        const pr = game.getState().progress;
        creation = api
          .echangeCreer(moi, doublons(pr), manquantes(pr))
          .then((r) => {
            if (echangeEnCours.get()?.role !== 'b')
              echangeEnCours.set({ role: 'a', ...r, depuis: Date.now() });
            return r;
          })
          .finally(() => {
            creation = null;
          });
      }
      return creation;
    };
    const reprendre =
      en?.role === 'a' && essai === 0
        ? api
            .echangeVoir(en.code, en.cle)
            .then((e) => (e && e.etat !== 'annule' && e.etat !== 'accepte' ? en : creer()))
            .catch(() => creer())
        : creer();
    reprendre
      .then((r) => {
        if (!actif) return;
        setMon({ code: r.code, cle: r.cle });
        setEtat(null);
        setErreur(null);
      })
      .catch((e: unknown) => actif && setErreur(message(e)));
    return () => {
      actif = false;
    };
  }, [moi, n, essai]);

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
        appliquerEchange(e.code, e.recoit_b!, e.donne_b!);
        onReussi(e.recoit_b!, e.donne_b!, e.nom_b ?? 'ton collègue');
      } else setEtat(e);
    } catch (err) {
      toast(message(err), 'error');
    } finally {
      setEnvoi(false);
    }
  };

  const c =
    etat?.nom_b && correspondance(mesDoublons, possedees, etat.doublons_b, etat.manquantes_b);

  // Un collègue propose un échange : A accepte ou refuse.
  if (etat?.etat === 'propose' && etat.donne_b && etat.recoit_b) {
    const recue = CARTE.get(etat.donne_b)!;
    const donnee = CARTE.get(etat.recoit_b)!;
    const nouvelle = !possedees.has(recue.id);
    return (
      <div className="space-y-4">
        <section className="overflow-hidden rounded-3xl bg-navy-950 p-5 text-center text-white shadow-lift">
          <p className="eyebrow text-sun">Proposition</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">
            {prenom(etat.nom_b)} te propose un échange
          </h2>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <p className="mb-2 text-xs font-bold tracking-wide text-white/60 uppercase">
                Tu donnes
              </p>
              <div className="mx-auto aspect-[5/7] w-[120px]">
                <CardFace card={donnee} total={CARDS.length} size="sm" />
              </div>
            </div>
            <Repeat className="text-sun" />
            <div>
              <p className="mb-2 text-xs font-bold tracking-wide text-white/60 uppercase">
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
        {c && (
          <section className="panel p-4">
            <p className="eyebrow mb-2.5">Ce qui vous arrange aussi</p>
            <CeQuiArrange c={c} avec={prenom(etat.nom_b)} />
            <p className="mt-3 text-xs text-muted">
              Tu préfères une autre carte ? Refuse : {prenom(etat.nom_b)} pourra te proposer autre
              chose.
            </p>
          </section>
        )}
      </div>
    );
  }

  // Un collègue a scanné le code et choisit : A voit déjà ce qui l'arrange.
  if (c && etat?.nom_b) {
    return (
      <div className="space-y-4">
        <section className="panel p-4">
          <div className="mb-3 flex items-center gap-3">
            <img src={AVATAR} alt="" className="size-10 rounded-full ring-2 ring-sun" />
            <div className="min-w-0 flex-1">
              <p className="font-display font-extrabold text-navy-950">
                {etat.nom_b} a scanné ton code
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Hourglass size={12} className="text-sun-dark" /> Il choisit l’échange à te
                proposer…
              </p>
            </div>
          </div>
          <CeQuiArrange c={c} avec={prenom(etat.nom_b)} />
        </section>
        <p className="text-center text-xs text-muted">
          Tu peux changer d’onglet : l’échange reste ouvert et une bannière te prévient.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_35%,#1E4C8C,#0B2347_62%,#060F22)] px-5 pt-5 pb-6 text-center text-white shadow-lift">
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
                    className="absolute top-1/2 left-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-0.5 shadow"
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
          </>
        )}
      </section>

      {n > 0 && (
        <section className="panel p-4">
          <p className="eyebrow">Ce que je partage</p>
          <p className="mt-1.5 text-sm text-navy-950">
            🔁 <b>{n}</b> doublon{n > 1 ? 's' : ''} à donner · 🔍 <b>{nManquantes}</b> carte
            {nManquantes > 1 ? 's' : ''} qui me manque{nManquantes > 1 ? 'nt' : ''}
          </p>
          <p className="mt-1 text-xs text-muted">
            Envoyés avec ton code : ton collègue voit tout de suite ce qui vous arrange.
          </p>
        </section>
      )}

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
            const code = lireCode(saisie);
            if (!code) return toast('Le code fait 6 caractères.', 'error');
            if (code === mon?.code) return toast('C’est ton propre code !', 'error');
            setSaisie('');
            onCodeSaisi(code);
          }}
        >
          <input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value.toUpperCase())}
            placeholder="ou tape son code"
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 font-mono text-base tracking-[0.2em] uppercase outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-muted/80 placeholder:normal-case focus:border-blue focus:ring-4 focus:ring-blue/10"
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
  onAnnuler,
  onProposer,
}: {
  e: EchangeServeur;
  onAnnuler: () => void;
  onProposer: (donne: string, recoit: string) => Promise<void>;
}) {
  const { progress } = useGame();
  const nombre = new Map(progress.cards.map((c) => [c.cardId, c.count]));
  const possedees = new Set(progress.cards.map((c) => c.cardId));
  const mesDoublons = doublons(progress);
  const c = correspondance(mesDoublons, possedees, e.doublons_a, e.manquantes_a);
  const avec = prenom(e.nom_a);
  // Sans correspondance, on peut quand même voir tous les doublons (et faire plaisir).
  const [tout, setTout] = useState(false);
  const recevables = tout
    ? correspondance(mesDoublons, new Set(), e.doublons_a, undefined).pourMoi
    : c.pourMoi;
  const donnables = tout
    ? correspondance(mesDoublons, possedees, [], undefined).pourLui
    : c.pourLui;
  const [donne, setDonne] = useState<string | null>(() => c.pourLui.at(-1) ?? null);
  const [recoit, setRecoit] = useState<string | null>(() => c.pourMoi[0] ?? null);
  const [envoi, setEnvoi] = useState(false);
  const match = c.pourMoi.length > 0 && c.pourLui.length > 0;

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <div className="mb-3 flex items-center gap-3">
          <img src={AVATAR} alt="" className="size-10 rounded-full ring-2 ring-sun" />
          <div className="min-w-0 flex-1">
            <p className="font-display font-extrabold text-navy-950">{e.nom_a}</p>
            <p className="text-xs text-muted">Touche une carte de chaque côté</p>
          </div>
          <span
            className={cx(
              'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold',
              match ? 'bg-success/15 text-success' : 'bg-sun/25 text-navy-950',
            )}
          >
            {match ? '✅ Ça matche !' : '🤔 Pas de match'}
          </span>
        </div>

        {!match && !tout && (
          <div className="mb-3 rounded-2xl bg-sun/15 px-3.5 py-3 text-sm text-navy-950">
            {c.pourMoi.length === 0
              ? `${avec} n’a aucun doublon qui te manque.`
              : `Aucun de tes doublons ne manque à ${avec}.`}{' '}
            Vous pouvez quand même échanger pour vous faire plaisir.
            <button
              type="button"
              className="mt-2 block font-bold text-blue underline"
              onClick={() => setTout(true)}
            >
              Voir tous les doublons
            </button>
          </div>
        )}

        <div className="rounded-2xl bg-success/10 p-3">
          <p className="flex items-center justify-between text-sm font-extrabold text-navy-950">
            🎁 {avec} peut te donner
            {!tout && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-success">
                te manquent
              </span>
            )}
          </p>
          {recevables.length ? (
            <div className="mt-2.5 grid grid-cols-4 gap-2.5">
              {recevables.map((id) => (
                <Mini
                  key={id}
                  card={CARTE.get(id)!}
                  badge={possedees.has(id) ? 'déjà' : 'Nouvelle !'}
                  vert={!possedees.has(id)}
                  choisie={recoit === id}
                  onClick={() => setRecoit(id)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-muted">Rien de ce côté.</p>
          )}
        </div>

        <div className="mt-2.5 rounded-2xl bg-blue-light p-3">
          <p className="flex items-center justify-between text-sm font-extrabold text-navy-950">
            🤝 Tu peux donner à {avec}
            {!tout && c.connu && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-blue">
                lui manquent
              </span>
            )}
          </p>
          {donnables.length ? (
            <div className="mt-2.5 grid grid-cols-4 gap-2.5">
              {donnables.map((id) => (
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
            <p className="mt-1.5 text-xs text-muted">Rien de ce côté.</p>
          )}
        </div>
        {!tout && (
          <p className="mt-2.5 text-[11px] text-muted">
            Les cartes que vous avez déjà tous les deux sont cachées.
          </p>
        )}
      </section>

      <section className="panel p-4">
        <p className="eyebrow">Ton échange</p>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div>
            <div className="mx-auto aspect-[5/7] w-[86px]">
              {donne ? (
                <CardFace card={CARTE.get(donne)!} total={CARDS.length} size="sm" />
              ) : (
                <span className="grid size-full place-items-center rounded-xl border-2 border-dashed border-line text-2xl text-muted">
                  ?
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs font-semibold text-muted">tu donnes</p>
          </div>
          <Repeat className="text-blue" />
          <div>
            <div className="mx-auto aspect-[5/7] w-[86px]">
              {recoit ? (
                <CardFace card={CARTE.get(recoit)!} total={CARDS.length} size="sm" />
              ) : (
                <span className="grid size-full place-items-center rounded-xl border-2 border-dashed border-line text-2xl text-muted">
                  ?
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs font-semibold text-muted">tu reçois</p>
          </div>
        </div>
        <Button
          variant="accent"
          size="lg"
          className="mt-4 h-13 w-full"
          disabled={!donne || !recoit || envoi}
          onClick={async () => {
            setEnvoi(true);
            await onProposer(donne!, recoit!);
            setEnvoi(false);
          }}
        >
          <Repeat size={18} /> {envoi ? 'Envoi…' : `Proposer à ${avec}`}
        </Button>
        <Button variant="ghost" className="mt-1 w-full" onClick={onAnnuler}>
          Annuler l’échange
        </Button>
      </section>
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
  onAnnuler,
  onFin,
}: {
  code: string;
  cle: string;
  e: EchangeServeur;
  onAccepte: (e: EchangeServeur) => void;
  onRefus: (e: EchangeServeur) => void;
  onAnnuler: () => void;
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
        En attente de {prenom(e.nom_a)}…
      </h2>
      <p className="mt-1 text-sm text-muted">
        Tu donnes <b className="text-navy-950">{donne.nom}</b> et tu reçois{' '}
        <b className="text-navy-950">{recoit.nom}</b>. Ton collègue doit accepter sur son téléphone.
      </p>
      <p className="mt-3 rounded-xl bg-blue-light px-3 py-2 text-xs text-navy-950">
        Tu peux changer d’onglet : l’échange continue, et ta collection se met à jour toute seule.
      </p>
      <Button variant="ghost" className="mt-3" onClick={onAnnuler}>
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
