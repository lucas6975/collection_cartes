import { cards } from './lib/cards';

export function App() {
  return (
    <main
      style={{ fontFamily: 'system-ui, sans-serif', padding: 16, maxWidth: 960, margin: '0 auto' }}
    >
      <h1>Collection Sécu</h1>
      <p>Prototype — {cards.length} cartes chargées.</p>
      <ul>
        {cards.map((c) => (
          <li key={c.id}>
            <strong>{c.nom}</strong> · {c.categorie} · {c.rarete}
          </li>
        ))}
      </ul>
    </main>
  );
}
