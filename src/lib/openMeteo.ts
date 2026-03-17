import type { GeoLocation, SearchResult, WeatherData } from '../types/weather';
import { isAllowedCountry } from './naOnly';
import { applyDerivedModifiers, conditionFromWmoCode } from './weatherCondition';

function toCityLabel(g: { name: string; admin1?: string; country_code?: string; country?: string }) {
  const parts = [g.name];
  if (g.admin1) parts.push(g.admin1);
  if (g.country_code) parts.push(g.country_code.toUpperCase());
  else if (g.country) parts.push(g.country);
  return parts.join(', ');
}

export async function searchCities(name: string): Promise<SearchResult[]> {
  const q = name.trim();
  if (q.length < 2) return [];

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', q);
  url.searchParams.set('count', '10');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = (await res.json()) as { results?: SearchResult[] };
  const results = data.results ?? [];

  return results.filter((r) => isAllowedCountry(r.country_code));
}

export async function fetchWeather(lat: number, lon: number, cityLabel: string): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('timezone', 'auto');

  // Canadian units
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('precipitation_unit', 'mm');

  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'apparent_temperature',
      'weathercode',
      'windspeed_10m',
      'relative_humidity_2m',
      'precipitation',
    ].join(','),
  );

  url.searchParams.set(
    'hourly',
    ['temperature_2m', 'weathercode', 'precipitation_probability'].join(','),
  );

  url.searchParams.set(
    'daily',
    ['weathercode', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'].join(','),
  );

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const j = await res.json();

  const currentTemp = j?.current?.temperature_2m as number;
  const currentWind = j?.current?.windspeed_10m as number;
  const currentCode = j?.current?.weathercode as number;

  const base = conditionFromWmoCode(currentCode);
  const condition = applyDerivedModifiers(base, { temperatureC: currentTemp, windKmh: currentWind });

  const dailyTimes: string[] = j?.daily?.time ?? [];
  const dailyMax: number[] = j?.daily?.temperature_2m_max ?? [];
  const dailyMin: number[] = j?.daily?.temperature_2m_min ?? [];
  const dailyCode: number[] = j?.daily?.weathercode ?? [];
  const dailyPrecip: number[] = j?.daily?.precipitation_sum ?? [];

  const daily = dailyTimes.slice(0, 7).map((date, i) => {
    const b = conditionFromWmoCode(dailyCode[i] ?? 3);
    const c = applyDerivedModifiers(b, { temperatureC: dailyMax[i], windKmh: currentWind });
    return {
      date,
      maxTemp: dailyMax[i] ?? 0,
      minTemp: dailyMin[i] ?? 0,
      weatherCode: dailyCode[i] ?? 3,
      precipitation: dailyPrecip[i] ?? 0,
      condition: c,
    };
  });

  const hourlyTimes: string[] = j?.hourly?.time ?? [];
  const hourlyTemp: number[] = j?.hourly?.temperature_2m ?? [];
  const hourlyCode: number[] = j?.hourly?.weathercode ?? [];
  const hourlyPp: number[] = j?.hourly?.precipitation_probability ?? [];

  const nowIso = j?.current?.time as string | undefined;
  const startIdx = nowIso ? Math.max(0, hourlyTimes.indexOf(nowIso)) : 0;
  const hourly = hourlyTimes.slice(startIdx, startIdx + 24).map((time, i) => {
    const idx = startIdx + i;
    const b = conditionFromWmoCode(hourlyCode[idx] ?? 3);
    const c = applyDerivedModifiers(b, { temperatureC: hourlyTemp[idx], windKmh: currentWind });
    return {
      time,
      temperature: hourlyTemp[idx] ?? 0,
      weatherCode: hourlyCode[idx] ?? 3,
      precipitationProbability: hourlyPp[idx] ?? 0,
      condition: c,
    };
  });

  return {
    timezone: (j?.timezone as string) ?? 'auto',
    cityLabel,
    current: {
      temperature: currentTemp,
      apparentTemperature: (j?.current?.apparent_temperature as number) ?? currentTemp,
      weatherCode: currentCode,
      windSpeed: currentWind,
      humidity: (j?.current?.relative_humidity_2m as number) ?? 0,
      precipitation: (j?.current?.precipitation as number) ?? 0,
      condition,
    },
    daily,
    hourly,
  };
}

export function fromSearchResult(r: SearchResult): GeoLocation {
  return {
    lat: r.latitude,
    lon: r.longitude,
    city: r.name,
    state: r.admin1,
    country: r.country,
    countryCode: r.country_code,
  };
}

export function cityLabelFromGeo(g: GeoLocation): string {
  return toCityLabel({ name: g.city, admin1: g.state, country_code: g.countryCode, country: g.country });
}
