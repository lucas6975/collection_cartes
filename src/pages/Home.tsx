import { CheckCircle2, ChevronRight, Clock, Flame, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CardBack } from '../components/cards/CardBack';
import { CardDetail } from '../components/cards/CardDetail';
import { GameCard, RARITY_STYLE } from '../components/cards/GameCard';
import { FloatingPack } from '../components/cards/Pack';
import { PackOpening } from '../components/cards/PackOpening';
import { useToast } from '../components/ui/overlay';
import { Button, Reveal, Ring, SectionTitle } from '../components/ui/primitives';
import { RARITIES } from '../content/categories';
import { game, useGame } from '../data/store';
import { PackIndisponible, packDuJourOuvert, serie, type PackResult } from '../domain/packs';
import type { Card } from '../domain/types';

/** Temps restant avant minuit (nouveau pack). */
function avantMinuit(now: Date) {
  const minuit = new Date(now);
  minuit.setHours(24, 0, 0, 0);
  const min = Math.ceil((minuit.getTime() - now.getTime()) / 60_000);
  return min >= 60
    ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
    : `${min} min`;
}

/** Heure courante rafraîchie chaque minute : à minuit, le nouveau pack apparaît sans recharger. */
function useHorloge() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return { tempsRestant: avantMinuit(now), now };
}

export function Home() {
  const { progress, cards } = useGame();
  const navigate = useNavigate();
  const toast = useToast();
  const [opening, setOpening] = useState<PackResult | null>(null);
  const [detail, setDetail] = useState<Card | null>(null);
  const { tempsRestant, now } = useHorloge();

  const total = cards.length;
  const owned = new Map(progress.cards.map((c) => [c.cardId, c]));
  const ouvert = packDuJourOuvert(progress, now);
  const maSerie = serie(progress, now);
  const premierPack = progress.packs.length === 0;
  const recentes = [...progress.cards]
    .sort((a, b) => b.firstAt.localeCompare(a.firstAt))
    .slice(0, 6)
    .map((o) => cards.find((c) => c.id === o.cardId))
    .filter((c): c is Card => !!c);

  const open = () => {
    try {
      setOpening(game.openDailyPack());
    } catch (e) {
      toast(e instanceof PackIndisponible ? e.message : 'Impossible d’ouvrir le pack.', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      {/* ───── Pack du jour ───── */}
      <Reveal className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
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
              <p className="eyebrow">{premierPack ? 'Bienvenue' : 'Bon retour'}</p>
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
            <FloatingPack disabled={ouvert} onClick={open} />
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
              <>
                <Button variant="accent" size="lg" className="h-14 w-full text-lg" onClick={open}>
                  <Gift size={20} /> {premierPack ? 'Ouvrir mon premier pack' : 'Ouvrir mon pack'}
                </Button>
                <p className="text-center text-sm text-muted">
                  5 cartes sécurité, un nouveau pack chaque jour.
                </p>
              </>
            )}
          </div>
        </section>
      </Reveal>

      {/* ───── Ma collection ───── */}
      <Reveal delay={0.05} className="lg:col-span-7">
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

          {recentes.length > 0 ? (
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
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-navy/20 bg-canvas/60 p-5">
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-[5/7] w-[52px] opacity-70"
                    style={{ rotate: `${(i - 2) * 4}deg` }}
                  >
                    <CardBack size="sm" />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center font-semibold text-navy-950">
                Ta collection est vide pour l’instant
              </p>
              <p className="mt-1 text-center text-sm text-muted">
                Ouvre ton premier pack pour obtenir tes 5 premières cartes sécurité.
              </p>
            </div>
          )}
        </section>

        <p className="mt-4 px-1 text-center text-xs text-muted">
          Ta collection est enregistrée dans ce navigateur : reviens chaque jour sur le même
          appareil pour la compléter.
        </p>
      </Reveal>

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
