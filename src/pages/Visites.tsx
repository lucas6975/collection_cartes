// Espace Sécurité › Visites sécurité (Lucas, Vincent, administrateur) : les règles d'une
// visite, les inscriptions au planning (EP, salarié, prestataire, CODIR) et les écarts relevés
// en photo. Les inscrits reliés à l'appli reçoivent un rappel la veille et le jour J.
import {
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  ClipboardList,
  MapPin,
  Plus,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cx } from '../components/ui/primitives';
import { ChargementUlysse } from '../components/ui/vivant';
import { ApiError, api, type EcartVisite, type RoleVisite, type VisiteSecurite } from '../data/api';
import { useIdentite } from '../data/identite';
import {
  ROLES,
  aRole,
  aujourdhui,
  codirRequis,
  dateLongue,
  rolesManquants,
  visiteParDefaut,
  zonesDe,
} from '../domain/visitesSecurite';

export const COULEUR_VISITES = {
  fond: 'linear-gradient(150deg, #FACC15 0%, #EAB308 45%, #854D0E 100%)',
  vif: '#A16207',
  doux: '#FEFCE8',
};

type Section = 'regles' | 'inscriptions' | 'ecarts';

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : 'Action impossible, réessaie.';

export function OngletVisites({ code, jeton }: { code: string | null; jeton: string | null }) {
  const [section, setSection] = useState<Section>('inscriptions');
  const [visites, setVisites] = useState<VisiteSecurite[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [choisie, setChoisie] = useState<string | null>(null);

  const charger = useCallback(() => {
    api
      .visitesPlanning(jeton, code)
      .then((l) => {
        setVisites(l);
        setErreur(null);
      })
      .catch((e) => setErreur(message(e)));
  }, [jeton, code]);
  useEffect(charger, [charger]);

  const onglets: { id: Section; titre: string; icone: typeof BookOpen }[] = [
    { id: 'regles', titre: 'Règles', icone: BookOpen },
    { id: 'inscriptions', titre: 'Inscriptions', icone: UserPlus },
    { id: 'ecarts', titre: 'Écarts', icone: Camera },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-white p-1.5 shadow-soft">
        {onglets.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setSection(o.id)}
            className={cx(
              'flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-extrabold transition-colors',
              section === o.id ? 'bg-[#0F172A] text-white' : 'text-navy-950',
            )}
          >
            <o.icone size={16} /> {o.titre}
          </button>
        ))}
      </div>

      {section === 'regles' && <Regles />}
      {section !== 'regles' && erreur && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{erreur}</p>
      )}
      {section !== 'regles' && !visites && !erreur && (
        <ChargementUlysse texte="Ulysse ouvre le planning…" />
      )}
      {section === 'inscriptions' && visites && (
        <Inscriptions
          visites={visites}
          code={code}
          jeton={jeton}
          onChange={charger}
          onEcarts={(id) => {
            setChoisie(id);
            setSection('ecarts');
          }}
        />
      )}
      {section === 'ecarts' && visites && (
        <Ecarts
          visites={visites}
          choisie={choisie}
          onChoisir={setChoisie}
          code={code}
          jeton={jeton}
          onChange={charger}
        />
      )}
    </div>
  );
}

// ───────────── Règles ─────────────

const EPI = [
  { emoji: '🦺', titre: 'Gilet haute visibilité' },
  { emoji: '🥾', titre: 'Chaussures de sécurité' },
  { emoji: '🎧', titre: 'Bouchons d’oreille' },
];

const DEROULE = [
  'Rendez-vous à l’heure au guichet du magasin PDR, EPI déjà portés.',
  'Le membre EP rappelle le périmètre (zones du jour) et répartit les rôles.',
  'On parcourt chaque zone avec son pilote : on observe, on échange avec les équipes.',
  'Chaque écart est photographié et noté dans l’appli (écart n°1, n°2…).',
  'Débrief de 5 minutes à la fin : écarts prioritaires et actions immédiates.',
];

