// ESPACE SÉCURITÉ, EN TEST : visible uniquement avec le code administrateur.
// Trois onglets : les SST du site, la remontée de situation à risque, la conduite en cas d'accident.
// Rien n'est encore envoyé : la remontée reste sur ce téléphone pendant le test.
import {
  AlertTriangle,
  ArrowRight,
  BookUser,
  ChevronLeft,
  HeartPulse,
  MapPin,
  MessagesSquare,
  Phone,
  Plus,
  ShieldAlert,
  Siren,
  UserPlus,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { PAGE_TOURNE } from '../components/ui/tourne';
import { ChargementUlysse } from '../components/ui/vivant';
import { Button, cx } from '../components/ui/primitives';
import { ApiError, api, type ContactSst } from '../data/api';
import { bravoStore } from '../data/bravo';
import { useAccesSecurite } from '../data/accesSecurite';
import { useIdentite } from '../data/identite';
import { COULEUR_EPS, OngletEps } from './Eps';

type Onglet = 'sst' | 'remontee' | 'accident' | 'urgences' | 'eps';

const BASE = import.meta.env.BASE_URL;
const COULEUR: Record<Onglet, { fond: string; vif: string; doux: string }> = {
  accident: {
    fond: 'linear-gradient(150deg, #E5384A 0%, #B3202F 50%, #6E0D1A 100%)',
    vif: '#C8283A',
    doux: '#FDECEE',
  },
  sst: {
    fond: 'linear-gradient(150deg, #2BB673 0%, #138A55 50%, #0A4F31 100%)',
    vif: '#138A55',
    doux: '#E8F7EF',
  },
  remontee: {
    fond: 'linear-gradient(150deg, #3D7FD6 0%, #1F5AA6 50%, #0B2347 100%)',
    vif: '#1F5AA6',
    doux: '#EAF2FD',
  },
  urgences: {
    fond: 'linear-gradient(150deg, #2A4A86 0%, #172E5C 55%, #0B1A36 100%)',
    vif: '#172E5C',
    doux: '#EEF1F6',
  },
  eps: COULEUR_EPS,
};

/** Bandeau illustré en haut de chaque onglet. */
function Bandeau({
  onglet,
  image,
  eyebrow,
  titre,
  texte,
  decor,
  children,
}: {
  onglet: Onglet;
  image?: string;
  eyebrow: string;
  titre: string;
  texte?: string;
  decor?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lift"
      style={{ background: COULEUR[onglet].fond }}
    >
      {image && (
        <img
          src={`${BASE}${image}`}
          alt=""
          className="absolute inset-0 size-full object-cover object-right opacity-80"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(100deg, ${COULEUR[onglet].vif}F5 0%, ${COULEUR[onglet].vif}CC 45%, ${COULEUR[onglet].vif}33 100%)`,
        }}
      />
      {decor}
      <div className="relative">
        <p className="eyebrow text-white/80">{eyebrow}</p>
        <h2 className="mt-1 max-w-[80%] font-display text-[26px] leading-tight font-extrabold drop-shadow-[0_2px_8px_rgba(0,0,0,.25)]">
          {titre}
        </h2>
        {texte && <p className="mt-1.5 max-w-[78%] text-sm text-white/90">{texte}</p>}
        {children}
      </div>
    </section>
  );
}

/** Motif de croix de secours (onglet SST). */
const MotifCroix = () => (
  <svg className="pointer-events-none absolute inset-0 size-full opacity-[.12]" aria-hidden>
    <defs>
      <pattern id="croix" width="46" height="46" patternUnits="userSpaceOnUse">
        <path d="M18 8h10v10h10v10H28v10H18V28H8V18h10z" fill="#fff" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#croix)" />
  </svg>
);

/** Ligne de battement de cœur animée (onglet SST). */
const Pouls = () => (
  <svg
    viewBox="0 0 300 60"
    className="sec-pouls pointer-events-none absolute right-0 bottom-3 w-[70%] opacity-80"
    aria-hidden
  >
    <path
      d="M0 34 H90 L104 34 L114 10 L126 54 L136 22 L144 34 H300"
      fill="none"
      stroke="#fff"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Gyrophare : rayons lumineux qui tournent (onglet Accident). */
const Gyrophare = () => (
  <div className="pointer-events-none absolute -top-24 -right-24 size-72" aria-hidden>
    <div className="sec-gyro size-full rounded-full" />
  </div>
);

/** Grand panneau « danger » (onglet Situation à risque). */
const Panneau = () => (
  <svg
    viewBox="0 0 100 90"
    className="pointer-events-none absolute top-4 right-4 w-20 drop-shadow-[0_6px_10px_rgba(0,0,0,.35)]"
    aria-hidden
  >
    <path
      d="M50 4 L96 84 H4 Z"
      fill="#F5C542"
      stroke="#15171C"
      strokeWidth="6"
      strokeLinejoin="round"
    />
    <rect x="46" y="30" width="8" height="30" rx="3" fill="#15171C" />
    <circle cx="50" cy="70" r="5" fill="#15171C" />
  </svg>
);

type Vue = 'accueil' | Onglet;

const CARTES: {
  id: Onglet;
  titre: string;
  sous: string;
  icone: typeof Siren;
  image?: string;
}[] = [
  {
    id: 'accident',
    titre: 'Accident',
    sous: 'Quelqu’un est blessé',
    icone: Siren,
  },
  {
    id: 'sst',
    titre: 'SST',
    sous: 'Sauveteurs secouristes',
    icone: Plus,
    image: 'securite-sst.webp',
  },
  {
    id: 'remontee',
    titre: 'Situation à risque',
    sous: 'Remontée de situation à risque',
    icone: AlertTriangle,
    image: 'securite-risque.webp',
  },
  {
    id: 'urgences',
    titre: 'Numéros d’urgence',
    sous: '15 · 18 · 112 · 114',
    icone: Phone,
  },
  {
    id: 'eps',
    titre: 'EPS',
    sous: 'Échange Périodique de Sécurité',
    icone: MessagesSquare,
  },
];

const TITRES: Record<Onglet, string> = {
  accident: 'Accident',
  sst: 'SST',
  remontee: 'Situation à risque',
  urgences: 'Numéros d’urgence',
  eps: 'EPS',
};

export function Securite() {
  const { codeAdmin, identite } = useIdentite();
  const acces = useAccesSecurite();
  const navigate = useNavigate();
  // La notification « Nouvelle EPS » ouvre directement l'onglet EPS (#/securite?vue=eps).
  const [params] = useSearchParams();
  const [vue, setVue] = useState<Vue>(() => (params.get('vue') === 'eps' ? 'eps' : 'accueil'));
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [vue]);
  if (acces === false) return <Navigate to="/" replace />;
  if (acces === null) return <ChargementUlysse texte="Ulysse ouvre l’espace Sécurité…" />;

  return (
    <div className="relative mx-auto max-w-2xl">
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-colors duration-500"
        style={{ background: vue === 'accueil' ? '#EEF1F6' : COULEUR[vue].doux }}
        aria-hidden
      />
      <header className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (vue === 'accueil' ? navigate('/') : setVue('accueil'))}
          aria-label="Retour"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-navy-950 shadow-soft"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-[28px] leading-tight font-extrabold text-navy-950">
            {vue === 'accueil' ? 'Espace Sécurité' : TITRES[vue]}
          </h1>
          <p className="text-[15px] text-muted">
            {vue === 'accueil' ? 'Choisis ce dont tu as besoin' : 'Espace Sécurité'}
          </p>
        </div>
      </header>

      <motion.div
        key={vue}
        initial={vue === 'accueil' ? false : PAGE_TOURNE.initial}
        animate={PAGE_TOURNE.animate}
        transition={PAGE_TOURNE.transition}
        style={PAGE_TOURNE.style}
      >
        {vue === 'accueil' && (
          <>
            <Accueil onChoisir={setVue} />
            <Link
              to="/remontees"
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-navy-950 text-base font-extrabold text-white shadow-soft"
            >
              📥 Suivi des remontées reçues
            </Link>
          </>
        )}
        {vue === 'accident' && <OngletAccident onSst={() => setVue('sst')} />}
        {vue === 'sst' && <OngletSst code={codeAdmin} jeton={identite?.jeton ?? null} />}
        {vue === 'remontee' && <OngletRemontee />}
        {vue === 'urgences' && <GrilleUrgences titre="Appeler les secours" />}
        {vue === 'eps' && <OngletEps code={codeAdmin} jeton={identite?.jeton ?? null} />}
      </motion.div>
    </div>
  );
}

/** Couleurs vives des cartes de l'accueil : fond doux, accent foncé lisible. */
export const PASTEL: Record<Onglet, { fond: string; bord: string; texte: string; accent: string }> =
  {
    accident: { fond: '#D63A46', bord: '#B82A36', texte: '#FFFFFF', accent: '#8E1424' },
    sst: { fond: '#1F9A63', bord: '#178151', texte: '#FFFFFF', accent: '#0F5C3A' },
    remontee: { fond: '#2E6ED0', bord: '#245CB3', texte: '#FFFFFF', accent: '#163E80' },
    urgences: { fond: '#5A45C2', bord: '#4A37A6', texte: '#FFFFFF', accent: '#2F2178' },
    eps: { fond: '#14918B', bord: '#0F7F7A', texte: '#FFFFFF', accent: '#08403E' },
  };

/** Ulysse en situation, pour chaque rubrique (illustrations officielles). */
export const LOGO: Record<Onglet, string> = {
  accident: 'securite/accident.webp',
  sst: 'securite/sst.webp',
  remontee: 'securite/risque.webp',
  urgences: 'securite/urgences.webp',
  eps: 'mascotte.webp',
};

/** Illustration de fond de chaque carte et cadrage. */
const FOND: Partial<Record<Onglet, { image: string; position: string }>> = {
  accident: { image: 'securite/fond-accident.webp', position: '70% 30%' },
  sst: { image: 'securite/fond-sst.webp', position: '75% 35%' },
  remontee: { image: 'securite/fond-risque.webp', position: '85% 60%' },
  urgences: { image: 'securite/fond-urgences.webp', position: '70% 50%' },
};

/** Petite animation propre à chaque carte. */
function AnimCarte({ id }: { id: Onglet }) {
  const c = '#FFFFFF';
  if (id === 'accident')
    return (
      <span className="pointer-events-none absolute inset-y-0 right-0 w-1/2" aria-hidden>
        <span className="sc-gyro-r absolute -top-6 right-10 size-28 rounded-full bg-[#ff4d5e] blur-2xl" />
        <span className="sc-gyro-b absolute -top-6 right-0 size-28 rounded-full bg-[#4d8dff] blur-2xl" />
      </span>
    );
  if (id === 'sst')
    return (
      <svg
        viewBox="0 0 300 60"
        className="sec-pouls pointer-events-none absolute right-0 bottom-2 w-[62%]"
        aria-hidden
      >
        <path
          d="M0 34 H90 L104 34 L114 10 L126 54 L136 22 L144 34 H300"
          fill="none"
          stroke={c}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (id === 'eps')
    return (
      <svg
        viewBox="0 0 200 80"
        className="pointer-events-none absolute right-16 bottom-3 w-[46%] opacity-90"
        aria-hidden
      >
        <path
          d="M4 8 C 50 50, 110 66, 196 72"
          fill="none"
          stroke="#F5C542"
          strokeWidth="4"
          strokeLinecap="round"
          className="sc-courbe"
        />
        <polygon
          points="120,52 124,61 134,61 126,67 129,76 120,70 111,76 114,67 106,61 116,61"
          fill="#F5C542"
          stroke="#08403E"
          strokeWidth="2"
          className="sc-etoile"
        />
      </svg>
    );
  if (id === 'remontee')
    return (
      <span className="sc-bande pointer-events-none absolute inset-x-0 bottom-0 h-2" aria-hidden />
    );
  return (
    <span className="pointer-events-none absolute top-1/2 right-16 size-0" aria-hidden>
      {[0, 0.6, 1.2].map((d) => (
        <span
          key={d}
          className="sc-onde absolute -top-10 -left-10 size-20 rounded-full border-[3px]"
          style={{ borderColor: c, animationDelay: `${d}s` }}
        />
      ))}
    </span>
  );
}

function Accueil({ onChoisir }: { onChoisir: (v: Onglet) => void }) {
  return (
    <div className="space-y-3.5">
      <div className="flex items-end gap-3">
        <img src={`${BASE}mascotte.webp`} alt="" className="h-24 w-auto shrink-0" />
        <p className="mb-3 rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-sm font-semibold text-navy-950 shadow-soft">
          En cas de besoin, tout est ici. Je veille ! 🦺
        </p>
      </div>
      {CARTES.map((c) => {
        const t = PASTEL[c.id];
        const f = FOND[c.id];
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChoisir(c.id)}
            className="relative flex min-h-[118px] w-full items-center gap-4 overflow-hidden rounded-[26px] border p-5 text-left shadow-soft transition-transform active:scale-[0.98]"
            style={{ background: t.fond, borderColor: t.bord, color: t.texte }}
          >
            {f ? (
              <img
                src={`${BASE}${f.image}`}
                alt=""
                className="absolute inset-0 size-full object-cover"
                style={{ objectPosition: f.position }}
              />
            ) : (
              <img
                src={`${BASE}mascotte.webp`}
                alt=""
                className="absolute -right-2 -bottom-3 h-[128px] w-auto"
              />
            )}
            <span
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, ${t.fond} 0%, ${t.fond}F2 35%, ${t.fond}B3 55%, ${t.fond}40 85%, ${t.fond}1A 100%)`,
              }}
            />
            <AnimCarte id={c.id} />
            <span className="relative min-w-0 flex-1 pr-24">
              <b className="block font-display text-[24px] leading-tight font-extrabold tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.35)]">
                {c.titre}
              </b>
              <span className="block max-w-[80%] text-[14px] font-semibold text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,.35)]">
                {c.sous}
              </span>
            </span>
            <span
              className="relative grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,.25)]"
              style={{ color: t.fond }}
            >
              <ArrowRight size={19} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Les numéros d'urgence, en gros boutons rouges. */
function GrilleUrgences({ titre, seulement }: { titre: string; seulement?: string[] }) {
  return (
    <section className="panel p-4">
      <p className="eyebrow mb-3 flex items-center gap-2 text-[#C8283A]">
        <Phone size={16} className="text-navy-950" /> {titre}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {URGENCES.filter((u) => !seulement || seulement.includes(u.num)).map((u) => (
          <a
            key={u.num}
            href={u.sms ? `sms:${u.num}` : `tel:${u.num}`}
            className="vi-elastique relative flex flex-col overflow-hidden rounded-2xl p-3.5 text-white shadow-[0_8px_18px_rgba(200,40,58,.35)]"
            style={{ background: COULEUR.accident.fond }}
          >
            <Phone size={64} className="absolute -right-3 -bottom-3 rotate-12 text-white/15" />
            <span className="font-display text-[40px] leading-none font-extrabold">{u.num}</span>
            <span className="mt-1.5 text-lg font-bold">{u.nom}</span>
            <span className="text-sm text-white/85">{u.quand}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

// ───────────── En cas d'accident ─────────────

const URGENCES = [
  { num: '15', nom: 'SAMU', quand: 'Urgence médicale' },
  { num: '18', nom: 'Pompiers', quand: 'Incendie, accident, victime' },
  { num: '112', nom: 'Urgences', quand: 'Numéro européen, depuis tout téléphone' },
  { num: '114', nom: 'Par SMS', quand: 'Si tu ne peux pas parler ou entendre', sms: true },
];

function OngletAccident({ onSst }: { onSst: () => void }) {
  return (
    <div className="space-y-4">
      <Bandeau
        onglet="accident"
        eyebrow="🚨 Tu es témoin d’un accident"
        titre="Protéger · Alerter · Secourir"
        decor={<Gyrophare />}
      >
        <ol className="mt-4 space-y-3">
          {[
            [
              '1',
              'Protéger',
              'Supprime le danger (arrêt machine, balisage) sans te mettre en danger.',
            ],
            [
              '2',
              'Alerter',
              'Appelle un SST du site et les secours. Dis où, quoi, combien de victimes.',
            ],
            [
              '3',
              'Secourir',
              'Reste avec la victime, rassure-la, et suis les consignes des secours.',
            ],
          ].map(([n, t, d]) => (
            <li key={n} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white font-display font-extrabold text-[#C8283A]">
                {n}
              </span>
              <span>
                <b className="font-display text-[17px]">{t}</b>
                <span className="block text-sm text-white/85">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </Bandeau>

      <GrilleUrgences titre="Appeler les secours" />
      <section className="panel p-4">
        <button
          type="button"
          onClick={onSst}
          className="vi-elastique flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white"
          style={{ background: COULEUR.sst.fond }}
        >
          <HeartPulse size={17} /> Appeler un SST du site
        </button>
      </section>

      <section className="panel p-4">
        <p className="eyebrow mb-2">Ensuite</p>
        <ul className="space-y-2 text-sm text-navy-950">
          <li>📍 Envoie quelqu’un accueillir les secours à l’entrée du site.</li>
          <li>🗣️ Préviens ton responsable dès que possible.</li>
          <li>📝 Tout accident, même léger, doit être déclaré.</li>
          <li>🚫 Ne déplace pas la victime, sauf danger immédiat.</li>
        </ul>
      </section>
    </div>
  );
}

// ───────────── SST ─────────────

const telLien = (t: string) => {
  const chiffres = t.replace(/[^\d+]/g, '');
  return chiffres.startsWith('0') ? `+33${chiffres.slice(1)}` : chiffres;
};

/** Fiche contact (.vcf) : le téléphone propose de l'ajouter à ses contacts. */
function ficheContact(c: ContactSst) {
  const vcf = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${c.nom};${c.prenom};;;`,
    `FN:${c.prenom} ${c.nom}`,
    `TITLE:${c.role}${c.lieu ? ` (${c.lieu})` : ''}`,
    'ORG:IMECA',
    `TEL;TYPE=CELL:${telLien(c.telephone)}`,
    'END:VCARD',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${c.prenom}-${c.nom}.vcf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function OngletSst({ code, jeton }: { code: string | null; jeton: string | null }) {
  const [contacts, setContacts] = useState<ContactSst[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    api
      .securiteSst(code, jeton)
      .then(setContacts)
      .catch((e: unknown) =>
        setErreur(
          e instanceof ApiError
            ? `${e.message} (as-tu lancé supabase/maj-securite-test.sql ?)`
            : 'Erreur de chargement',
        ),
      );
  }, [code, jeton]);

  return (
    <div className="space-y-4">
      <Bandeau
        onglet="sst"
        image="securite-sst.webp"
        eyebrow="➕ Sauveteurs secouristes du travail"
        titre="Les SST du site"
        texte="Formés aux premiers secours, ils interviennent en attendant les secours. Un toucher pour les appeler."
        decor={
          <>
            <MotifCroix />
            <Pouls />
          </>
        }
      >
        <div className="h-8" />
      </Bandeau>

      {erreur && (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {erreur}
        </p>
      )}
      {!contacts && !erreur && <ChargementUlysse texte="Ulysse cherche les SST…" />}
      {contacts?.length === 0 && (
        <p className="panel p-4 text-sm text-muted">Aucun SST enregistré pour l’instant.</p>
      )}

      {contacts?.map((c) => (
        <section
          key={`${c.prenom}${c.nom}`}
          className="panel border-l-[6px] p-4"
          style={{ borderLeftColor: COULEUR.sst.vif }}
        >
          <div className="flex items-center gap-3">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-2xl font-display text-lg font-extrabold text-white shadow-[0_6px_14px_rgba(19,138,85,.35)]"
              style={{ background: COULEUR.sst.fond }}
            >
              {c.prenom[0]}
              {c.nom[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-extrabold text-navy-950">
                {c.prenom} {c.nom}
              </p>
              {c.lieu && (
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
                  <MapPin size={12} strokeWidth={2.6} /> {c.lieu}
                </p>
              )}
              <p className="mt-1 text-xs font-semibold text-muted">{c.role}</p>
              <p className="text-sm text-muted">{c.telephone}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={`tel:${telLien(c.telephone)}`}
              className="vi-elastique inline-flex h-11 items-center justify-center gap-2 rounded-xl font-semibold text-white"
              style={{ background: COULEUR.sst.fond }}
            >
              <Phone size={16} /> Appeler
            </a>
            <Button variant="secondary" onClick={() => ficheContact(c)}>
              <UserPlus size={16} /> Fiche contact
            </Button>
          </div>
        </section>
      ))}

      <GrilleUrgences titre="Pas de SST ? Appelle" seulement={['15', '18']} />

      <section className="panel p-4">
        <p className="eyebrow mb-2">Bon à savoir</p>
        <ul className="space-y-2 text-sm text-navy-950">
          <li>
            <BookUser size={14} className="mr-1 inline text-blue" /> « Fiche contact » ajoute le SST
            à tes contacts : tu l’auras même sans l’appli.
          </li>
          <li>🧰 Trousses de secours et défibrillateur : emplacements à compléter.</li>
          <li>🎓 Envie de devenir SST ? Parles-en à ton responsable.</li>
        </ul>
      </section>
    </div>
  );
}

// ───────────── Remontée de situation à risque ─────────────
// La remontée est enregistrée dans la base, et une notification part sur les téléphones choisis
// (supabase/maj-remontees.sql + fonction envoyer-rappels).

interface Remontee {
  at: string;
  auteur: string;
  type: string;
  lieu: string;
  description: string;
  gravite: string;
}
const CLE = 'team-ulysse-test-remontees';
const lireRemontees = (): Remontee[] => {
  try {
    return JSON.parse(localStorage.getItem(CLE) ?? '[]') as Remontee[];
  } catch {
    return [];
  }
};

const champ =
  'mt-1.5 h-11 w-full rounded-xl border border-line px-3 outline-none focus:border-blue focus:ring-4 focus:ring-blue/10';

function OngletRemontee() {
  const { identite } = useIdentite();
  const [prenom, setPrenom] = useState(identite?.prenom ?? '');
  const [nom, setNom] = useState(identite?.nom ?? '');
  const [type, setType] = useState('Situation dangereuse');
  const [lieu, setLieu] = useState('');
  const [description, setDescription] = useState('');
  const [gravite, setGravite] = useState('Moyenne');
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [liste, setListe] = useState<Remontee[]>(lireRemontees);
  const complet = [prenom, nom, lieu, description].every((v) => v.trim());

  const envoyer = async () => {
    setEnvoi(true);
    setMessage(null);
    try {
      await api.envoyerRemontee({ prenom, nom, type, lieu, description, gravite });
    } catch (e) {
      setMessage({
        ok: false,
        texte:
          e instanceof ApiError
            ? `L’envoi n’a pas marché : ${e.message} (as-tu lancé supabase/maj-remontees.sql ?)`
            : 'L’envoi n’a pas marché, vérifie ta connexion et réessaie.',
      });
      setEnvoi(false);
      return;
    }
    setEnvoi(false);
    setMessage({
      ok: true,
      texte: 'Remontée envoyée ✅ Le service est prévenu sur son téléphone.',
    });
    const r: Remontee = {
      at: new Date().toISOString(),
      auteur: `${prenom.trim()} ${nom.trim()}`,
      type,
      lieu,
      description,
      gravite,
    };
    const l = [r, ...liste].slice(0, 20);
    setListe(l);
    try {
      localStorage.setItem(CLE, JSON.stringify(l));
    } catch {
      /* stockage indisponible */
    }
    setLieu('');
    setDescription('');
    bravoStore.montrer('Merci pour ta vigilance ! 🦺', 'Ta remontée a bien été envoyée.');
  };

  return (
    <div className="space-y-4">
      <Bandeau
        onglet="remontee"
        image="securite-risque.webp"
        eyebrow="⚠️ Vigilance partagée"
        titre="Tu as vu un danger ?"
        texte="Signale-le en 30 secondes : chaque remontée évite peut-être un accident."
        decor={<Panneau />}
      >
        <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
          🧪 Test : avant-première, pas encore ouvert à tous
        </p>
      </Bandeau>

      <section className="panel space-y-4 p-4">
        <div>
          <p className="eyebrow">Qui signale ?</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Prénom *"
                autoComplete="given-name"
                className={champ}
              />
            </label>
            <label className="block">
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom *"
                autoComplete="family-name"
                className={champ}
              />
            </label>
          </div>
        </div>

        <div>
          <p className="eyebrow mb-2">Ce que tu as vu</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Situation dangereuse', '⚠️'],
              ['Presque accident', '😮'],
            ].map(([t, e]) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cx(
                  'rounded-2xl border-2 p-3 text-left text-sm font-bold',
                  type === t ? 'border-blue bg-blue-light text-navy-950' : 'border-line text-muted',
                )}
              >
                <span className="block text-xl">{e}</span>
                {t}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="eyebrow">Où ? *</span>
          <input
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
            placeholder="Ex. allée B, quai 3, atelier…"
            className={champ}
          />
        </label>

        <label className="block">
          <span className="eyebrow">Que se passe-t-il ? *</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Ex. palette mal filmée en hauteur, flaque d’huile près du chariot…"
            className="mt-1.5 w-full rounded-xl border border-line p-3 outline-none focus:border-blue focus:ring-4 focus:ring-blue/10"
          />
        </label>

        <div>
          <p className="eyebrow mb-2">Gravité</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Faible', 'bg-success'],
              ['Moyenne', 'bg-sun'],
              ['Grave', 'bg-danger'],
            ].map(([g, c]) => (
              <button
                key={g}
                type="button"
                onClick={() => setGravite(g)}
                className={cx(
                  'flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-sm font-bold',
                  gravite === g ? 'border-navy text-navy-950' : 'border-line text-muted',
                )}
              >
                <span className={cx('size-2.5 rounded-full', c)} /> {g}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
          style={{ background: COULEUR.remontee.fond }}
          disabled={!complet || envoi}
          onClick={() => void envoyer()}
        >
          <ShieldAlert size={18} /> {envoi ? 'Envoi…' : 'Envoyer ma remontée'}
        </button>
        {!complet && (
          <p className="text-center text-xs text-muted">
            Prénom, nom, lieu et description sont obligatoires.
          </p>
        )}
        {message && (
          <p
            className={cx(
              'rounded-xl px-3 py-2 text-sm font-semibold',
              message.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
            )}
          >
            {message.texte}
          </p>
        )}
        {gravite === 'Grave' && (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
            Danger immédiat ? Préviens aussi ton responsable tout de suite, de vive voix.
          </p>
        )}
      </section>

      {liste.length > 0 && (
        <section className="panel p-4">
          <p className="eyebrow mb-2">Mes remontées</p>
          <Link to="/remontees" className="mb-2 block text-sm font-bold text-blue">
            Voir toutes les remontées reçues →
          </Link>
          <ul className="divide-y divide-line">
            {liste.map((r) => (
              <li key={r.at} className="py-2.5 text-sm">
                <b className="text-navy-950">
                  {r.type} · {r.lieu}
                </b>
                <span className="block text-muted">
                  {r.description} · gravité {r.gravite.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
