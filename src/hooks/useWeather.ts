/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import type { GeoLocation, WeatherData } from '../types/weather';
import { cityLabelFromGeo, fetchWeather } from '../lib/openMeteo';

type State =
  | { status: 'idle' | 'loading'; data?: undefined; error?: undefined }
  | { status: 'ready'; data: WeatherData; error?: undefined }
  | { status: 'error'; data?: undefined; error: string };

export function useWeather(location: GeoLocation | null) {
  const [state, setState] = useState<State>({ status: 'idle' });

  const key = useMemo(() => {
    if (!location) return null;
    return `${location.lat.toFixed(3)},${location.lon.toFixed(3)}`;
  }, [location]);

  useEffect(() => {
    let cancelled = false;
    if (!location || !key) return;

    setState({ status: 'loading' });
    const label = cityLabelFromGeo(location);

    fetchWeather(location.lat, location.lon, label)
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'ready', data });
      })
      .catch((e) => {
        if (cancelled) return;
        setState({ status: 'error', error: e?.message ?? 'Weather fetch failed' });
      });

    return () => {
      cancelled = true;
    };
  }, [key, location]);

  return state;
}
