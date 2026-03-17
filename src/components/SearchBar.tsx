import { useMemo, useState } from 'react';
import type { GeoLocation } from '../types/weather';
import { useCitySearch } from '../hooks/useCitySearch';

export function SearchBar({ onPick }: { onPick: (loc: GeoLocation) => void }) {
  const [q, setQ] = useState('');
  const { results, loading, error, toGeo } = useCitySearch(q);

  const show = useMemo(() => q.trim().length >= 2, [q]);

  return (
    <div className="searchWrap">
      <div className="glass search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a North American city…"
          aria-label="City search"
        />
        <div className="searchHint">US / CA / MX</div>
      </div>

      {show && (
        <div className="glass searchResults" role="listbox">
          {loading && <div className="srRow muted">Searching…</div>}
          {error && <div className="srRow muted">{error}</div>}
          {!loading && !error && results.length === 0 && (
            <div className="srRow muted">No results</div>
          )}
          {results.map((r) => (
            <button
              className="srRow"
              key={r.id}
              type="button"
              onClick={() => {
                const loc = toGeo(r);
                onPick(loc);
                setQ('');
              }}
            >
              <div className="srName">{r.name}</div>
              <div className="srMeta">
                {r.admin1 ? `${r.admin1} · ` : ''}
                {r.country_code.toUpperCase()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
