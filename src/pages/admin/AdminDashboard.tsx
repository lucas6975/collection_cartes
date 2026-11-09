import { Activity, AlertTriangle, ClipboardCheck, Layers, Target, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { NatureBadge } from '../../components/cards/CardDetail';
import { Select } from '../../components/ui/form';
import { Icon } from '../../components/ui/Icon';
import {
  CountUp,
  PageHeader,
  ProgressBar,
  Reveal,
  SectionTitle,
  cx,
} from '../../components/ui/primitives';
import { CATEGORY_BY_ID } from '../../content/categories';
import { collaborateurs, computeStats } from '../../data/adminStats';
import { useDb } from '../../data/store';

const pct = (v: number | null) => (v === null ? '–' : `${Math.round(v * 100)} %`);

const AXIS = { fontSize: 12, fill: '#64748B' };

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number; payload: Record<string, unknown> }[];
  label?: string;
  unit: 'pct' | 'n';
}) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const n = payload[0].payload.reponses as number | undefined;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lift">
      <p className="font-semibold text-navy-950">{(payload[0].payload.nom as string) ?? label}</p>
      <p className="mt-0.5 text-ink/80">
        {unit === 'pct'
          ? `Réussite : ${v === null ? '–' : `${Math.round(v * 100)} %`}`
          : `${v} réponses`}
        {unit === 'pct' && n !== undefined && <span className="text-muted"> · {n} réponses</span>}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const db = useDb();
  const [service, setService] = useState('');
  const [equipe, setEquipe] = useState('');
  const [jours, setJours] = useState(30);
  const stats = useMemo(
    () => computeStats(db, { service, equipe, jours }),
    [db, service, equipe, jours],
  );
  const all = collaborateurs(db, { service: '', equipe: '' });
  const services = [...new Set(all.map((u) => u.service))].sort();
  const equipes = [
    ...new Set(all.filter((u) => !service || u.service === service).map((u) => u.equipe)),
  ].sort();
  const faible = [...stats.parCategorie]
    .filter((c) => c.score !== null)
    .sort((a, b) => a.score! - b.score!)[0];

  const kpis = [
    {
      icon: Users,
      label: 'Collaborateurs inscrits',
      value: stats.inscrits,
      sub: `${stats.totalComptes - stats.inscrits} compte(s) désactivé(s)`,
    },
    {
      icon: Activity,
      label: `Actifs (${jours} j)`,
      value: stats.actifs,
      sub: `Participation ${pct(stats.participation)}`,
    },
    {
      icon: ClipboardCheck,
      label: 'Quiz et défis réalisés',
      value: stats.quizRealises,
      sub: `${stats.reponses} réponses`,
    },
    {
      icon: Target,
      label: 'Taux de bonnes réponses',
      value: stats.scoreMoyen === null ? 0 : Math.round(stats.scoreMoyen * 100),
      suffix: ' %',
      sub: 'Sur la période',
    },
    {
      icon: Layers,
      label: 'Collection moyenne',
      value: Math.round(stats.collectionMoyenne * 100),
      suffix: ' %',
      sub: `Niveau moyen ${stats.niveauMoyen.toFixed(1)}`,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Pilotage"
        title="Tableau de bord"
        description="Suivez l’appropriation des règles de sécurité et identifiez les domaines à renforcer."
      />

      {/* Filtres : une seule ligne, au-dessus des graphiques */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Select
          value={service}
          onChange={(e) => {
            setService(e.target.value);
            setEquipe('');
          }}
          className="w-auto! min-w-44"
          aria-label="Service"
        >
          <option value="">Tous les services</option>
          {services.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select
          value={equipe}
          onChange={(e) => setEquipe(e.target.value)}
          className="w-auto! min-w-44"
          aria-label="Équipe"
        >
          <option value="">Toutes les équipes</option>
          {equipes.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <div
          className="inline-flex rounded-xl border border-line bg-white p-1"
          role="group"
          aria-label="Période"
        >
          {[7, 30, 90].map((j) => (
            <button
              key={j}
              onClick={() => setJours(j)}
              aria-pressed={jours === j}
              className={cx(
                'h-9 rounded-lg px-3 text-sm font-semibold',
                jours === j ? 'bg-navy text-white' : 'text-muted hover:text-navy',
              )}
            >
              {j} jours
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((k, i) => (
          <Reveal key={k.label} delay={i * 0.04}>
            <div className="panel h-full p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-blue-light text-blue">
                <k.icon size={18} />
              </span>
              <p className="mt-3 text-xs font-medium text-muted">{k.label}</p>
              <p className="font-display text-2xl font-extrabold text-navy-950">
                <CountUp value={k.value} suffix={k.suffix} />
              </p>
              <p className="mt-0.5 text-xs text-muted">{k.sub}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {faible && faible.score !== null && faible.score < 0.75 && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sun/60 bg-sun/10 p-4 text-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-sun-dark" />
          <p className="text-ink/85">
            <strong className="text-navy-950">{CATEGORY_BY_ID[faible.id].nom}</strong> est le
            domaine le moins bien maîtrisé sur la période ({pct(faible.score)} de bonnes réponses).
            Une action de sensibilisation ciblée peut être utile.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal delay={0.1}>
          <section className="panel h-full p-5">
            <SectionTitle
              title="Réussite par domaine"
              subtitle="Part de bonnes réponses sur la période"
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.parCategorie}
                  layout="vertical"
                  margin={{ left: 8, right: 48, top: 4, bottom: 4 }}
                  barCategoryGap={10}
                >
                  <CartesianGrid horizontal={false} stroke="#EEF2F6" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={(v) => `${Math.round(v * 100)}%`}
                    tick={AXIS}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="nom"
                    tick={AXIS}
                    axisLine={false}
                    tickLine={false}
                    width={84}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(37,99,166,0.06)' }}
                    content={<ChartTooltip unit="pct" />}
                  />
                  <Bar
                    dataKey="score"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                    animationDuration={600}
                  >
                    {stats.parCategorie.map((c) => (
                      <Cell key={c.id} fill={c.couleur} />
                    ))}
                    <LabelList
                      dataKey="score"
                      position="right"
                      formatter={(v) => pct(v as number | null)}
                      style={{ fontSize: 12, fill: '#0F1D33', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.15}>
          <section className="panel h-full p-5">
            <SectionTitle
              title="Évolution des résultats"
              subtitle={
                jours <= 7
                  ? 'Taux de bonnes réponses par jour'
                  : 'Taux de bonnes réponses par semaine'
              }
            />
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.evolution}
                  margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#EEF2F6" />
                  <XAxis
                    dataKey="court"
                    tick={AXIS}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={(v) => `${Math.round(v * 100)}%`}
                    tick={AXIS}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    ticks={[0, 0.5, 1]}
                  />
                  <Tooltip
                    content={<ChartTooltip unit="pct" />}
                    cursor={{ stroke: '#94A3B8', strokeDasharray: '3 3' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563A6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#2563A6', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-xs font-semibold text-muted">Volume de réponses</p>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.evolution} margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
                  <XAxis dataKey="court" hide />
                  <YAxis
                    tick={AXIS}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    allowDecimals={false}
                    tickCount={3}
                  />
                  <Tooltip
                    content={<ChartTooltip unit="n" />}
                    cursor={{ fill: 'rgba(37,99,166,0.06)' }}
                  />
                  <Bar dataKey="reponses" fill="#93B4DA" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </Reveal>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Reveal delay={0.1} className="lg:col-span-3">
          <section className="panel h-full p-5">
            <SectionTitle
              title="Notions les plus difficiles"
              subtitle="Questions avec le plus faible taux de réussite (3 réponses minimum)"
            />
            {stats.difficultes.length === 0 ? (
              <p className="text-sm text-muted">Pas assez de réponses sur la période.</p>
            ) : (
              <ul className="divide-y divide-line">
                {stats.difficultes.map((d) => {
                  const cat = CATEGORY_BY_ID[d.question.categorie];
                  return (
                    <li key={d.question.id} className="flex items-center gap-3 py-3">
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-lg"
                        style={{ background: cat.fond, color: cat.couleur }}
                      >
                        <Icon name={cat.icone} size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-navy-950">{d.question.enonce}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted">{d.total} réponses</span>
                          <NatureBadge nature={d.question.nature} />
                        </div>
                      </div>
                      <span
                        className={cx(
                          'shrink-0 rounded-lg px-2 py-1 text-sm font-bold',
                          d.score < 0.5 ? 'bg-danger/10 text-danger' : 'bg-sun/20 text-navy-950',
                        )}
                      >
                        {pct(d.score)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </Reveal>

        <Reveal delay={0.15} className="lg:col-span-2">
          <section className="panel h-full p-5">
            <SectionTitle title="Par service" />
            <div className="space-y-4">
              {stats.services.map((s) => (
                <div key={s.service}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-navy-950">{s.service}</span>
                    <span className="text-xs text-muted">
                      {s.actifs}/{s.membres} actifs · {pct(s.score)} de réussite
                    </span>
                  </div>
                  <ProgressBar value={s.collection} height={6} className="mt-2" />
                  <p className="mt-1 text-[11px] text-muted">
                    Collection moyenne : {Math.round(s.collection * 100)} %
                  </p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
