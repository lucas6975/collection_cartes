import {
  BadgeCheck,
  CalendarDays,
  Copy,
  ExternalLink,
  Lightbulb,
  Lock,
  ShieldAlert,
  Star,
} from 'lucide-react';
import { CATEGORY_BY_ID, NATURE_LABEL, RARITY_BY_ID } from '../../content/categories';
import type { Card, Nature } from '../../domain/types';
import { Modal } from '../ui/overlay';
import { cx } from '../ui/primitives';
import { GameCard, RARITY_STYLE } from './GameCard';

const NATURE_STYLE: Record<Nature, string> = {
  obligation: 'bg-navy text-white',
  norme: 'bg-blue-light text-navy',
  recommandation: 'bg-success/10 text-success',
  'pratique-interne': 'bg-cat-organisation/10 text-cat-organisation',
};

export function NatureBadge({ nature }: { nature: Nature }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        NATURE_STYLE[nature],
      )}
    >
      {nature === 'obligation' && <ShieldAlert size={12} />}
      {NATURE_LABEL[nature]}
    </span>
  );
}

function SourcesBlock({ card }: { card: Card }) {
  const v = card.verification;
  return (
    <div className="rounded-2xl border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">Sources</p>
        {v.statut === 'valide' && v.date ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
            <BadgeCheck size={13} /> Vérifié le {new Date(v.date).toLocaleDateString('fr-FR')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-sun/20 px-2 py-0.5 text-[11px] font-semibold text-sun-dark">
            Contenu à vérifier
          </span>
        )}
      </div>
      <ul className="mt-2 space-y-1">
        {card.sources.map((s) => (
          <li key={s.label} className="text-[13px] text-ink/80">
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-blue hover:underline"
              >
                {s.label} <ExternalLink size={11} />
              </a>
            ) : (
              s.label
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CardDetail({
  card,
  total,
  owned,
  count,
  obtainedAt,
  onClose,
}: {
  card: Card | null;
  total: number;
  owned: boolean;
  count?: number;
  obtainedAt?: string;
  onClose: () => void;
}) {
  return (
    <Modal open={!!card} onClose={onClose} size="xl">
      {card && (
        <div className="grid md:grid-cols-[minmax(0,380px)_1fr]">
          <div
            className="relative flex items-center justify-center overflow-hidden px-6 pb-8 pt-10 md:rounded-l-3xl md:py-12"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${CATEGORY_BY_ID[card.categorie].couleur}33, transparent 65%), linear-gradient(160deg, #153E75, #0B2347)`,
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: 'radial-gradient(#fff 1px, transparent 1.2px)',
                backgroundSize: '16px 16px',
              }}
            />
            <div className="relative w-[230px] sm:w-[280px]">
              <GameCard card={card} total={total} size="lg" locked={!owned} className="w-full" />
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-semibold"
                style={{ color: CATEGORY_BY_ID[card.categorie].couleur }}
              >
                {CATEGORY_BY_ID[card.categorie].nom}
              </span>
              <span className="text-line">•</span>
              <span className={cx('text-xs font-semibold', RARITY_STYLE[card.rarete].label)}>
                {RARITY_BY_ID[card.rarete].nom}
              </span>
              <span className="text-line">•</span>
              <span className="text-xs font-semibold text-muted">
                N° {String(card.numero).padStart(3, '0')}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-navy-950 sm:text-3xl">
              {owned ? card.nom : 'Carte à découvrir'}
            </h2>

            {owned ? (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <NatureBadge nature={card.nature} />
                  {obtainedAt && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <CalendarDays size={13} /> Obtenue le{' '}
                      {new Date(obtainedAt).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  {count !== undefined && count > 1 && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <Copy size={13} /> {count} exemplaires
                    </span>
                  )}
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-ink/85">{card.description}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{card.info}</p>

                <div className="mt-5 rounded-2xl border border-sun/50 bg-sun/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-navy-950">
                    <Lightbulb size={16} className="text-sun-dark" /> Le savais-tu ?
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{card.leSavaisTu}</p>
                </div>

                <div className="mt-3 rounded-2xl bg-navy p-4 text-white">
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <Star size={16} className="fill-sun text-sun" /> À retenir
                  </p>
                  <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-white/95">
                    {card.aRetenir}
                  </p>
                </div>

                <div className="mt-4">
                  <SourcesBlock card={card} />
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-navy/20 bg-canvas p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-navy-950">
                  <Lock size={16} /> Pas encore dans ta collection
                </p>
                <p className="mt-2 text-[15px] text-ink/80">
                  Ouvre ton pack chaque jour pour tenter de l’obtenir. Plus une carte est rare, plus
                  elle est difficile à trouver.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
