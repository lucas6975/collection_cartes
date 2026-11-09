import { ArrowRight, CheckCircle2, Flame, Lock, MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { GameCard } from '../components/cards/GameCard';
import { Icon } from '../components/ui/Icon';
import { Button, PageHeader, Reveal, SectionTitle, cx } from '../components/ui/primitives';
import { CATEGORY_BY_ID } from '../content/categories';
import { useSession } from '../data/store';
import {
  ACHIEVEMENTS,
  XP,
  defiDuJour,
  ownsCard,
  published,
  scenarioValide,
} from '../domain/engine';

export function Challenges() {
  const { catalog, progress } = useSession();
  const navigate = useNavigate();
  if (!progress) return null;
  const total = published(catalog.cards).length;
  const daily = defiDuJour(catalog, new Date());
  const done = progress.quotidiens.includes(daily.jour);
  const dcat = CATEGORY_BY_ID[daily.categorie];

  // Les 7 derniers jours, pour visualiser la régularité.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    return {
      iso,
      label: d.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2),
      ok: progress.quotidiens.includes(iso),
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Défis"
        title="Relève les défis"
        description="Un défi quotidien pour garder les bons réflexes et des mises en situation inspirées de cas réels."
      />

      {/* ───── Défi du jour ───── */}
      <Reveal>
        <section className="relative overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line">
          <div className="grid md:grid-cols-[1fr_auto]">
            <div className="p-6 sm:p-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sun/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-navy-950">
                <Flame size={12} className="text-sun-dark" /> Défi du jour
              </span>
              <h2 className="mt-4 text-2xl font-extrabold text-navy-950">{dcat.nom}</h2>
              <p className="mt-2 max-w-lg text-[15px] text-muted">
                {daily.questions.length} questions tirées du thème du jour. Le thème change chaque
                jour : reviens demain pour un nouveau défi.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {done ? (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-xl bg-success/10 px-4 py-2.5 text-sm font-semibold text-success">
                      <CheckCircle2 size={18} /> Réussi aujourd’hui
                    </span>
                    <Button variant="ghost" onClick={() => navigate('/quiz/quotidien')}>
                      S’entraîner à nouveau
                    </Button>
                  </>
                ) : (
                  <Button variant="accent" size="lg" onClick={() => navigate('/quiz/quotidien')}>
                    Relever le défi <ArrowRight size={18} />
                  </Button>
                )}
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy">
                  <Sparkles size={15} className="text-sun-dark" /> +{XP.quotidien} XP
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-center border-t border-line bg-canvas/60 p-6 md:border-l md:border-t-0 sm:p-8">
              <p className="eyebrow">Ta semaine</p>
              <div className="mt-3 flex gap-2">
                {week.map((d) => (
                  <div key={d.iso} className="flex flex-col items-center gap-1.5">
                    <span
                      className={cx(
                        'grid size-9 place-items-center rounded-xl text-xs font-bold',
                        d.ok ? 'bg-sun text-navy-950' : 'bg-white text-muted ring-1 ring-line',
                      )}
                    >
                      {d.ok ? <CheckCircle2 size={16} /> : ''}
                    </span>
                    <span className="text-[11px] font-medium capitalize text-muted">{d.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                {progress.quotidiens.length} défis réussis au total
              </p>
            </div>
          </div>
          <div
            className="absolute right-0 top-0 hidden size-40 -translate-y-1/3 translate-x-1/3 rounded-full opacity-20 blur-2xl md:block"
            style={{ background: dcat.couleur }}
          />
        </section>
      </Reveal>

      {/* ───── Mises en situation ───── */}
      <section className="mt-10">
        <SectionTitle
          title="Mises en situation"
          subtitle="Choisis la bonne réaction. Chaque décision a une conséquence."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {published(catalog.scenarios).map((s, i) => {
            const cat = CATEGORY_BY_ID[s.categorie];
            const ok = scenarioValide(progress, s.id);
            const reward = catalog.cards.find(
              (c) => c.obtention.type === 'scenario' && c.obtention.scenarioId === s.id && c.publie,
            );
            return (
              <Reveal key={s.id} delay={i * 0.05}>
                <article className="panel flex h-full gap-4 p-5 transition-shadow hover:shadow-lift">
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <span
                        className="grid size-8 place-items-center rounded-lg"
                        style={{ background: cat.fond, color: cat.couleur }}
                      >
                        <Icon name={cat.icone} size={16} />
                      </span>
                      <span className="text-xs font-semibold" style={{ color: cat.couleur }}>
                        {cat.nom}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-navy-950">{s.titre}</h3>
                    <p className="mt-1 text-sm text-muted">{s.accroche}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted">
                      <MapPin size={12} /> {s.lieu} · {s.etapes.length} étapes
                    </p>
                    <div className="mt-auto flex items-center gap-3 pt-4">
                      <Button
                        size="sm"
                        variant={ok ? 'secondary' : 'primary'}
                        onClick={() => navigate(`/scenario/${s.id}`)}
                      >
                        {ok ? 'Rejouer' : 'Commencer'} <ArrowRight size={15} />
                      </Button>
                      {ok ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
                          <CheckCircle2 size={16} /> Réussie
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-navy">+{XP.scenario} XP</span>
                      )}
                    </div>
                  </div>
                  {reward && (
                    <div className="hidden shrink-0 sm:block">
                      <GameCard
                        card={reward}
                        total={total}
                        size="sm"
                        locked={!ownsCard(progress, reward.id)}
                        tilt={false}
                        width={104}
                      />
                    </div>
                  )}
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ───── Objectifs ───── */}
      <section className="mt-10">
        <SectionTitle
          title="Objectifs"
          subtitle={`${progress.achievements.length} succès débloqués sur ${ACHIEVEMENTS.length}`}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const got = progress.achievements.find((x) => x.id === a.id);
            return (
              <div
                key={a.id}
                className={cx(
                  'rounded-2xl border p-4 transition-colors',
                  got ? 'border-sun/50 bg-white shadow-soft' : 'border-line bg-white/50',
                )}
              >
                <span
                  className={cx(
                    'grid size-11 place-items-center rounded-xl',
                    got
                      ? 'bg-gradient-to-br from-sun-light to-sun text-navy-950'
                      : 'bg-navy/5 text-navy/30',
                  )}
                >
                  {got ? <Icon name={a.icone} size={21} /> : <Lock size={18} />}
                </span>
                <p className={cx('mt-3 text-sm font-bold', got ? 'text-navy-950' : 'text-ink/60')}>
                  {a.titre}
                </p>
                <p className="mt-0.5 text-xs text-muted">{a.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
