import { CheckCircle2, ChevronRight, Clock, Flame, Gift, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CardDetail } from '../components/cards/CardDetail';
import { GameCard, RARITY_STYLE } from '../components/cards/GameCard';
import { FloatingPack } from '../components/cards/Pack';
import { PackOpening } from '../components/cards/PackOpening';
import { useToast } from '../components/ui/overlay';
import {
  Avatar,
  Button,
  ProgressBar,
  Reveal,
  Ring,
  SectionTitle,
  cx,
} from '../components/ui/primitives';
import { RARITIES } from '../content/categories';
import { participantsActifs } from '../data/selectors';
import { backend, useSession } from '../data/store';
import { PackIndisponible, packDuJourOuvert, serie, type PackResult } from '../domain/packs';
import type { Card } from '../domain/types';

/** Temps restant avant minuit (nouveau pack), mis à jour chaque minute. */
function avantMinuit() {
  const now = new Date();
  const minuit = new Date(now);
  minuit.setHours(24, 0, 0, 0);
  const min = Math.ceil((minuit.getTime() - now.getTime()) / 60_000);
  return min >= 60
    ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
    : `${min} min`;
}

function useAvantMinuit() {
  const [v, setV] = useState(avantMinuit);
  useEffect(() => {
    const t = setInterval(() => setV(avantMinuit()), 60_000);
    return () => clearInterval(t);
  }, []);
  return v;
}

