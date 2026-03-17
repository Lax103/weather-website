/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import type { GeoLocation, SearchResult } from '../types/weather';
import { fromSearchResult, searchCities } from '../lib/openMeteo';

export function useCitySearch(query: string) {
  const q = query.trim();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSearch = useMemo(() => q.length >= 2, [q]);

  useEffect(() => {
    let cancelled = false;
    if (!canSearch) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const t = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchCities(q)
        .then((r) => {
          if (cancelled) return;
          setResults(r);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e?.message ?? 'Search failed');
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, canSearch]);

  function toGeo(r: SearchResult): GeoLocation {
    return fromSearchResult(r);
  }

  return { results, loading, error, toGeo };
}
