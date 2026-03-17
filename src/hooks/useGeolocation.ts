import { useEffect, useState } from 'react';
import type { GeoLocation } from '../types/weather';
import { isAllowedCountry } from '../lib/naOnly';

type State =
  | { status: 'idle' | 'loading'; location?: undefined; error?: undefined }
  | { status: 'ready'; location: GeoLocation; error?: undefined }
  | { status: 'error'; location?: undefined; error: string };

const DEFAULT_LOCATION: GeoLocation = {
  lat: 40.7128,
  lon: -74.006,
  city: 'New York',
  state: 'New York',
  country: 'United States',
  countryCode: 'US',
};

async function ipFallback(): Promise<GeoLocation> {
  const res = await fetch('https://ipapi.co/json/');
  if (!res.ok) throw new Error(`IP lookup failed: ${res.status}`);
  const j = await res.json();

  const code = String(j?.country_code ?? '').toUpperCase();
  if (!isAllowedCountry(code)) throw new Error(`IP location outside North America: ${code}`);

  return {
    lat: Number(j?.latitude),
    lon: Number(j?.longitude),
    city: String(j?.city ?? 'Unknown'),
    state: j?.region ? String(j.region) : undefined,
    country: String(j?.country_name ?? code),
    countryCode: code,
  };
}

export function useGeolocation() {
  const [state, setState] = useState<State>({ status: 'idle' });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState({ status: 'loading' });

      // 1) Browser geolocation
      const geo = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!('geolocation' in navigator)) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
        );
      });

      if (cancelled) return;

      if (geo) {
        const lat = geo.coords.latitude;
        const lon = geo.coords.longitude;
        return setState({
          status: 'ready',
          location: {
            lat,
            lon,
            city: 'Current Location',
            country: 'North America',
            countryCode: 'NA',
          },
        });
      }

      // 2) IP fallback
      try {
        const loc = await ipFallback();
        if (cancelled) return;
        return setState({ status: 'ready', location: loc });
      } catch {
        if (cancelled) return;
        // 3) Default
        setState({ status: 'ready', location: DEFAULT_LOCATION });
      }
    }

    run().catch(() => {
      if (cancelled) return;
      setState({ status: 'error', error: 'Unknown error' });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