const ROLES_VISITE = [
  {
    titre: 'Membre EP',
    texte: 'Anime la visite, garde le timing, s’assure que chaque écart est relevé.',
  },
  { titre: 'Pilote de zone', texte: 'Accueille la visite dans sa zone et suit les actions.' },
  { titre: 'Salarié', texte: 'Apporte son regard terrain et le vécu des postes de travail.' },
  {
    titre: 'Prestataire / intérimaire',
    texte: 'Apporte un regard extérieur : ce qui n’est pas évident pour un nouvel arrivant.',
  },
  {
    titre: 'Membre du CODIR',
    texte: 'Au moins une fois toutes les 3 semaines : montre l’engagement de la direction.',
  },
];

const CONDUITE = [
  'Je respecte les règles de circulation piétonne et les zones balisées.',
  'Je ne touche à aucune machine ni installation, je ne franchis aucune protection.',
  'J’observe des situations, pas des personnes : on ne cherche pas de coupable.',
  'Si je vois un danger grave et immédiat, je fais arrêter et je préviens tout de suite.',
  'Je reste avec le groupe, téléphone uniquement pour les photos d’écarts.',
  'Je valorise aussi ce qui est bien fait.',
];

function Regles() {
  return (
    <div className="space-y-4">
      <section className="rounded-[24px] bg-[#0F172A] p-5 text-white shadow-soft">
        <p className="text-xs font-extrabold tracking-wider text-sun uppercase">EPI obligatoires</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {EPI.map((e) => (
            <div key={e.titre} className="rounded-2xl bg-white/10 p-3 text-center">
              <span className="block text-[34px] leading-none">{e.emoji}</span>
              <span className="mt-2 block text-[13px] leading-tight font-bold">{e.titre}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-white/80">
          Sans ces 3 EPI, on ne participe pas à la visite.
        </p>
      </section>

      <section className="flex items-center gap-3 rounded-[24px] bg-white p-4 shadow-soft">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sun text-navy-950">
          <MapPin size={22} />
        </span>
        <div>
          <p className="eyebrow">Lieu de rendez-vous</p>
          <p className="font-display text-lg font-extrabold text-navy-950">
            Le magasin · guichet magasin PDR
          </p>
        </div>
      </section>

      <section className="rounded-[24px] bg-white p-5 shadow-soft">
        <p className="eyebrow mb-3">Déroulé d’une visite (1 h)</p>
        <ol className="space-y-2.5">
          {DEROULE.map((d, i) => (
            <li key={d} className="flex gap-3 text-[15px] text-navy-950">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sun text-sm font-extrabold">
                {i + 1}
              </span>
              {d}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-[24px] bg-white p-5 shadow-soft">
        <p className="eyebrow mb-3">Les acteurs de la visite</p>
        <div className="space-y-2">
          {ROLES_VISITE.map((r) => (
            <div key={r.titre} className="rounded-2xl bg-[#FEFCE8] p-3">
              <b className="block text-[15px] text-navy-950">{r.titre}</b>
              <span className="text-sm text-muted">{r.texte}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm font-semibold text-navy-950">
          Obligatoire à chaque visite : 1 membre EP, 1 salarié, 1 prestataire ou intérimaire.
        </p>
      </section>

      <section className="rounded-[24px] bg-white p-5 shadow-soft">
        <p className="eyebrow mb-3">Règles de conduite</p>
        <ul className="space-y-2">
          {CONDUITE.map((c) => (
            <li key={c} className="flex gap-2.5 text-[15px] text-navy-950">
              <Check size={18} className="mt-0.5 shrink-0 text-[#16A34A]" strokeWidth={3} />
              {c}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ───────────── Inscriptions ─────────────

function Inscriptions({
  visites,
  code,
  jeton,
  onChange,
  onEcarts,
}: {
  visites: VisiteSecurite[];
  code: string | null;
  jeton: string | null;
  onChange: () => void;
  onEcarts: (id: string) => void;
}) {
  const jour = aujourdhui();
  const [passees, setPassees] = useState(false);
  const aVenir = visites.filter((v) => v.date >= jour);
  const liste = passees ? visites.filter((v) => v.date < jour).reverse() : aVenir;
  const incompletes = aVenir.filter((v) => rolesManquants(visites, v).length).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm shadow-soft">
        <span className="text-xl">🔔</span>
        <span className="flex-1 text-navy-950">
          Les inscrits reçoivent un rappel <b>la veille</b> et <b>le jour J</b>.
          {incompletes > 0 && (
            <>
              {' '}
              <b className="text-[#DC2626]">{incompletes} visites à compléter.</b>
            </>
          )}
        </span>
      </div>
      <div className="flex gap-2">
        {[false, true].map((p) => (
          <button
            key={String(p)}
            type="button"
            onClick={() => setPassees(p)}
            className={cx(
              'h-9 rounded-full px-4 text-sm font-bold',
              passees === p ? 'bg-[#0F172A] text-white' : 'bg-white text-navy-950 shadow-soft',
            )}
          >
            {p ? 'Passées' : `À venir (${aVenir.length})`}
          </button>
        ))}
      </div>
      {liste.map((v, i) => (
        <CarteVisite
          key={v.id}
          visite={v}
          visites={visites}
          prochaine={!passees && i === 0}
          code={code}
          jeton={jeton}
          onChange={onChange}
          onEcarts={() => onEcarts(v.id)}
        />
      ))}
      {!liste.length && <p className="p-4 text-center text-muted">Aucune visite.</p>}
    </div>
  );
}

function CarteVisite({
  visite: v,
  visites,
  prochaine,
  code,
  jeton,
  onChange,
  onEcarts,
}: {
  visite: VisiteSecurite;
  visites: VisiteSecurite[];
  prochaine: boolean;
  code: string | null;
  jeton: string | null;
  onChange: () => void;
  onEcarts: () => void;
}) {
  const { identite } = useIdentite();
  const [ouverte, setOuverte] = useState(prochaine);
  const [ajout, setAjout] = useState<RoleVisite | null>(null);
  const [nom, setNom] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const manque = rolesManquants(visites, v);
  const codirDu = codirRequis(visites, v);
  const moi = identite ? `${identite.prenom} ${identite.nom}`.trim() : '';

  const agir = async (f: () => Promise<unknown>) => {
    setOccupe(true);
    setErreur(null);
    try {
      await f();
      setAjout(null);
      setNom('');
      onChange();
    } catch (e) {
      setErreur(message(e));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <article
      className={cx(
        'overflow-hidden rounded-[24px] bg-white shadow-soft',
        prochaine && 'ring-2 ring-sun',
      )}
    >
      <button
        type="button"
        onClick={() => setOuverte((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="grid w-14 shrink-0 place-items-center rounded-2xl bg-[#0F172A] py-2 text-white">
          <b className="font-display text-[22px] leading-none">{Number(v.date.slice(8))}</b>
          <span className="text-[11px] font-bold uppercase">
            {new Date(`${v.date}T12:00:00`).toLocaleDateString('fr-FR', { month: 'short' })}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          {prochaine && (
            <span className="text-[11px] font-extrabold tracking-wider text-[#A16207] uppercase">
              Prochaine visite
            </span>
          )}
          <b className="block text-[15px] text-navy-950 first-letter:uppercase">
            {dateLongue(v.date)}
          </b>
          <span className="block text-sm text-muted">{v.horaire}</span>
          <span className="mt-1 flex flex-wrap gap-1">
            {manque.length === 0 ? (
              <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-extrabold text-[#166534]">
                ✓ Complète
              </span>
            ) : (
              manque.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-extrabold text-[#B91C1C]"
                >
                  Manque {ROLES.find((x) => x.id === r)!.court}
                </span>
              ))
            )}
            {v.ecarts > 0 && (
              <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-extrabold text-[#92400E]">
                {v.ecarts} écart{v.ecarts > 1 ? 's' : ''}
              </span>
            )}
          </span>
        </span>
        <ChevronDown
          size={20}
          className={cx('shrink-0 text-muted transition-transform', ouverte && 'rotate-180')}
        />
      </button>

      {ouverte && (
        <div className="space-y-3 border-t border-black/5 p-4">
          <div className="space-y-1.5">
            {v.zones.map((z, i) => (
              <div key={i} className="flex gap-2 rounded-xl bg-[#FEFCE8] p-2.5 text-sm">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#A16207]" />
                <span>
                  <b className="text-navy-950">{z.zones}</b>
                  <span className="block text-xs text-muted">Pilote : {z.pilote}</span>
                </span>
              </div>
            ))}
          </div>

          {ROLES.map((r) => {
            const inscrits = v.inscrits.filter((i) => i.role === r.id);
            const obligatoire = r.id !== 'codir' || codirDu;
            return (
              <div key={r.id} className="rounded-2xl border border-black/5 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.emoji}</span>
                  <b className="flex-1 text-sm text-navy-950">{r.titre}</b>
                  {obligatoire && !aRole(v, r.id) && (
                    <span className="text-[11px] font-extrabold text-[#B91C1C] uppercase">
                      {r.id === 'codir' ? 'Requis (3 sem.)' : 'Obligatoire'}
                    </span>
                  )}
                  {!obligatoire && !aRole(v, r.id) && (
                    <span className="text-[11px] font-bold text-muted">Facultatif</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {inscrits.map((i) => (
                    <span
                      key={i.id}
                      className="flex items-center gap-1 rounded-full bg-[#0F172A] py-1 pr-1 pl-3 text-[13px] font-bold text-white"
                    >
                      {i.nom}
                      {i.appli && <span title="Reçoit les rappels">🔔</span>}
                      <button
                        type="button"
                        aria-label={`Retirer ${i.nom}`}
                        disabled={occupe}
                        onClick={() => {
                          if (confirm(`Retirer ${i.nom} de cette visite ?`))
                            void agir(() => api.visiteDesinscrire(i.id, jeton, code));
                        }}
                        className="grid size-6 place-items-center rounded-full bg-white/15"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  {ajout !== r.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setAjout(r.id);
                        setNom('');
                      }}
                      className="flex h-8 items-center gap-1 rounded-full border border-dashed border-navy-950/30 px-3 text-[13px] font-bold text-navy-950"
                    >
                      <Plus size={14} /> Inscrire
                    </button>
                  )}
                </div>
                {ajout === r.id && (
                  <div className="mt-2 space-y-2">
                    {moi && (
                      <button
                        type="button"
                        disabled={occupe}
                        onClick={() =>
                          void agir(() => api.visiteInscrire(v.id, r.id, moi, true, jeton, code))
                        }
                        className="h-11 w-full rounded-xl bg-sun text-sm font-extrabold text-navy-950"
                      >
                        M’inscrire ({moi})
                      </button>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        placeholder="Prénom NOM"
                        className="h-11 min-w-0 flex-1 rounded-xl border border-black/10 px-3 text-[15px]"
                      />
                      <button
                        type="button"
                        disabled={occupe || nom.trim().length < 2}
                        onClick={() =>
                          void agir(() =>
                            api.visiteInscrire(v.id, r.id, nom.trim(), false, jeton, code),
                          )
                        }
                        className="h-11 rounded-xl bg-[#0F172A] px-4 text-sm font-extrabold text-white disabled:opacity-40"
                      >
                        Ajouter
                      </button>
                      <button
                        type="button"
                        aria-label="Annuler"
                        onClick={() => setAjout(null)}
                        className="grid size-11 place-items-center rounded-xl bg-black/5"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {erreur && <p className="text-sm font-semibold text-red-700">{erreur}</p>}
          <button
            type="button"
            onClick={onEcarts}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] text-sm font-extrabold text-white"
          >
            <Camera size={18} /> Écarts de cette visite ({v.ecarts})
          </button>
        </div>
      )}
    </article>
  );
}

// ───────────── Écarts ─────────────

/** Photo réduite (1280 px max, JPEG) pour rester légère dans la base. */
async function compresser(fichier: File): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = ko;
      i.src = url;
    });
    const k = Math.min(1, 1280 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Ecarts({
  visites,
  choisie,
  onChoisir,
  code,
  jeton,
  onChange,
}: {
  visites: VisiteSecurite[];
  choisie: string | null;
  onChoisir: (id: string) => void;
  code: string | null;
  jeton: string | null;
  onChange: () => void;
}) {
  const { identite } = useIdentite();
  const visite = useMemo(
    () => visites.find((v) => v.id === choisie) ?? visiteParDefaut(visites),
    [visites, choisie],
  );
  const [charges, setCharges] = useState<{ visite: string; liste: EcartVisite[] } | null>(null);
  const ecarts = charges && charges.visite === visite?.id ? charges.liste : null;
  const [form, setForm] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [zone, setZone] = useState('');
  const [description, setDescription] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(() => {
    if (!visite) return;
    const id = visite.id;
    api
      .visiteEcarts(id, jeton, code)
      .then((liste) => setCharges({ visite: id, liste }))
      .catch((e) => setErreur(message(e)));
  }, [visite, jeton, code]);
  useEffect(charger, [charger]);

  if (!visite) return <p className="p-4 text-center text-muted">Aucune visite au planning.</p>;
  const zones = zonesDe(visite);
  const prochain = (ecarts?.reduce((m, e) => Math.max(m, e.numero), 0) ?? 0) + 1;

  const enregistrer = async () => {
    setOccupe(true);
    setErreur(null);
    try {
      await api.visiteEcartAjouter(
        {
          visite: visite.id,
          zone,
          description: description.trim(),
          photo,
          par: identite ? `${identite.prenom} ${identite.nom}` : '',
        },
        jeton,
        code,
      );
      setForm(false);
      setPhoto(null);
      setDescription('');
      charger();
      onChange();
    } catch (e) {
      setErreur(message(e));
    } finally {
      setOccupe(false);
    }
  };

  const modifier = async (e: EcartVisite, m: Parameters<typeof api.visiteEcartModifier>[1]) => {
    try {
      await api.visiteEcartModifier(e.id, m, jeton, code);
      charger();
      onChange();
    } catch (err) {
      setErreur(message(err));
    }
  };

  return (
    <div className="space-y-3">
      <label className="block rounded-2xl bg-white p-3 shadow-soft">
        <span className="eyebrow">Visite</span>
        <select
          value={visite.id}
          onChange={(e) => onChoisir(e.target.value)}
          className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-2 text-[15px] font-bold text-navy-950"
        >
          {visites.map((v) => (
            <option key={v.id} value={v.id}>
              {dateLongue(v.date)} · {v.horaire}
              {v.ecarts ? ` · ${v.ecarts} écart(s)` : ''}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-muted">
          Zones : {visite.zones.map((z) => z.zones).join(' · ')}
        </span>
      </label>

      {!form ? (
        <button
          type="button"
          onClick={() => {
            setForm(true);
            setZone(zones[0] ?? '');
          }}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#DC2626] text-base font-extrabold text-white shadow-soft"
        >
          <Camera size={22} /> Relever l’écart n°{prochain}
        </button>
      ) : (
        <section className="space-y-3 rounded-[24px] bg-white p-4 shadow-soft">
          <p className="font-display text-lg font-extrabold text-navy-950">Écart n°{prochain}</p>
          <label className="relative grid min-h-40 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-navy-950/20 bg-[#F8FAFC]">
            {photo ? (
              <img src={photo} alt="Photo de l’écart" className="max-h-72 w-full object-contain" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-sm font-bold text-navy-950">
                <Camera size={30} /> Prendre la photo
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="absolute inset-0 opacity-0"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setPhoto(await compresser(f));
              }}
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-navy-950">Zone</span>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-2 text-[15px]"
            >
              {zones.map((z) => (
                <option key={z}>{z}</option>
              ))}
              <option value="">Autre / hors zone</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-navy-950">Description de l’écart</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Ex. : palette en travers de l’allée piétonne"
              className="mt-1 w-full rounded-xl border border-black/10 p-3 text-[15px]"
            />
          </label>
          {erreur && <p className="text-sm font-semibold text-red-700">{erreur}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(false);
                setPhoto(null);
              }}
              className="h-12 flex-1 rounded-xl bg-black/5 text-sm font-extrabold text-navy-950"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={occupe || !description.trim()}
              onClick={() => void enregistrer()}
              className="h-12 flex-[2] rounded-xl bg-[#0F172A] text-sm font-extrabold text-white disabled:opacity-40"
            >
              {occupe ? 'Enregistrement…' : 'Enregistrer l’écart'}
            </button>
          </div>
        </section>
      )}

      {!ecarts && <ChargementUlysse texte="Ulysse cherche les écarts…" />}
      {ecarts && !ecarts.length && !form && (
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-6 text-center shadow-soft">
          <ClipboardList size={28} className="text-muted" />
          <p className="font-bold text-navy-950">Aucun écart relevé pour cette visite.</p>
        </div>
      )}
      {ecarts?.map((e) => (
        <LigneEcart
          key={e.id}
          ecart={e}
          code={code}
          jeton={jeton}
          onStatut={() =>
            void modifier(e, { statut: e.statut === 'traite' ? 'a_traiter' : 'traite' })
          }
          onSupprimer={() => {
            if (confirm(`Supprimer l’écart n°${e.numero} ?`)) void modifier(e, { supprimer: true });
          }}
        />
      ))}
    </div>
  );
}

function LigneEcart({
  ecart: e,
  code,
  jeton,
  onStatut,
  onSupprimer,
}: {
  ecart: EcartVisite;
  code: string | null;
  jeton: string | null;
  onStatut: () => void;
  onSupprimer: () => void;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [grand, setGrand] = useState(false);
  useEffect(() => {
    if (e.photo)
      api
        .visiteEcartPhoto(e.id, jeton, code)
        .then(setPhoto)
        .catch(() => undefined);
  }, [e.id, e.photo, jeton, code]);
  const traite = e.statut === 'traite';
  return (
    <article className="flex gap-3 rounded-[22px] bg-white p-3 shadow-soft">
      <button
        type="button"
        onClick={() => photo && setGrand(true)}
        className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-[#F1F5F9]"
      >
        {photo ? (
          <img src={photo} alt="" className="size-full object-cover" />
        ) : (
          <Camera size={24} className="m-auto text-muted" />
        )}
        <span className="absolute top-1 left-1 rounded-full bg-[#DC2626] px-2 py-0.5 text-xs font-extrabold text-white">
          n°{e.numero}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <b className="block text-[15px] text-navy-950">Écart n°{e.numero}</b>
        {e.zone && (
          <span className="flex items-center gap-1 text-xs font-bold text-[#A16207]">
            <MapPin size={12} /> {e.zone}
          </span>
        )}
        <p className="mt-1 text-sm break-words text-navy-950">{e.description}</p>
        {e.cree_par && <p className="text-xs text-muted">Relevé par {e.cree_par}</p>}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onStatut}
            className={cx(
              'h-8 rounded-full px-3 text-xs font-extrabold',
              traite ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEE2E2] text-[#B91C1C]',
            )}
          >
            {traite ? '✓ Traité' : 'À traiter'}
          </button>
          <button
            type="button"
            aria-label={`Supprimer l’écart n°${e.numero}`}
            onClick={onSupprimer}
            className="grid size-8 place-items-center rounded-full bg-black/5 text-navy-950"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {grand && photo && (
        <button
          type="button"
          onClick={() => setGrand(false)}
          className="fixed inset-0 z-[600] grid place-items-center bg-black/90 p-4"
          aria-label="Fermer la photo"
        >
          <img src={photo} alt={`Écart n°${e.numero}`} className="max-h-full max-w-full" />
        </button>
      )}
    </article>
  );
}
