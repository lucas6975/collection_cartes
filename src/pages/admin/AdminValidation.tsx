import { BadgeCheck, ExternalLink, Info, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { NatureBadge } from '../../components/cards/CardDetail';
import { Toggle } from '../../components/ui/form';
import { Icon } from '../../components/ui/Icon';
import { useToast } from '../../components/ui/overlay';
import { Button, Chip, PageHeader, cx } from '../../components/ui/primitives';
import { CATEGORY_BY_ID } from '../../content/categories';
import { backend, useSession } from '../../data/store';
import type { CategoryId, Traceable } from '../../domain/types';

type Kind = 'card' | 'question' | 'scenario';
interface Item {
  kind: Kind;
  id: string;
  titre: string;
  detail: string;
  categorie: CategoryId;
  t: Traceable;
}

const KIND_LABEL: Record<Kind, string> = {
  card: 'Carte',
  question: 'Question',
  scenario: 'Mise en situation',
};

export default function AdminValidation() {
  const { catalog, user } = useSession();
  const toast = useToast();
  const [statut, setStatut] = useState<'a-verifier' | 'valide' | 'tous'>('a-verifier');
  const [kind, setKind] = useState<Kind | 'tous'>('tous');

  const items: Item[] = [
    ...catalog.cards.map((c) => ({
      kind: 'card' as const,
      id: c.id,
      titre: c.nom,
      detail: `${c.description} — À retenir : ${c.aRetenir}`,
      categorie: c.categorie,
      t: c,
    })),
    ...catalog.questions.map((q) => ({
      kind: 'question' as const,
      id: q.id,
      titre: q.enonce,
      detail: `Réponse : ${q.choix.find((x) => x.id === q.bonneReponse)?.texte}. ${q.explication}`,
      categorie: q.categorie,
      t: q,
    })),
    ...catalog.scenarios.map((s) => ({
      kind: 'scenario' as const,
      id: s.id,
      titre: s.titre,
      detail: `${s.etapes.length} étapes. ${s.accroche}`,
      categorie: s.categorie,
      t: s,
    })),
  ];
  const aVerifier = items.filter((i) => i.t.verification.statut === 'a-verifier').length;
  const list = items.filter(
    (i) =>
      (statut === 'tous' || i.t.verification.statut === statut) &&
      (kind === 'tous' || i.kind === kind),
  );

  const valider = (i: Item) => {
    backend.setVerification(i.kind, i.id, {
      statut: 'valide',
      date: new Date().toISOString().slice(0, 10),
      par: user ? `${user.prenom} ${user.nom}` : null,
    });
    toast('Contenu marqué comme vérifié');
  };
  const invalider = (i: Item) => {
    backend.setVerification(i.kind, i.id, { statut: 'a-verifier', date: null, par: null });
    toast('Contenu repassé à vérifier', 'info');
  };
  const publier = (i: Item, v: boolean) => {
    try {
      backend.setPublication(i.kind, i.id, v);
      toast(v ? 'Contenu publié' : 'Contenu retiré de la publication', v ? 'success' : 'info');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erreur', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Fiabilité"
        title="Validation des contenus"
        description="Chaque information pédagogique doit être contrôlée auprès de sa source avant d’être publiée."
      >
        <div className="panel flex items-center gap-3 px-4 py-3">
          <ShieldCheck size={22} className={aVerifier ? 'text-sun-dark' : 'text-success'} />
          <div>
            <p className="font-display text-xl font-extrabold text-navy-950">{aVerifier}</p>
            <p className="text-xs text-muted">contenus à vérifier</p>
          </div>
        </div>
      </PageHeader>

      <div className="mb-5 flex gap-3 rounded-2xl border border-blue/20 bg-blue-light p-4 text-sm text-navy">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>
          Les contenus de démonstration sont publiés pour permettre l’essai de la plateforme, mais{' '}
          <strong>n’ont pas encore été vérifiés</strong>. Avant un usage réel, le référent sécurité
          doit contrôler chaque élément auprès de sa source (INRS, Légifrance, Assurance Maladie,
          ministère du Travail) et vérifier sa nature : obligation, norme, recommandation ou
          pratique interne.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ['a-verifier', 'À vérifier'],
            ['valide', 'Vérifiés'],
            ['tous', 'Tous'],
          ] as const
        ).map(([v, l]) => (
          <Chip key={v} active={statut === v} onClick={() => setStatut(v)}>
            {l}
          </Chip>
        ))}
        <span className="mx-1 w-px bg-line" />
        {(['tous', 'card', 'question', 'scenario'] as const).map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {k === 'tous' ? 'Tous types' : KIND_LABEL[k]}
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="panel flex flex-col items-center p-12 text-center">
          <BadgeCheck size={36} className="text-success" />
          <p className="mt-3 font-semibold text-navy-950">Aucun contenu dans cette sélection</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((i) => {
            const cat = CATEGORY_BY_ID[i.categorie];
            const ok = i.t.verification.statut === 'valide';
            return (
              <li key={`${i.kind}-${i.id}`} className="panel p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="grid size-7 place-items-center rounded-lg"
                        style={{ background: cat.fond, color: cat.couleur }}
                      >
                        <Icon name={cat.icone} size={14} />
                      </span>
                      <span className="text-xs font-semibold text-muted">
                        {KIND_LABEL[i.kind]} · {cat.court}
                      </span>
                      <NatureBadge nature={i.t.nature} />
                      {!i.t.publie && (
                        <span className="rounded-md bg-navy/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">
                          Non publié
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-semibold text-navy-950">{i.titre}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{i.detail}</p>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {i.t.sources.map((s) => (
                        <li key={s.label} className="text-xs">
                          {s.url ? (
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-blue hover:underline"
                            >
                              {s.label} <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="font-medium text-ink/70">{s.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex shrink-0 flex-col gap-3 border-t border-line pt-3 lg:w-56 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <p
                      className={cx('text-xs font-semibold', ok ? 'text-success' : 'text-sun-dark')}
                    >
                      {ok
                        ? `Vérifié le ${new Date(i.t.verification.date!).toLocaleDateString('fr-FR')}${i.t.verification.par ? ` par ${i.t.verification.par}` : ''}`
                        : 'Non vérifié'}
                    </p>
                    {ok ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => invalider(i)}
                        className="justify-start px-0"
                      >
                        <RotateCcw size={14} /> Repasser à vérifier
                      </Button>
                    ) : (
                      <Button size="sm" variant="primary" onClick={() => valider(i)}>
                        <BadgeCheck size={15} /> Marquer comme vérifié
                      </Button>
                    )}
                    <Toggle checked={i.t.publie} onChange={(v) => publier(i, v)} label="Publié" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('Réinitialiser toutes les données de démonstration ?')) {
              backend.resetDemo();
              toast('Données de démonstration réinitialisées', 'info');
            }
          }}
        >
          <RotateCcw size={14} /> Réinitialiser les données de démonstration
        </Button>
      </div>
    </div>
  );
}