export function Home() {
  const { db, user, progress, cards } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [opening, setOpening] = useState<PackResult | null>(null);
  const [detail, setDetail] = useState<Card | null>(null);
  const [now] = useState(() => new Date());
  const tempsRestant = useAvantMinuit();
  if (!user || !progress) return null;

  const total = cards.length;
  const owned = new Map(progress.cards.map((c) => [c.cardId, c]));
  const ouvert = packDuJourOuvert(progress, new Date());
  const maSerie = serie(progress, new Date());
  const recentes = [...progress.cards]
    .sort((a, b) => b.firstAt.localeCompare(a.firstAt))
    .slice(0, 6)
    .map((o) => cards.find((c) => c.id === o.cardId))
    .filter((c): c is Card => !!c);
  const participants = participantsActifs(db, now);

  const open = (bonus: boolean) => {
    try {
      setOpening(bonus ? backend.openBonusPack() : backend.openDailyPack());
    } catch (e) {
      toast(e instanceof PackIndisponible ? e.message : 'Impossible d’ouvrir le pack.', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      {/* ───── Pack du jour ───── */}
      <Reveal className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
        <section className="panel relative overflow-hidden px-5 pb-6 pt-6 sm:px-8">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(245,197,66,0.22), transparent 70%)',
            }}
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="eyebrow">Bonjour {user.prenom}</p>
              <h1 className="mt-1 text-2xl font-extrabold text-navy-950">Pack du jour</h1>
            </div>
            {maSerie > 0 && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-sun/20 px-3 py-1.5 text-sm font-bold text-navy-950"
                title="Jours consécutifs"
              >
                <Flame size={16} className="text-sun-dark" /> {maSerie} jour{maSerie > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="relative py-7">
            <FloatingPack disabled={ouvert} onClick={() => open(false)} />
          </div>

          <div className="relative space-y-3">
            {ouvert ? (
              <>
                <div className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-navy/[0.06] text-lg font-bold text-navy/50">
                  <CheckCircle2 size={20} /> Pack du jour ouvert
                </div>
                <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
                  <Clock size={15} /> Nouveau pack dans {tempsRestant}
                </p>
              </>
            ) : (
              <Button
                variant="accent"
                size="lg"
                className="h-14 w-full text-lg"
                onClick={() => open(false)}
              >
                <Gift size={20} /> Ouvrir mon pack
              </Button>
            )}
            <Button variant="secondary" className="w-full" onClick={() => open(true)}>
              Pack bonus (démo)
            </Button>
          </div>
        </section>
      </Reveal>

      <div className="space-y-6 lg:col-span-7">
        {/* ───── Ma collection ───── */}
        <Reveal delay={0.05}>
          <section className="panel p-5 sm:p-6">
            <SectionTitle
              title="Ma collection"
              action={
                <Link
                  to="/collection"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue hover:underline"
                >
                  Tout voir <ChevronRight size={15} />
                </Link>
              }
            />
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <Ring value={owned.size / total} size={84} stroke={8} color="#F5C542">
                  <span className="text-base font-extrabold text-navy">
                    {Math.round((owned.size / total) * 100)}%
                  </span>
                </Ring>
                <div>
                  <p className="font-display text-3xl font-extrabold text-navy-950">
                    {owned.size}
                    <span className="text-lg text-muted">/{total}</span>
                  </p>
                  <p className="text-sm text-muted">cartes différentes</p>
                </div>
              </div>
              <ul className="grid flex-1 grid-cols-5 gap-2">
                {RARITIES.map((r) => {
                  const dansRarete = cards.filter((c) => c.rarete === r.id);
                  const n = dansRarete.filter((c) => owned.has(c.id)).length;
                  return (
                    <li key={r.id} className="rounded-xl bg-canvas px-2 py-2.5 text-center">
                      <span
                        className="mx-auto block size-2.5 rotate-45 rounded-[2px]"
                        style={{ background: RARITY_STYLE[r.id].accent }}
                      />
                      <p className="mt-1.5 font-display text-sm font-extrabold text-navy-950">
                        {n}/{dansRarete.length}
                      </p>
                      <p className="truncate text-[10px] font-medium text-muted">{r.nom}</p>
                    </li>
                  );
                })}
              </ul>
            </div>

            {recentes.length > 0 && (
              <>
                <p className="eyebrow mb-2 mt-6">Dernières cartes obtenues</p>
                <div className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 pt-2 sm:-mx-6 sm:px-6">
                  {recentes.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <GameCard
                        card={c}
                        total={total}
                        size="sm"
                        width={120}
                        count={owned.get(c.id)?.count}
                        onClick={() => setDetail(c)}
                      />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </section>
        </Reveal>

        {/* ───── Participants actifs ───── */}
        <Reveal delay={0.1}>
          <section className="panel p-5 sm:p-6">
            <SectionTitle
              title="Participants actifs"
              subtitle="Collaborateurs ayant ouvert un pack ces 7 derniers jours"
              action={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-light px-3 py-1 text-sm font-semibold text-navy">
                  <Users size={15} /> {participants.length}
                </span>
              }
            />
            <ol className="divide-y divide-line">
              {participants.map((p, i) => {
                const me = p.user.id === user.id;
                return (
                  <motion.li
                    key={p.user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.03 }}
                    className={cx(
                      'flex items-center gap-3 py-3',
                      me && '-mx-3 rounded-xl bg-sun/15 px-3',
                    )}
                  >
                    <span
                      className={cx(
                        'w-6 text-center font-display text-sm font-extrabold',
                        i < 3 ? 'text-sun-dark' : 'text-muted',
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="relative">
                      <Avatar user={p.user} size={40} />
                      {p.ouvertAujourdhui && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-success ring-2 ring-white"
                          title="Pack du jour ouvert"
                        >
                          <CheckCircle2 size={10} className="text-white" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-950">
                        {p.user.prenom} {p.user.nom}{' '}
                        {me && <span className="font-medium text-muted">(toi)</span>}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <ProgressBar value={p.cartes / total} height={5} className="max-w-40" />
                        <span className="shrink-0 text-xs font-semibold text-navy">
                          {p.cartes}/{total}
                        </span>
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-muted">{p.user.service}</p>
                      {p.serie > 1 && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-sun-dark">
                          <Flame size={12} /> {p.serie} jours
                        </p>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </section>
        </Reveal>
      </div>

      <PackOpening
        result={opening}
        total={total}
        onClose={() => setOpening(null)}
        onCollection={() => {
          setOpening(null);
          navigate('/collection');
        }}
      />
      <CardDetail
        card={detail}
        total={total}
        owned
        count={detail ? owned.get(detail.id)?.count : undefined}
        obtainedAt={detail ? owned.get(detail.id)?.firstAt : undefined}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
