// ESPACE SÉCURITÉ, EN TEST : visible uniquement avec le code administrateur.
// Trois onglets : les SST du site, la remontée de situation à risque, la conduite en cas d'accident.
// Rien n'est encore envoyé : la remontée reste sur ce téléphone pendant le test.
import {
  AlertTriangle,
  BookUser,
  Camera,
  HeartPulse,
  Phone,
  ShieldAlert,
  Siren,
  UserPlus,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { ChargementUlysse } from '../components/ui/vivant';
import { Button, PageHeader, cx } from '../components/ui/primitives';
import { ApiError, api, type ContactSst } from '../data/api';
import { bravoStore } from '../data/bravo';
import { useIdentite } from '../data/identite';

type Onglet = 'sst' | 'remontee' | 'accident';

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
    className="sec-panneau pointer-events-none absolute top-4 right-4 w-20 drop-shadow-[0_6px_10px_rgba(0,0,0,.35)]"
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

export function Securite() {
  const { codeAdmin } = useIdentite();
  const [onglet, setOnglet] = useState<Onglet>('accident');
  if (!codeAdmin) return <Navigate to="/" replace />;

  return (
    <div className="relative mx-auto max-w-2xl">
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-colors duration-500"
        style={{ background: COULEUR[onglet].doux }}
        aria-hidden
      />
      <PageHeader
        eyebrow="🧪 Test · visible seulement par l’administrateur"
        title="Espace Sécurité"
        description="Les bons réflexes et les bons contacts, en un toucher."
      />

      <div
        className="mb-5 flex max-w-full overflow-x-auto rounded-2xl border border-line bg-white p-1 shadow-soft"
        role="tablist"
      >
        {(
          [
            ['accident', 'Accident', Siren],
            ['sst', 'SST', HeartPulse],
            ['remontee', 'Situation à risque', AlertTriangle],
          ] as const
        ).map(([id, label, I]) => (
          <button
            key={id}
            role="tab"
            aria-selected={onglet === id}
            onClick={() => setOnglet(id)}
            className={cx(
              'relative flex h-10 flex-1 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold whitespace-nowrap',
              onglet === id ? 'text-white' : 'text-muted hover:text-navy',
            )}
          >
            {onglet === id && (
              <motion.span
                layoutId="securite-tab"
                className="absolute inset-0 rounded-xl"
                style={{ background: COULEUR[id].vif }}
              />
            )}
            <I size={16} className="relative" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {onglet === 'accident' && <OngletAccident onSst={() => setOnglet('sst')} />}
      {onglet === 'sst' && <OngletSst code={codeAdmin} />}
      {onglet === 'remontee' && <OngletRemontee />}
    </div>
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

      <section className="panel p-4">
        <p className="eyebrow mb-3 text-[#C8283A]">📞 Appeler les secours</p>
        <div className="grid grid-cols-2 gap-2.5">
          {URGENCES.map((u) => (
            <a
              key={u.num}
              href={u.sms ? `sms:${u.num}` : `tel:${u.num}`}
              className="vi-elastique relative flex flex-col overflow-hidden rounded-2xl p-3 text-white shadow-[0_8px_18px_rgba(200,40,58,.35)]"
              style={{ background: COULEUR.accident.fond }}
            >
              <Phone size={56} className="absolute -right-3 -bottom-3 rotate-12 text-white/15" />
              <span className="font-display text-4xl leading-none font-extrabold">{u.num}</span>
              <span className="mt-1 font-bold">{u.nom}</span>
              <span className="text-xs text-white/80">{u.quand}</span>
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={onSst}
          className="vi-elastique mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white"
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
    `TITLE:${c.role}`,
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

function OngletSst({ code }: { code: string }) {
  const [contacts, setContacts] = useState<ContactSst[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    api
      .securiteSst(code)
      .then(setContacts)
      .catch((e: unknown) =>
        setErreur(
          e instanceof ApiError
            ? `${e.message} (as-tu lancé supabase/maj-securite-test.sql ?)`
            : 'Erreur de chargement',
        ),
      );
  }, [code]);

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
              <p className="text-xs font-semibold text-success">➕ {c.role}</p>
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

interface Remontee {
  at: string;
  type: string;
  lieu: string;
  description: string;
  gravite: string;
  photo: boolean;
  anonyme: boolean;
}
const CLE = 'team-ulysse-test-remontees';
const lireRemontees = (): Remontee[] => {
  try {
    return JSON.parse(localStorage.getItem(CLE) ?? '[]') as Remontee[];
  } catch {
    return [];
  }
};

function OngletRemontee() {
  const [type, setType] = useState('Situation dangereuse');
  const [lieu, setLieu] = useState('');
  const [description, setDescription] = useState('');
  const [gravite, setGravite] = useState('Moyenne');
  const [photo, setPhoto] = useState<string | null>(null);
  const [anonyme, setAnonyme] = useState(false);
  const [liste, setListe] = useState<Remontee[]>(lireRemontees);

  const envoyer = () => {
    const r: Remontee = {
      at: new Date().toISOString(),
      type,
      lieu,
      description,
      gravite,
      photo: !!photo,
      anonyme,
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
    setPhoto(null);
    bravoStore.montrer(
      'Merci pour ta vigilance ! 🦺',
      'Ta remontée a bien été enregistrée (test).',
    );
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
          🧪 Mode test : rien n’est envoyé
        </p>
      </Bandeau>

      <section className="panel space-y-4 p-4">
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
                  'vi-elastique rounded-2xl border-2 p-3 text-left text-sm font-bold',
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
          <span className="eyebrow">Où ?</span>
          <input
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
            placeholder="Ex. allée B, quai 3, atelier…"
            className="mt-1.5 h-11 w-full rounded-xl border border-line px-3 outline-none focus:border-blue focus:ring-4 focus:ring-blue/10"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Que se passe-t-il ?</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
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
                  'vi-elastique flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-sm font-bold',
                  gravite === g ? 'border-navy text-navy-950' : 'border-line text-muted',
                )}
              >
                <span className={cx('size-2.5 rounded-full', c)} /> {g}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-line p-3">
          {photo ? (
            <img src={photo} alt="" className="size-14 rounded-xl object-cover" />
          ) : (
            <span className="grid size-14 place-items-center rounded-xl bg-canvas text-navy">
              <Camera size={22} />
            </span>
          )}
          <span className="text-sm">
            <b className="text-navy-950">{photo ? 'Photo ajoutée' : 'Ajouter une photo'}</b>
            <span className="block text-xs text-muted">Facultatif · évite les visages</span>
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPhoto(URL.createObjectURL(f));
            }}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-navy-950">
          <input
            type="checkbox"
            checked={anonyme}
            onChange={(e) => setAnonyme(e.target.checked)}
            className="size-4 accent-[#0B2347]"
          />
          Envoyer sans mon nom
        </label>

        <button
          type="button"
          className="vi-elastique flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold text-white disabled:opacity-40"
          style={{ background: COULEUR.remontee.fond }}
          disabled={!lieu.trim() || !description.trim()}
          onClick={envoyer}
        >
          <ShieldAlert size={18} /> Envoyer ma remontée
        </button>
        {gravite === 'Grave' && (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
            Danger immédiat ? Préviens aussi ton responsable tout de suite, de vive voix.
          </p>
        )}
      </section>

      {liste.length > 0 && (
        <section className="panel p-4">
          <p className="eyebrow mb-2">Mes remontées (test)</p>
          <ul className="divide-y divide-line">
            {liste.map((r) => (
              <li key={r.at} className="py-2.5 text-sm">
                <b className="text-navy-950">
                  {r.type} · {r.lieu}
                </b>
                <span className="block text-muted">
                  {r.description} · gravité {r.gravite.toLowerCase()}
                  {r.photo && ' · 📷'}
                  {r.anonyme && ' · anonyme'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
