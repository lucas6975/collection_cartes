import { Eye, Pencil, Search, Trash2, UserPlus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Field, Select, TextInput, Toggle } from '../../components/ui/form';
import { Icon } from '../../components/ui/Icon';
import { Modal, useToast } from '../../components/ui/overlay';
import { Avatar, Button, PageHeader, ProgressBar, cx } from '../../components/ui/primitives';
import { CATEGORIES } from '../../content/categories';
import { backend, useSession } from '../../data/store';
import { maitrise, niveauDepuisXp, progressionVide, published } from '../../domain/engine';
import type { User } from '../../domain/types';

const empty = (): User => ({
  id: `u-${crypto.randomUUID().slice(0, 8)}`,
  prenom: '',
  nom: '',
  email: '',
  equipe: '',
  service: '',
  role: 'collaborateur',
  actif: true,
  creeLe: new Date().toISOString(),
});

export default function AdminUsers() {
  const { db, user: me } = useSession();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [service, setService] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [viewing, setViewing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const services = [...new Set(db.users.map((u) => u.service))].sort();
  const total = published(db.catalog.cards).length;

  const list = db.users
    .filter((u) => !service || u.service === service)
    .filter((u) =>
      `${u.prenom} ${u.nom} ${u.email} ${u.equipe}`.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const lastActivity = (u: User) => {
    const a = db.progress[u.id]?.activity ?? [];
    return a.length ? a.reduce((m, e) => (e.at > m ? e.at : m), a[0].at) : null;
  };

  const save = (u: User) => {
    if (!u.prenom.trim() || !u.nom.trim() || !u.email.includes('@') || !u.service.trim()) {
      toast('Prénom, nom, e-mail valide et service sont obligatoires.', 'error');
      return;
    }
    backend.saveUser({ ...u, prenom: u.prenom.trim(), nom: u.nom.trim(), email: u.email.trim() });
    toast('Collaborateur enregistré');
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Collaborateurs"
        description={`${db.users.length} comptes, organisés par service et par équipe.`}
      >
        <Button onClick={() => setEditing(empty())}>
          <UserPlus size={17} /> Ajouter
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <TextInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un collaborateur…"
            className="pl-10"
          />
        </label>
        <Select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="sm:w-56"
          aria-label="Service"
        >
          <option value="">Tous les services</option>
          {services.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </div>

      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-[2fr_1.3fr_1fr_1fr_auto] gap-4 border-b border-line bg-canvas/60 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted md:grid">
          <span>Collaborateur</span>
          <span>Service · équipe</span>
          <span>Progression</span>
          <span>Dernière activité</span>
          <span className="w-[120px]" />
        </div>
        <ul className="divide-y divide-line">
          {list.map((u) => {
            const p = db.progress[u.id] ?? progressionVide(u.id);
            const last = lastActivity(u);
            return (
              <li
                key={u.id}
                className={cx(
                  'grid gap-3 px-5 py-4 md:grid-cols-[2fr_1.3fr_1fr_1fr_auto] md:items-center md:gap-4',
                  !u.actif && 'opacity-55',
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar user={u} size={40} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy-950">
                      {u.prenom} {u.nom}
                      {u.role === 'admin' && (
                        <span className="ml-2 rounded-md bg-navy px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                          Admin
                        </span>
                      )}
                      {!u.actif && (
                        <span className="ml-2 rounded-md bg-navy/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">
                          Désactivé
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                </div>
                <p className="text-sm text-ink/80">
                  {u.service} <span className="text-muted">· {u.equipe}</span>
                </p>
                <div>
                  <p className="text-xs text-muted">
                    Niv. {niveauDepuisXp(p.xp).niveau} · {p.cards.length}/{total} cartes
                  </p>
                  <ProgressBar value={p.cards.length / total} height={5} className="mt-1.5" />
                </div>
                <p className="text-sm text-muted">
                  {last ? new Date(last).toLocaleDateString('fr-FR') : 'Jamais'}
                </p>
                <div className="flex gap-1">
                  <IconBtn label="Voir la progression" onClick={() => setViewing(u)}>
                    <Eye size={16} />
                  </IconBtn>
                  <IconBtn label="Modifier" onClick={() => setEditing(u)}>
                    <Pencil size={16} />
                  </IconBtn>
                  <IconBtn
                    label="Supprimer"
                    onClick={() => setDeleting(u)}
                    disabled={u.id === me?.id}
                    danger
                  >
                    <Trash2 size={16} />
                  </IconBtn>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Édition */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={
          editing && db.users.some((u) => u.id === editing.id)
            ? 'Modifier le collaborateur'
            : 'Nouveau collaborateur'
        }
      >
        {editing && (
          <UserForm
            user={editing}
            onSave={save}
            isSelf={editing.id === me?.id}
            services={services}
          />
        )}
      </Modal>

      {/* Progression individuelle */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `${viewing.prenom} ${viewing.nom}` : ''}
      >
        {viewing && <UserProgress user={viewing} />}
      </Modal>

      {/* Suppression */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Supprimer le compte"
        size="sm"
      >
        {deleting && (
          <div className="p-6">
            <p className="text-[15px] text-ink/85">
              Supprimer définitivement le compte de{' '}
              <strong>
                {deleting.prenom} {deleting.nom}
              </strong>{' '}
              et toute sa progression ? Pour conserver l’historique, préférez la désactivation.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  backend.saveUser({ ...deleting, actif: false });
                  toast('Compte désactivé', 'info');
                  setDeleting(null);
                }}
              >
                Désactiver
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  backend.deleteUser(deleting.id);
                  toast('Compte supprimé', 'info');
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

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx(
        'grid size-9 place-items-center rounded-lg text-muted transition-colors disabled:opacity-30',
        danger ? 'hover:bg-danger/10 hover:text-danger' : 'hover:bg-blue-light hover:text-navy',
      )}
    >
      {children}
    </button>
  );
}

function UserForm({
  user,
  onSave,
  isSelf,
  services,
}: {
  user: User;
  onSave: (u: User) => void;
  isSelf: boolean;
  services: string[];
}) {
  const [u, setU] = useState(user);
  const set = <K extends keyof User>(k: K, v: User[K]) => setU((x) => ({ ...x, [k]: v }));
  return (
    <form
      className="space-y-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(u);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom">
          <TextInput value={u.prenom} onChange={(e) => set('prenom', e.target.value)} required />
        </Field>
        <Field label="Nom">
          <TextInput value={u.nom} onChange={(e) => set('nom', e.target.value)} required />
        </Field>
      </div>
      <Field label="E-mail professionnel">
        <TextInput
          type="email"
          value={u.email}
          onChange={(e) => set('email', e.target.value)}
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service">
          <TextInput
            value={u.service}
            onChange={(e) => set('service', e.target.value)}
            list="services"
            required
          />
          <datalist id="services">
            {services.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Équipe">
          <TextInput value={u.equipe} onChange={(e) => set('equipe', e.target.value)} />
        </Field>
      </div>
      <Field
        label="Rôle"
        hint={isSelf ? 'Vous ne pouvez pas modifier votre propre rôle.' : undefined}
      >
        <Select
          value={u.role}
          onChange={(e) => set('role', e.target.value as User['role'])}
          disabled={isSelf}
        >
          <option value="collaborateur">Collaborateur</option>
          <option value="admin">Administrateur</option>
        </Select>
      </Field>
      {!isSelf && (
        <Toggle checked={u.actif} onChange={(v) => set('actif', v)} label="Compte actif" />
      )}
      <div className="flex justify-end pt-2">
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}

function UserProgress({ user }: { user: User }) {
  const { db } = useSession();
  const p = db.progress[user.id] ?? progressionVide(user.id);
  const lvl = niveauDepuisXp(p.xp);
  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center gap-4">
        <Avatar user={user} size={56} />
        <div>
          <p className="text-sm text-muted">
            {user.service} · {user.equipe}
          </p>
          <p className="font-semibold text-navy-950">
            Niveau {lvl.niveau} · {lvl.titre} · {p.xp} XP
          </p>
          <p className="text-sm text-muted">
            {p.cards.length} cartes · {p.achievements.length} succès · {p.answers.length} réponses
          </p>
        </div>
      </div>
      <div>
        <p className="eyebrow mb-3">Maîtrise par domaine</p>
        <ul className="space-y-3">
          {CATEGORIES.map((c) => {
            const m = maitrise(db.catalog, p, c.id);
            return (
              <li key={c.id} className="flex items-center gap-3">
                <span
                  className="grid size-8 place-items-center rounded-lg"
                  style={{ background: c.fond, color: c.couleur }}
                >
                  <Icon name={c.icone} size={15} />
                </span>
                <span className="w-28 text-sm font-medium text-navy-950">{c.court}</span>
                <ProgressBar value={m} tone={c.couleur} height={6} />
                <span className="w-10 text-right text-xs font-semibold">
                  {Math.round(m * 100)} %
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <p className="eyebrow mb-2">Activité récente</p>
        <ul className="space-y-1.5 text-sm">
          {[...p.activity]
            .sort((a, b) => b.at.localeCompare(a.at))
            .slice(0, 6)
            .map((e) => (
              <li key={e.id} className="flex justify-between gap-3">
                <span className="truncate text-ink/80">{e.label}</span>
                <span className="shrink-0 text-xs text-muted">
                  {new Date(e.at).toLocaleDateString('fr-FR')}
                </span>
              </li>
            ))}
          {p.activity.length === 0 && <li className="text-muted">Aucune activité.</li>}
        </ul>
      </div>
    </div>
  );
}
