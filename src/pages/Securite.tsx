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
import { MASCOTTE_URL } from '../components/cards/CardBack';
import { ChargementUlysse } from '../components/ui/vivant';
import { Button, PageHeader, cx } from '../components/ui/primitives';
import { ApiError, api, type ContactSst } from '../data/api';
import { bravoStore } from '../data/bravo';
import { useIdentite } from '../data/identite';

type Onglet = 'sst' | 'remontee' | 'accident';

export function Securite() {
  const { codeAdmin } = useIdentite();
  const [onglet, setOnglet] = useState<Onglet>('accident');
  if (!codeAdmin) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-2xl">
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
                className={cx(
                  'absolute inset-0 rounded-xl',
                  id === 'accident' ? 'bg-danger' : 'bg-navy',
                )}
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
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#D42A3C] to-[#8E1424] p-5 text-white shadow-lift">
        <p className="eyebrow text-white/80">Tu es témoin d’un accident</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold">Protéger · Alerter · Secourir</h2>
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
      </section>

      <section className="panel p-4">
        <p className="eyebrow mb-3">Appeler les secours</p>
        <div className="grid grid-cols-2 gap-2.5">
          {URGENCES.map((u) => (
            <a
              key={u.num}
              href={u.sms ? `sms:${u.num}` : `tel:${u.num}`}
              className="vi-elastique flex flex-col rounded-2xl border-2 border-danger/15 bg-danger/5 p-3"
            >
              <span className="font-display text-3xl font-extrabold text-danger">{u.num}</span>
              <span className="font-bold text-navy-950">{u.nom}</span>
              <span className="text-xs text-muted">{u.quand}</span>
            </a>
          ))}
        </div>
        <Button variant="secondary" className="mt-3 w-full" onClick={onSst}>
          <HeartPulse size={16} /> Appeler un SST du site
        </Button>
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
      <section className="panel flex items-center gap-4 p-4">
        <img src={MASCOTTE_URL} alt="" className="h-20 w-auto shrink-0" />
        <div>
          <p className="font-display text-lg font-extrabold text-navy-950">
            Les sauveteurs secouristes du site
          </p>
          <p className="text-sm text-muted">
            Formés aux premiers secours, ils interviennent en attendant les secours. Un toucher pour
            les appeler.
          </p>
        </div>
      </section>

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
        <section key={`${c.prenom}${c.nom}`} className="panel p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success font-display text-lg font-extrabold text-white">
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
              className="vi-elastique inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-success font-semibold text-white"
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
      <p className="rounded-2xl bg-sun/20 px-4 py-3 text-sm text-navy-950">
        🧪 <b>Mode test</b> : rien n’est envoyé, la remontée reste sur ce téléphone.
      </p>

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
                  type === t ? 'border-navy bg-blue-light text-navy-950' : 'border-line text-muted',
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

        <Button
          variant="accent"
          size="lg"
          className="w-full"
          disabled={!lieu.trim() || !description.trim()}
          onClick={envoyer}
        >
          <ShieldAlert size={18} /> Envoyer ma remontée
        </Button>
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
