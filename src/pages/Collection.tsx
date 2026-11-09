import { ArrowDownUp, Search, SearchX, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { CardDetail } from '../components/cards/CardDetail';
import { GameCard } from '../components/cards/GameCard';
import { Icon } from '../components/ui/Icon';
import { Chip, PageHeader, ProgressBar, Ring, cx } from '../components/ui/primitives';
import { CATEGORIES, RARITIES, RARITY_BY_ID } from '../content/categories';
import { useGame } from '../data/store';
import type { Card, CategoryId, Rarity } from '../domain/types';

type Sort = 'numero' | 'date' | 'rarete';

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function Collection() {
  const { progress, cards } = useGame();
  const [params, setParams] = useSearchParams();
  const cat = (params.get('cat') as CategoryId | null) ?? null;
  const [rarete, setRarete] = useState<Rarity | ''>('');
  const [sort, setSort] = useState<Sort>('numero');
  const [query, setQuery] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);
  const [detail, setDetail] = useState<Card | null>(null);

  const owned = new Map(progress.cards.map((c) => [c.cardId, c]));
  const total = cards.length;
  const ratio = owned.size / total;

  const filtered = cards
    .filter((c) => !cat || c.categorie === cat)
    .filter((c) => !rarete || c.rarete === rarete)
    .filter((c) => !missingOnly || !owned.has(c.id))
    .filter((c) => {
      if (!query.trim()) return true;
      const q = normalize(query.trim());
      // Les cartes non obtenues restent mystérieuses : on ne cherche que dans leur numéro.
      return owned.has(c.id)
        ? normalize(`${c.nom} ${c.description}`).includes(q)
        : String(c.numero).includes(q);
    })
    .sort((a, b) => {
      if (sort === 'date') {
        const da = owned.get(a.id)?.firstAt ?? '';
        const dbb = owned.get(b.id)?.firstAt ?? '';
        if (da !== dbb) return dbb.localeCompare(da);
      }
      if (sort === 'rarete') {
        const d = RARITY_BY_ID[b.rarete].rang - RARITY_BY_ID[a.rarete].rang;
        if (d) return d;
      }
      return a.numero - b.numero;
    });

  const setCat = (id: CategoryId | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('cat', id);
    else next.delete('cat');
    setParams(next, { replace: true });
  };

  // En tri par numéro, l'album est organisé en pages par famille.
  const grouped = sort === 'numero' && !query.trim();
  const groups = grouped
    ? CATEGORIES.filter((c) => !cat || c.id === cat)
        .map((c) => ({ meta: c, cards: filtered.filter((x) => x.categorie === c.id) }))
        .filter((g) => g.cards.length)
    : [{ meta: null, cards: filtered }];

  return (
    <div>
      <PageHeader
        eyebrow="Album"
        title="Ma collection"
        description="Chaque carte rappelle une règle de sécurité. Les cartes encore à découvrir montrent leur verso."
      >
        <div className="panel flex items-center gap-4 px-5 py-4">
          <Ring value={ratio} size={64} stroke={6} color="#F5C542">
            <span className="text-sm font-extrabold text-navy">{Math.round(ratio * 100)}%</span>
          </Ring>
          <div>
            <p className="font-display text-2xl font-extrabold text-navy-950">
              {owned.size}
              <span className="text-base text-muted">/{total}</span>
            </p>
            <p className="text-xs text-muted">{total - owned.size} cartes manquantes</p>
          </div>
        </div>
      </PageHeader>

      {/* ───── Filtres ───── */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une carte ou un numéro…"
              className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm outline-none transition-shadow placeholder:text-muted/80 focus:border-blue focus:ring-4 focus:ring-blue/10"
            />
          </label>
          <div className="flex gap-2">
            <select
              value={rarete}
              onChange={(e) => setRarete(e.target.value as Rarity | '')}
              className="h-11 flex-1 rounded-xl border border-line bg-white px-3 text-sm font-medium text-ink outline-none focus:border-blue md:flex-none"
              aria-label="Filtrer par rareté"
            >
              <option value="">Toutes raretés</option>
              {RARITIES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </select>
            <label className="relative flex-1 md:flex-none">
              <ArrowDownUp
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-11 w-full appearance-none rounded-xl border border-line bg-white pl-9 pr-4 text-sm font-medium text-ink outline-none focus:border-blue"
                aria-label="Trier"
              >
                <option value="numero">Par numéro</option>
                <option value="date">Par date d’obtention</option>
                <option value="rarete">Par rareté</option>
              </select>
            </label>
          </div>
        </div>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip active={!cat} onClick={() => setCat(null)}>
            Toutes
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={cat === c.id}
              onClick={() => setCat(cat === c.id ? null : c.id)}
              color={c.couleur}
            >
              <Icon name={c.icone} size={15} />
              {c.court}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          <Chip active={missingOnly} onClick={() => setMissingOnly((v) => !v)}>
            Manquantes uniquement
          </Chip>
        </div>
      </div>

      {/* ───── Album ───── */}
      {filtered.length === 0 ? (
        <div className="panel flex flex-col items-center px-6 py-16 text-center">
          <SearchX size={36} className="text-muted" />
          <p className="mt-3 font-semibold text-navy-950">Aucune carte ne correspond</p>
          <p className="mt-1 text-sm text-muted">Essaie d’élargir les filtres ou la recherche.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => {
            const obtenues = g.cards.filter((c) => owned.has(c.id)).length;
            const familleTotal = g.meta
              ? cards.filter((c) => c.categorie === g.meta!.id).length
              : 0;
            const familleObtenues = g.meta
              ? cards.filter((c) => c.categorie === g.meta!.id && owned.has(c.id)).length
              : obtenues;
            const complete = !!g.meta && familleObtenues === familleTotal;
            return (
              <section key={g.meta?.id ?? 'all'}>
                {g.meta && (
                  <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span
                      className="grid size-10 place-items-center rounded-xl"
                      style={{ background: g.meta.fond, color: g.meta.couleur }}
                    >
                      <Icon name={g.meta.icone} size={20} />
                    </span>
                    <div className="min-w-[180px] flex-1">
                      <h2 className="text-lg font-bold text-navy-950">{g.meta.nom}</h2>
                      <p className="text-xs text-muted">{g.meta.description}</p>
                    </div>
                    <div className="flex w-full items-center gap-3 sm:w-56">
                      <ProgressBar
                        value={familleObtenues / familleTotal}
                        tone={g.meta.couleur}
                        height={6}
                      />
                      <span
                        className={cx(
                          'shrink-0 text-xs font-bold',
                          complete ? 'text-success' : 'text-muted',
                        )}
                      >
                        {complete ? (
                          <span className="inline-flex items-center gap-1">
                            <Trophy size={13} /> Complète
                          </span>
                        ) : (
                          `${familleObtenues}/${familleTotal}`
                        )}
                      </span>
                    </div>
                  </div>
                )}
                <div
                  className="rounded-3xl border border-line bg-white/60 p-3 sm:p-5"
                  style={
                    g.meta
                      ? {
                          backgroundImage: `linear-gradient(180deg, ${g.meta.fond}80, transparent 140px)`,
                        }
                      : undefined
                  }
                >
                  <motion.div
                    layout
                    className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6"
                  >
                    <AnimatePresence mode="popLayout">
                      {g.cards.map((c, i) => (
                        <motion.div
                          key={c.id}
                          layout
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.94 }}
                          transition={{ duration: 0.25, delay: Math.min(i * 0.025, 0.3) }}
                        >
                          <GameCard
                            card={c}
                            total={total}
                            size="md"
                            className="w-full"
                            locked={!owned.has(c.id)}
                            count={owned.get(c.id)?.count}
                            onClick={() => setDetail(c)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <CardDetail
        card={detail}
        total={total}
        owned={!!detail && owned.has(detail.id)}
        count={detail ? owned.get(detail.id)?.count : undefined}
        obtainedAt={detail ? owned.get(detail.id)?.firstAt : undefined}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
