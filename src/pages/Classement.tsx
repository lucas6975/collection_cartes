import { ArrowLeft, Repeat } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Avatar, cx } from '../components/ui/primitives';
import { CARDS } from '../content/cards';
import { avatarDe, trier, useClassement, type Tri } from '../data/classement';
import { useGame } from '../data/store';

export function Classement() {
  const { lignes, erreur } = useClassement();
  const { progress } = useGame();
  const [tri, setTri] = useState<Tri>('cartes');
  const t = lignes ? trier(lignes, tri) : [];
  const max = Math.max(1, ...t.map((x) => (tri === 'cartes' ? x.cartes : x.echanges)));
  const manque = CARDS.length - progress.cards.length;

  return (
    <div className="mx-auto max-w-md pb-40">
      <div className="mb-3 flex items-center gap-3">
        <Link
          to="/"
          className="grid size-10 place-items-center rounded-full border border-line bg-white text-navy"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Classement</h1>
          <p className="text-[12.5px] text-[#8a97ab]">
            {t.length} collectionneurs · mis à jour en direct
          </p>
        </div>
      </div>
      <div className="mb-2 flex gap-1.5">
        {(
          [
            ['cartes', 'Cartes'],
            ['echanges', 'Échanges'],
          ] as const
        ).map(([id, l]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTri(id)}
            className={cx(
              'rounded-full px-3 py-1.5 text-xs font-bold',
              tri === id ? 'bg-navy-950 text-white' : 'bg-[#f1f4f8] text-muted',
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {!lignes ? (
        <p className="py-10 text-center text-sm text-muted">
          {erreur ? `⚠️ ${erreur}` : 'Chargement du classement…'}
        </p>
      ) : (
        <ul className="rounded-[22px] bg-white px-2 shadow-[0_1px_2px_rgba(11,35,71,.04),0_6px_20px_rgba(11,35,71,.06)]">
          {t.map((l) => {
            const v = tri === 'cartes' ? l.cartes : l.echanges;
            return (
              <li
                key={l.cle}
                className={cx(
                  'flex items-center gap-3 border-b border-line px-2 py-2.5 last:border-0',
                  l.moi && 'my-1 rounded-2xl border-0 bg-[#fffaf0]',
                )}
              >
                <span
                  className={cx(
                    'w-6 text-center font-display text-sm font-extrabold',
                    l.rang === 1 ? 'text-[#d4a017]' : 'text-[#8a97ab]',
                  )}
                >
                  {l.rang}
                </span>
                <Avatar user={avatarDe(l)} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-950">
                    {l.moi ? 'Toi' : `${l.prenom} ${l.nom}`}
                  </p>
                  <p className="truncate text-[11.5px] text-[#8a97ab]">
                    {tri === 'cartes'
                      ? [
                          l.legendaires
                            ? `${l.legendaires} légendaire${l.legendaires > 1 ? 's' : ''}`
                            : null,
                          `🔁 ${l.echanges}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : `${l.cartes} cartes`}
                  </p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
                    <div
                      className={cx('h-full rounded-full', l.moi ? 'bg-sun' : 'bg-navy')}
                      style={{ width: `${(v / max) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="min-w-7 text-right font-display text-base font-extrabold text-navy-950">
                  {v}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-center text-[11.5px] text-muted">
        À égalité, le plus de légendaires passe devant. Tu peux masquer ton nom dans l’onglet Moi.
      </p>

      {manque > 0 && (
        <div className="fixed inset-x-3 bottom-[84px] z-20 mx-auto flex max-w-md items-center gap-2.5 rounded-2xl bg-navy-950 px-3.5 py-3 text-[12.5px] text-white shadow-lift">
          <span className="flex-1">
            Il te manque <b className="text-sun">{manque} cartes</b>. Un échange peut te faire
            monter.
          </span>
          <Link
            to="/echange"
            className="inline-flex shrink-0 items-center gap-1 rounded-[10px] bg-sun px-2.5 py-1.5 font-extrabold text-navy-950"
          >
            <Repeat size={14} /> Échanger
          </Link>
        </div>
      )}
    </div>
  );
}
