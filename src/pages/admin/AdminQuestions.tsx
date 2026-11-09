import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { NatureBadge } from '../../components/cards/CardDetail';
import { Field, Select, TextArea, TextInput, Toggle } from '../../components/ui/form';
import { Icon } from '../../components/ui/Icon';
import { Modal, useToast } from '../../components/ui/overlay';
import { Button, Chip, PageHeader, cx } from '../../components/ui/primitives';
import { TraceEditor } from '../../components/ui/SourcesEditor';
import { CATEGORIES, CATEGORY_BY_ID } from '../../content/categories';
import { A_VERIFIER } from '../../content/sources';
import { backend, useSession } from '../../data/store';
import type { CategoryId, Parcours, Question } from '../../domain/types';

export default function AdminQuestions() {
  const { catalog } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<'questions' | 'parcours'>('questions');
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [editing, setEditing] = useState<Question | null>(null);
  const [editingP, setEditingP] = useState<Parcours | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const list = catalog.questions.filter((q) => !cat || q.categorie === cat);

  const create = () =>
    setEditing({
      id: `q-${crypto.randomUUID().slice(0, 8)}`,
      categorie: cat ?? 'incendie',
      difficulte: 1,
      enonce: '',
      choix: ['a', 'b', 'c'].map((id) => ({ id, texte: '' })),
      bonneReponse: 'a',
      explication: '',
      nature: 'recommandation',
      sources: [{ label: '' }],
      verification: A_VERIFIER,
      publie: false,
    });

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Quiz et parcours"
        description="Rédigez les questions, leurs explications et composez les parcours thématiques."
      >
        {tab === 'questions' && (
          <Button onClick={create}>
            <Plus size={17} /> Nouvelle question
          </Button>
        )}
      </PageHeader>

      <div
        className="mb-5 inline-flex rounded-2xl border border-line bg-white p-1 shadow-soft"
        role="tablist"
      >
        {(['questions', 'parcours'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cx(
              'relative h-10 rounded-xl px-4 text-sm font-semibold',
              tab === t ? 'text-white' : 'text-muted',
            )}
          >
            {tab === t && (
              <motion.span layoutId="aq-tab" className="absolute inset-0 rounded-xl bg-navy" />
            )}
            <span className="relative">
              {t === 'questions'
                ? `Questions (${catalog.questions.length})`
                : `Parcours (${catalog.parcours.length})`}
            </span>
          </button>
        ))}
      </div>

      {tab === 'questions' ? (
        <>
          <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <Chip active={!cat} onClick={() => setCat(null)}>
              Toutes
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} color={c.couleur}>
                {c.court}
              </Chip>
            ))}
          </div>
          <ul className="panel divide-y divide-line">
            {list.map((q) => {
              const c = CATEGORY_BY_ID[q.categorie];
              return (
                <li key={q.id} className="flex gap-3 px-4 py-4 sm:px-5">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg"
                    style={{ background: c.fond, color: c.couleur }}
                  >
                    <Icon name={c.icone} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy-950">{q.enonce}</p>
                    <p className="mt-1 text-sm text-success">
                      <Check size={13} className="mr-1 inline" />
                      {q.choix.find((x) => x.id === q.bonneReponse)?.texte}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <NatureBadge nature={q.nature} />
                      <span className="text-xs text-muted">Difficulté {q.difficulte}/3</span>
                      {!q.publie && (
                        <span className="rounded-md bg-navy/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">
                          Brouillon
                        </span>
                      )}
                      {q.verification.statut === 'a-verifier' && (
                        <span className="rounded-md bg-sun/25 px-1.5 py-0.5 text-[10px] font-bold uppercase text-navy-950">
                          À vérifier
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setEditing(q)}
                      className="grid size-9 place-items-center rounded-lg text-muted hover:bg-blue-light hover:text-navy"
                      aria-label="Modifier"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleting(q)}
                      className="grid size-9 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {catalog.parcours.map((p) => {
            const c = CATEGORY_BY_ID[p.categorie];
            return (
              <div key={p.id} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: c.couleur }}>
                      {c.nom}
                    </p>
                    <h3 className="mt-1 font-bold text-navy-950">{p.titre}</h3>
                    <p className="mt-1 text-sm text-muted">{p.description}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setEditingP(p)}>
                    <Pencil size={14} /> Modifier
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted">
                  {p.questionIds.length} questions · seuil de validation {Math.round(p.seuil * 100)}{' '}
                  % · {p.publie ? 'publié' : 'brouillon'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={
          editing && catalog.questions.some((q) => q.id === editing.id)
            ? 'Modifier la question'
            : 'Nouvelle question'
        }
        size="lg"
      >
        {editing && (
          <QuestionForm
            question={editing}
            onSave={(q) => {
              backend.saveQuestion(q);
              toast('Question enregistrée');
              setEditing(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={!!editingP}
        onClose={() => setEditingP(null)}
        title="Modifier le parcours"
        size="lg"
      >
        {editingP && (
          <ParcoursForm
            parcours={editingP}
            onSave={(p) => {
              backend.saveParcours(p);
              toast('Parcours enregistré');
              setEditingP(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Supprimer la question"
        size="sm"
      >
        {deleting && (
          <div className="p-6">
            <p className="text-[15px] text-ink/85">
              Supprimer cette question ? Elle sera aussi retirée des parcours.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleting(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  backend.deleteQuestion(deleting.id);
                  toast('Question supprimée', 'info');
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

function QuestionForm({ question, onSave }: { question: Question; onSave: (q: Question) => void }) {
  const toast = useToast();
  const [q, setQ] = useState(question);
  const set = <K extends keyof Question>(k: K, v: Question[K]) => setQ((x) => ({ ...x, [k]: v }));
  const contentChanged = (
    ['enonce', 'choix', 'bonneReponse', 'explication', 'nature', 'sources'] as const
  ).some((k) => JSON.stringify(q[k]) !== JSON.stringify(question[k]));

  const submit = () => {
    const choix = q.choix.filter((c) => c.texte.trim());
    if (q.enonce.trim().length < 5) return toast('L’énoncé est obligatoire.', 'error');
    if (choix.length < 2) return toast('Il faut au moins deux réponses.', 'error');
    if (!choix.some((c) => c.id === q.bonneReponse))
      return toast('Indiquez la bonne réponse.', 'error');
    if (q.explication.trim().length < 10)
      return toast('L’explication pédagogique est obligatoire.', 'error');
    const sources = q.sources.filter((s) => s.label.trim());
    if (!sources.length) return toast('Ajoutez au moins une source.', 'error');
    const verification = contentChanged ? A_VERIFIER : q.verification;
    onSave({
      ...q,
      choix,
      sources,
      verification,
      publie: q.publie && (!contentChanged || verification.statut === 'valide'),
    });
  };

  return (
    <div className="space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Catégorie">
          <Select
            value={q.categorie}
            onChange={(e) => set('categorie', e.target.value as CategoryId)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Difficulté">
          <Select
            value={q.difficulte}
            onChange={(e) => set('difficulte', Number(e.target.value) as 1 | 2 | 3)}
          >
            <option value={1}>1 · Découverte</option>
            <option value={2}>2 · Intermédiaire</option>
            <option value={3}>3 · Expert</option>
          </Select>
        </Field>
      </div>
      <Field label="Énoncé">
        <TextArea value={q.enonce} onChange={(e) => set('enonce', e.target.value)} rows={2} />
      </Field>
      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-navy-950">
          Réponses <span className="font-normal text-muted">(cochez la bonne réponse)</span>
        </p>
        <div className="space-y-2">
          {q.choix.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => set('bonneReponse', c.id)}
                aria-label={`Réponse ${i + 1} correcte`}
                aria-pressed={q.bonneReponse === c.id}
                className={cx(
                  'grid size-11 shrink-0 place-items-center rounded-xl border-2 transition-colors',
                  q.bonneReponse === c.id
                    ? 'border-success bg-success text-white'
                    : 'border-line text-muted hover:border-success/50',
                )}
              >
                {q.bonneReponse === c.id ? <Check size={18} /> : String.fromCharCode(65 + i)}
              </button>
              <TextInput
                value={c.texte}
                onChange={(e) =>
                  set(
                    'choix',
                    q.choix.map((x) => (x.id === c.id ? { ...x, texte: e.target.value } : x)),
                  )
                }
                placeholder={`Réponse ${String.fromCharCode(65 + i)}`}
              />
              {q.choix.length > 2 && (
                <button
                  type="button"
                  onClick={() =>
                    setQ((x) => ({
                      ...x,
                      choix: x.choix.filter((y) => y.id !== c.id),
                      bonneReponse:
                        x.bonneReponse === c.id
                          ? x.choix.find((y) => y.id !== c.id)!.id
                          : x.bonneReponse,
                    }))
                  }
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-danger/10 hover:text-danger"
                  aria-label="Retirer la réponse"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {q.choix.length < 4 && (
          <button
            type="button"
            onClick={() =>
              set('choix', [
                ...q.choix,
                { id: 'abcd'.split('').find((l) => !q.choix.some((c) => c.id === l))!, texte: '' },
              ])
            }
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue hover:underline"
          >
            <Plus size={15} /> Ajouter une réponse
          </button>
        )}
      </div>
      <Field
        label="Explication pédagogique"
        hint="Affichée après la réponse : expliquez pourquoi, pas seulement quoi."
      >
        <TextArea value={q.explication} onChange={(e) => set('explication', e.target.value)} />
      </Field>
      <TraceEditor
        nature={q.nature}
        sources={q.sources}
        onChange={(nature, sources) => setQ((x) => ({ ...x, nature, sources }))}
      />
      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Toggle checked={q.publie} onChange={(v) => set('publie', v)} label="Publiée" />
        <Button onClick={submit}>Enregistrer</Button>
      </div>
      {contentChanged && (
        <p className="text-xs text-sun-dark">
          Contenu modifié : la question devra être vérifiée avant publication.
        </p>
      )}
    </div>
  );
}

function ParcoursForm({ parcours, onSave }: { parcours: Parcours; onSave: (p: Parcours) => void }) {
  const { catalog } = useSession();
  const toast = useToast();
  const [p, setP] = useState(parcours);
  const pool = catalog.questions.filter((q) => q.categorie === p.categorie);
  const toggle = (id: string) =>
    setP((x) => ({
      ...x,
      questionIds: x.questionIds.includes(id)
        ? x.questionIds.filter((y) => y !== id)
        : [...x.questionIds, id],
    }));
  return (
    <div className="space-y-4 p-6">
      <Field label="Titre">
        <TextInput value={p.titre} onChange={(e) => setP({ ...p, titre: e.target.value })} />
      </Field>
      <Field label="Description">
        <TextArea
          value={p.description}
          onChange={(e) => setP({ ...p, description: e.target.value })}
          rows={2}
        />
      </Field>
      <Field
        label="Seuil de validation"
        hint="Score minimal pour valider le parcours et gagner la carte associée."
      >
        <Select value={p.seuil} onChange={(e) => setP({ ...p, seuil: Number(e.target.value) })}>
          {[0.6, 0.7, 0.8, 0.9, 1].map((s) => (
            <option key={s} value={s}>
              {Math.round(s * 100)} %
            </option>
          ))}
        </Select>
      </Field>
      <div>
        <p className="mb-2 text-[13px] font-semibold text-navy-950">
          Questions du parcours ({p.questionIds.length})
        </p>
        <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line">
          {pool.map((q) => (
            <li key={q.id}>
              <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm hover:bg-canvas">
                <input
                  type="checkbox"
                  checked={p.questionIds.includes(q.id)}
                  onChange={() => toggle(q.id)}
                  className="mt-0.5 size-4 accent-[#153E75]"
                />
                <span className={cx(!q.publie && 'text-muted')}>
                  {q.enonce}
                  {!q.publie && ' (brouillon)'}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Toggle checked={p.publie} onChange={(v) => setP({ ...p, publie: v })} label="Publié" />
        <Button
          onClick={() =>
            p.questionIds.length < 2
              ? toast('Un parcours doit contenir au moins deux questions.', 'error')
              : onSave(p)
          }
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
