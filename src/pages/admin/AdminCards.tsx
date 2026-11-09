import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { GameCard } from '../../components/cards/GameCard';
import { Field, Select, TextArea, TextInput, Toggle } from '../../components/ui/form';
import { ICONS } from '../../components/ui/Icon';
import { Modal, useToast } from '../../components/ui/overlay';
import { Button, Chip, PageHeader, cx } from '../../components/ui/primitives';
import { TraceEditor } from '../../components/ui/SourcesEditor';
import { CATEGORIES, RARITIES } from '../../content/categories';
import { A_VERIFIER } from '../../content/sources';
import { backend, useSession } from '../../data/store';
import type { Card, CategoryId, Obtention } from '../../domain/types';

/** Redimensionne une image importée pour limiter la taille stockée. */
function resizeImage(file: File, max = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function AdminCards() {
  const { catalog } = useSession();
  const toast = useToast();
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [editing, setEditing] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState<Card | null>(null);
  const total = catalog.cards.length;
  const list = catalog.cards
    .filter((c) => !cat || c.categorie === cat)
    .sort((a, b) => a.numero - b.numero);

  const create = () =>
    setEditing({
      id: `carte-${crypto.randomUUID().slice(0, 8)}`,
      numero: Math.max(0, ...catalog.cards.map((c) => c.numero)) + 1,
      nom: '',
      categorie: cat ?? 'incendie',
      rarete: 'commune',
      icone: 'ShieldCheck',
      description: '',
      info: '',
      leSavaisTu: '',
      aRetenir: '',
      nature: 'recommandation',
      sources: [{ label: '' }],
      obtention: { type: 'maitrise', seuil: 1 },
      verification: A_VERIFIER,
      publie: false,
    });

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Cartes"
        description="Créez et modifiez les cartes. Toute modification de contenu repasse la carte en « à vérifier »."
      >
        <Button onClick={create}>
          <Plus size={17} /> Nouvelle carte
        </Button>
      </PageHeader>

      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Chip active={!cat} onClick={() => setCat(null)}>
          Toutes ({total})
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} color={c.couleur}>
            {c.court}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {list.map((c) => (
          <div key={c.id} className="group">
            <div className="relative">
              <GameCard
                card={c}
                total={total}
                size="md"
                className={cx('w-full', !c.publie && 'opacity-60')}
                onClick={() => setEditing(c)}
                tilt={false}
              />
              <div className="absolute right-2 top-9 flex flex-col gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  onClick={() => setEditing(c)}
                  className="grid size-8 place-items-center rounded-lg bg-white/95 text-navy shadow hover:bg-white"
                  aria-label={`Modifier ${c.nom}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleting(c)}
                  className="grid size-8 place-items-center rounded-lg bg-white/95 text-danger shadow hover:bg-white"
                  aria-label={`Supprimer ${c.nom}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {!c.publie && (
                <span className="rounded-md bg-navy/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">
                  Brouillon
                </span>
              )}
              {c.verification.statut === 'a-verifier' ? (
                <span className="rounded-md bg-sun/25 px-1.5 py-0.5 text-[10px] font-bold uppercase text-navy-950">
                  À vérifier
                </span>
              ) : (
                <span className="rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-success">
                  Vérifiée
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={
          editing && catalog.cards.some((c) => c.id === editing.id)
            ? 'Modifier la carte'
            : 'Nouvelle carte'
        }
        size="xl"
      >
        {editing && (
          <CardForm
            card={editing}
            total={total}
            onSave={(c) => {
              backend.saveCard(c);
              toast('Carte enregistrée');
              setEditing(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Supprimer la carte"
        size="sm"
      >
        {deleting && (
          <div className="p-6">
            <p className="text-[15px] text-ink/85">
              Supprimer « {deleting.nom} » ? Elle sera retirée de toutes les collections. Pour la
              masquer temporairement, dépubliez-la plutôt.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleting(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  backend.deleteCard(deleting.id);
                  toast('Carte supprimée', 'info');
                  setDeleting(null);
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const CONTENT_FIELDS: (keyof Card)[] = [
  'nom',
  'description',
  'info',
  'leSavaisTu',
  'aRetenir',
  'nature',
  'sources',
];

function CardForm({
  card,
  total,
  onSave,
}: {
  card: Card;
  total: number;
  onSave: (c: Card) => void;
}) {
  const { catalog } = useSession();
  const toast = useToast();
  const [c, setC] = useState(card);
  const set = <K extends keyof Card>(k: K, v: Card[K]) => setC((x) => ({ ...x, [k]: v }));
  const contentChanged = CONTENT_FIELDS.some(
    (k) => JSON.stringify(c[k]) !== JSON.stringify(card[k]),
  );
  const willBeVerified = c.verification.statut === 'valide' && !contentChanged;

  const onImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast('Choisissez un fichier image.', 'error');
    set('image', await resizeImage(f));
  };

  const setObtention = (type: Obtention['type']) => {
    const o: Obtention =
      type === 'maitrise'
        ? { type, seuil: 1 }
        : type === 'parcours'
          ? { type, parcoursId: catalog.parcours[0]?.id ?? '' }
          : type === 'scenario'
            ? { type, scenarioId: catalog.scenarios[0]?.id ?? '' }
            : type === 'niveau'
              ? { type, niveau: 5 }
              : { type };
    set('obtention', o);
  };

  const submit = () => {
    if (!c.nom.trim() || c.description.trim().length < 10 || c.aRetenir.trim().length < 10)
      return toast('Nom, description et « À retenir » sont obligatoires.', 'error');
    const sources = c.sources.filter((s) => s.label.trim());
    if (sources.length === 0) return toast('Ajoutez au moins une source.', 'error');
    if (catalog.cards.some((x) => x.numero === c.numero && x.id !== c.id))
      return toast(`Le numéro ${c.numero} est déjà utilisé.`, 'error');
    // Un contenu modifié doit être revérifié, et ne peut être publié qu'une fois vérifié.
    const verification = contentChanged ? A_VERIFIER : c.verification;
    onSave({
      ...c,
      sources,
      verification,
      publie: c.publie && (verification.statut === 'valide' || !contentChanged),
    });
  };

  return (
    <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
          <Field label="Nom de la carte">
            <TextInput value={c.nom} onChange={(e) => set('nom', e.target.value)} />
          </Field>
          <Field label="Numéro">
            <TextInput
              type="number"
              min={1}
              value={c.numero}
              onChange={(e) => set('numero', Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Catégorie">
            <Select
              value={c.categorie}
              onChange={(e) => set('categorie', e.target.value as CategoryId)}
            >
              {CATEGORIES.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nom}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rareté">
            <Select
              value={c.rarete}
              onChange={(e) => set('rarete', e.target.value as Card['rarete'])}
            >
              {RARITIES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Icône">
            <Select value={c.icone} onChange={(e) => set('icone', e.target.value)}>
              {Object.keys(ICONS)
                .sort()
                .map((n) => (
                  <option key={n}>{n}</option>
                ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Illustration personnalisée"
          hint="Facultatif. Remplace l’illustration générée à partir de l’icône."
        >
          <div className="flex items-center gap-3">
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-navy/25 px-4 text-sm font-semibold text-navy hover:bg-blue-light">
              <ImagePlus size={17} /> Importer une image
              <input type="file" accept="image/*" className="sr-only" onChange={onImage} />
            </label>
            {c.image && (
              <button
                type="button"
                className="text-sm font-semibold text-danger hover:underline"
                onClick={() => set('image', undefined)}
              >
                Retirer
              </button>
            )}
          </div>
        </Field>

        <Field label="Description">
          <TextArea
            value={c.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={400}
          />
        </Field>
        <Field label="Information pédagogique">
          <TextArea value={c.info} onChange={(e) => set('info', e.target.value)} />
        </Field>
        <Field label="Le savais-tu ?">
          <TextArea
            value={c.leSavaisTu}
            onChange={(e) => set('leSavaisTu', e.target.value)}
            rows={2}
          />
        </Field>
        <Field label="À retenir">
          <TextArea
            value={c.aRetenir}
            onChange={(e) => set('aRetenir', e.target.value)}
            rows={2}
            maxLength={300}
          />
        </Field>

        <TraceEditor
          nature={c.nature}
          sources={c.sources}
          onChange={(nature, sources) => setC((x) => ({ ...x, nature, sources }))}
        />

        <div className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-2">
          <Field label="Comment l’obtenir">
            <Select
              value={c.obtention.type}
              onChange={(e) => setObtention(e.target.value as Obtention['type'])}
            >
              <option value="maitrise">Réussir des questions de la catégorie</option>
              <option value="parcours">Valider un parcours</option>
              <option value="scenario">Réussir une mise en situation</option>
              <option value="collection">Compléter la famille</option>
              <option value="niveau">Atteindre un niveau</option>
            </Select>
          </Field>
          {c.obtention.type === 'maitrise' && (
            <Field label="Nombre de questions réussies">
              <TextInput
                type="number"
                min={1}
                value={c.obtention.seuil}
                onChange={(e) =>
                  set('obtention', { type: 'maitrise', seuil: Math.max(1, Number(e.target.value)) })
                }
              />
            </Field>
          )}
          {c.obtention.type === 'parcours' && (
            <Field label="Parcours">
              <Select
                value={c.obtention.parcoursId}
                onChange={(e) => set('obtention', { type: 'parcours', parcoursId: e.target.value })}
              >
                {catalog.parcours.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titre}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {c.obtention.type === 'scenario' && (
            <Field label="Mise en situation">
              <Select
                value={c.obtention.scenarioId}
                onChange={(e) => set('obtention', { type: 'scenario', scenarioId: e.target.value })}
              >
                {catalog.scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.titre}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {c.obtention.type === 'niveau' && (
            <Field label="Niveau">
              <TextInput
                type="number"
                min={2}
                value={c.obtention.niveau}
                onChange={(e) =>
                  set('obtention', { type: 'niveau', niveau: Math.max(2, Number(e.target.value)) })
                }
              />
            </Field>
          )}
        </div>
      </div>

      {/* Aperçu en direct */}
      <aside className="border-t border-line bg-canvas/70 p-6 lg:border-l lg:border-t-0">
        <div className="lg:sticky lg:top-20">
          <p className="eyebrow mb-3">Aperçu</p>
          <div className="mx-auto w-[240px]">
            <GameCard
              card={{
                ...c,
                nom: c.nom || 'Nom de la carte',
                description: c.description || 'Description de la carte…',
              }}
              total={Math.max(total, c.numero)}
              size="lg"
              className="w-full"
            />
          </div>
          <div className="mt-6 space-y-3">
            <Toggle
              checked={c.publie}
              onChange={(v) => set('publie', v)}
              label="Publiée pour les collaborateurs"
            />
            <p className={cx('text-xs', willBeVerified ? 'text-success' : 'text-sun-dark')}>
              {willBeVerified
                ? 'Contenu vérifié.'
                : contentChanged
                  ? 'Le contenu a changé : il devra être vérifié dans « Validation » avant publication.'
                  : 'Contenu à vérifier dans « Validation ».'}
            </p>
            <Button className="w-full" onClick={submit}>
              Enregistrer
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
