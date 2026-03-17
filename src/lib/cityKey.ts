import type { GeoLocation } from '../types/weather';

export function cityKey(c: GeoLocation) {
  // stable-ish key for tab switching
  return `${c.city}|${c.state ?? ''}|${c.countryCode}|${c.lat.toFixed(2)}|${c.lon.toFixed(2)}`;
}
