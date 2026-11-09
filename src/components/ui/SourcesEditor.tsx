import { Plus, X } from 'lucide-react';
import { NATURE_LABEL } from '../../content/categories';
import type { Nature, Source } from '../../domain/types';
import { Field, Select, TextInput } from './form';

/** Édition de la nature d'un contenu et de ses sources (communs aux cartes, questions, scénarios). */
export function TraceEditor({
  nature,
  sources,
  onChange,
}: {
  nature: Nature;
  sources: Source[];
  onChange: (nature: Nature, sources: Source[]) => void;
}) {
  const setSource = (i: number, patch: Partial<Source>) =>
    onChange(
      nature,
      sources.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    );
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-canvas/50 p-4">
      <Field
        label="Nature de l’information"
        hint="Ne jamais présenter une recommandation comme une obligation réglementaire."
      >
        <Select value={nature} onChange={(e) => onChange(e.target.value as Nature, sources)}>
          {(Object.keys(NATURE_LABEL) as Nature[]).map((n) => (
            <option key={n} value={n}>
              {NATURE_LABEL[n]}
            </option>
          ))}
        </Select>
      </Field>
      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-navy-950">Sources</p>
        <div className="space-y-2">
          {sources.map((s, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <TextInput
                value={s.label}
                onChange={(e) => setSource(i, { label: e.target.value })}
                placeholder="Ex. : Code du travail, art. R4227-28"
                className="sm:flex-[1.3]"
              />
              <div className="flex flex-1 gap-2">
                <TextInput
                  value={s.url ?? ''}
                  onChange={(e) => setSource(i, { url: e.target.value || undefined })}
                  placeholder="https://… (facultatif)"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      nature,
                      sources.filter((_, j) => j !== i),
                    )
                  }
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-danger/10 hover:text-danger"
                  aria-label="Retirer la source"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange(nature, [...sources, { label: '' }])}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue hover:underline"
        >
          <Plus size={15} /> Ajouter une source
        </button>
      </div>
    </div>
  );
}
