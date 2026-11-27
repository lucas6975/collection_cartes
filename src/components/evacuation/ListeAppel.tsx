// Liste d'appel du poste de garde : photo scannée (ou saisie), vérifiée, puis comparée aux
// présents déclarés dans l'appli. En vert : sur les deux. En rouge : sur la liste mais pas dans
// l'appli (à retrouver), ou dans l'appli mais pas sur la liste.
import { Camera, CheckCircle2, ClipboardList, PencilLine, TriangleAlert } from 'lucide-react';
import { useRef, useState } from 'react';
import type { PresentEvacuation } from '../../data/api';
import { lireListeAppel } from '../../data/ocr';
import { extraireNoms, type Comparaison } from '../../domain/appel';

const ROUGE = '#DC2626';
const VERT = '#16A34A';

export function ListeAppel({
  liste,
  comparaison,
  onEnregistrer,
}: {
  liste: string[] | null;
  comparaison: Comparaison<PresentEvacuation> | null;
  onEnregistrer: (noms: string[] | null) => Promise<void>;
}) {
  const [mode, setMode] = useState<'vue' | 'lecture' | 'revision'>('vue');
  const [texte, setTexte] = useState('');
  const [progres, setProgres] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const photo = useRef<HTMLInputElement>(null);

  const scanner = async (fichiers: FileList | null) => {
    if (!fichiers?.length) return;
    setErreur(null);
    setMode('lecture');
    const lus: string[] = [];
    try {
      for (let i = 0; i < fichiers.length; i++) {
        lus.push(
          ...(await lireListeAppel(fichiers[i], (p) => setProgres((i + p) / fichiers.length))),
        );
      }
      // On ajoute aux noms déjà en cours de vérification (plusieurs pages).
      setTexte((t) => [t.trim(), ...lus].filter(Boolean).join('\n'));
      setMode('revision');
    } catch {
      setErreur(
        'La lecture de la photo n’a pas marché. Réessaie avec une photo bien droite et nette, ou saisis les noms.',
      );
      setMode(texte ? 'revision' : 'vue');
    } finally {
      if (photo.current) photo.current.value = '';
    }
  };

  const noms = extraireNoms(texte);
  const valider = async () => {
    setEnvoi(true);
    try {
      await onEnregistrer(noms);
      setMode('vue');
    } finally {
      setEnvoi(false);
    }
  };
  const modifier = () => {
    setTexte((liste ?? []).join('\n'));
    setMode('revision');
  };

  const entree = (
    <input
      ref={photo}
      type="file"
      accept="image/*"
      capture="environment"
      multiple
      className="hidden"
      onChange={(e) => void scanner(e.target.files)}
    />
  );

  return (
    <section className="panel space-y-3 p-4">
      {entree}
      <p className="eyebrow flex items-center gap-1.5">
        <ClipboardList size={15} /> Liste d’appel du poste de garde
      </p>

      {erreur && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {erreur}
        </p>
      )}

      {mode === 'lecture' && (
        <div className="space-y-2 py-2 text-center">
          <p className="font-display font-extrabold text-navy-950">Ulysse lit la liste…</p>
          <div className="h-3 overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-[#DC2626] transition-[width]"
              style={{ width: `${Math.round(progres * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted">{Math.round(progres * 100)} %</p>
        </div>
      )}

      {mode === 'revision' && (
        <div className="space-y-2">
          <p className="text-sm text-navy-950">
            <b>
              {noms.length} nom{noms.length > 1 ? 's' : ''}
            </b>{' '}
            · vérifie et corrige si besoin (une personne par ligne : NOM Prénom).
          </p>
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={10}
            placeholder={'DUPONT Jean\nMARTIN Julie\n…'}
            className="w-full rounded-xl border border-line p-3 font-mono text-[15px] leading-relaxed outline-none focus:border-[#DC2626]"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => photo.current?.click()}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-canvas text-sm font-bold text-navy-950"
            >
              <Camera size={16} /> Ajouter une page
            </button>
            <button
              type="button"
              onClick={() => setMode('vue')}
              className="h-11 rounded-xl bg-canvas text-sm font-bold text-muted"
            >
              Annuler
            </button>
          </div>
          <button
            type="button"
            disabled={!noms.length || envoi}
            onClick={() => void valider()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-950 font-extrabold text-white disabled:opacity-40"
          >
            <CheckCircle2 size={18} /> {envoi ? 'Enregistrement…' : 'Comparer avec l’appli'}
          </button>
        </div>
      )}

      {mode === 'vue' && !liste?.length && (
        <>
          <p className="text-sm text-muted">
            Prends en photo la liste imprimée par le poste de garde : Ulysse lit les noms et les
            compare aux personnes déclarées présentes dans l’appli.
          </p>
          <button
            type="button"
            onClick={() => photo.current?.click()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#DC2626] text-base font-extrabold text-white shadow-soft"
          >
            <Camera size={20} /> Scanner la liste d’appel
          </button>
          <button
            type="button"
            onClick={modifier}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-canvas text-sm font-bold text-navy-950"
          >
            <PencilLine size={16} /> Saisir les noms à la main
          </button>
        </>
      )}

      {mode === 'vue' && liste?.length && comparaison ? (
        <Resultat
          comparaison={comparaison}
          total={liste.length}
          onRescanner={() => {
            setTexte('');
            photo.current?.click();
          }}
          onModifier={modifier}
        />
      ) : null}
    </section>
  );
}

function Resultat({
  comparaison,
  total,
  onRescanner,
  onModifier,
}: {
  comparaison: Comparaison<PresentEvacuation>;
  total: number;
  onRescanner: () => void;
  onModifier: () => void;
}) {
  const { ensemble, manquants, horsListe } = comparaison;
  const tuile = (n: number, texte: string, couleur: string) => (
    <div className="rounded-2xl p-2.5 text-center text-white" style={{ background: couleur }}>
      <p className="font-display text-[28px] leading-none font-extrabold">{n}</p>
      <p className="mt-1 text-[11px] leading-tight font-semibold text-white/90">{texte}</p>
    </div>
  );
  const nomPresent = (p: PresentEvacuation) => `${p.nom.toUpperCase()} ${p.prenom}`;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {total} personne{total > 1 ? 's' : ''} sur la liste d’appel
      </p>
      <div className="grid grid-cols-3 gap-2">
        {tuile(ensemble.length, 'sur la liste et dans l’appli', VERT)}
        {tuile(
          manquants.length,
          'sur la liste, pas dans l’appli',
          manquants.length ? ROUGE : '#94A3B8',
        )}
        {tuile(
          horsListe.length,
          'dans l’appli, pas sur la liste',
          horsListe.length ? ROUGE : '#94A3B8',
        )}
      </div>

      {manquants.length > 0 && (
        <div
          className="rounded-2xl border-2 p-3"
          style={{ borderColor: ROUGE, background: '#FEF2F2' }}
        >
          <p
            className="mb-2 flex items-center gap-1.5 text-sm font-extrabold"
            style={{ color: ROUGE }}
          >
            <TriangleAlert size={16} /> À retrouver : sur la liste, pas déclaré(e)s présent(e)s
          </p>
          <ul className="space-y-1.5">
            {manquants.map((n) => (
              <li
                key={n}
                className="flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-white"
                style={{ background: ROUGE }}
              >
                <span className="size-2.5 shrink-0 rounded-full bg-white" /> {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {horsListe.length > 0 && (
        <div
          className="rounded-2xl border-2 p-3"
          style={{ borderColor: ROUGE, background: '#FEF2F2' }}
        >
          <p className="mb-2 text-sm font-extrabold" style={{ color: ROUGE }}>
            Présent(e)s dans l’appli, absent(e)s de la liste
          </p>
          <ul className="space-y-1.5">
            {horsListe.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-bold"
                style={{ background: '#FEE2E2', color: '#991B1B' }}
              >
                <span>{nomPresent(p)}</span>
                <span className="text-xs font-semibold">
                  {p.statut}
                  {p.societe ? ` · ${p.societe}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ensemble.length > 0 && (
        <div
          className="rounded-2xl border-2 p-3"
          style={{ borderColor: VERT, background: '#F0FDF4' }}
        >
          <p
            className="mb-2 flex items-center gap-1.5 text-sm font-extrabold"
            style={{ color: VERT }}
          >
            <CheckCircle2 size={16} /> Sur la liste et présent(e)s dans l’appli
          </p>
          <ul className="space-y-1">
            {ensemble.map(({ liste, present }) => (
              <li
                key={present.id}
                className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold"
                style={{ background: '#DCFCE7', color: '#166534' }}
              >
                <CheckCircle2 size={15} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{liste}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!manquants.length && !horsListe.length && (
        <p
          className="rounded-xl px-3 py-2 text-center text-sm font-extrabold text-white"
          style={{ background: VERT }}
        >
          ✅ Tout le monde est retrouvé : la liste et l’appli correspondent.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRescanner}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-canvas text-sm font-bold text-navy-950"
        >
          <Camera size={16} /> Rescanner
        </button>
        <button
          type="button"
          onClick={onModifier}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-canvas text-sm font-bold text-navy-950"
        >
          <PencilLine size={16} /> Corriger la liste
        </button>
      </div>
    </div>
  );
}
