import type { GeoLocation } from '../types/weather';

const KEY = 'weather-website.savedCities.v1';

export function loadCities(): GeoLocation[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c) => typeof c?.lat === 'number' && typeof c?.lon === 'number');
  } catch {
    return [];
  }
}

export function saveCities(cities: GeoLocation[]) {
  localStorage.setItem(KEY, JSON.stringify(cities.slice(0, 5)));
}
