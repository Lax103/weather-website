/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import './App.css';
import type { GeoLocation } from './types/weather';
import { useGeolocation } from './hooks/useGeolocation';
import { useWeather } from './hooks/useWeather';
import { loadCities, saveCities } from './lib/storage';
import { CityTabs } from './components/CityTabs';
import { SearchBar } from './components/SearchBar';
import { HeroCard } from './components/HeroCard';
import { HourlyScroll } from './components/HourlyScroll';
import { DailyForecast } from './components/DailyForecast';
import { WeatherScene } from './components/WeatherScene';
import { bgTokens } from './lib/theme';

export default function App() {
  const geo = useGeolocation();

  const [cities, setCities] = useState<GeoLocation[]>(() => loadCities());
  const [active, setActive] = useState<GeoLocation | null>(() => loadCities()[0] ?? null);

  useEffect(() => {
    saveCities(cities);
  }, [cities]);

  // If no saved city, use detected location once ready
  useEffect(() => {
    if (active) return;
    if (geo.status !== 'ready') return;
    setActive(geo.location);
    setCities((prev) => {
      if (prev.length) return prev;
      return [geo.location];
    });
  }, [active, geo.status, geo.location]);

  const weather = useWeather(active);
  const condition = weather.status === 'ready' ? weather.data.current.condition : 'clear';
  const wind = weather.status === 'ready' ? weather.data.current.windSpeed : 0;
  const bg = useMemo(() => bgTokens(condition), [condition]);

  function addOrActivate(loc: GeoLocation) {
    setCities((prev) => {
      const exists = prev.some((c) =>
        Math.abs(c.lat - loc.lat) < 0.01 && Math.abs(c.lon - loc.lon) < 0.01,
      );
      const next = exists ? prev : [loc, ...prev].slice(0, 5);
      return next;
    });
    setActive(loc);
  }

  return (
    <div
      className="app"
      data-condition={condition}
      style={{
        '--bg-from': bg.from,
        '--bg-to': bg.to,
      } as React.CSSProperties}
    >
      <div className="bg" aria-hidden="true" />
      <WeatherScene condition={condition} windKmh={wind} />

      <header className="top">
        <div className="brand">Weather</div>
        <div className="status">
          {geo.status === 'loading' && 'Locating…'}
          {geo.status === 'error' && 'Location error'}
        </div>
      </header>

      <main className="container">
        <SearchBar onPick={addOrActivate} />
        <CityTabs cities={cities} active={active} onSelect={setActive} />

        {weather.status === 'loading' && <div className="glass panel">Loading weather…</div>}
        {weather.status === 'error' && <div className="glass panel">{weather.error}</div>}
        {weather.status === 'ready' && active && (
          <>
            <HeroCard location={active} data={weather.data} />
            <HourlyScroll data={weather.data} />
            <DailyForecast data={weather.data} />
          </>
        )}

        <footer className="foot">
          <div className="muted">
            Data: Open-Meteo · North America only (US/CA/MX)
          </div>
        </footer>
      </main>
    </div>
  );
}
