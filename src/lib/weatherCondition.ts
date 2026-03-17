import type { WeatherCondition } from '../types/weather';

export function conditionFromWmoCode(code: number): WeatherCondition {
  // WMO Weather interpretation codes
  // https://open-meteo.com/en/docs
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';

  // Drizzle
  if (code >= 51 && code <= 57) return 'drizzle';

  // Rain
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';

  // Snow
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';

  // Thunderstorm
  if (code >= 95 && code <= 99) return 'thunderstorm';

  // Fallback
  return 'cloudy';
}

export function applyDerivedModifiers(
  base: WeatherCondition,
  opts: {
    temperatureF?: number;
    windMph?: number;
  },
): WeatherCondition {
  const temp = opts.temperatureF;
  const wind = opts.windMph;

  // These override the base condition for visuals
  if (typeof temp === 'number') {
    if (temp >= 90) return 'hot';
    if (temp <= 20) return 'cold';
  }
  if (typeof wind === 'number' && wind >= 25) return 'wind';

  return base;
}

export function labelForCondition(c: WeatherCondition): string {
  switch (c) {
    case 'clear':
      return 'Clear';
    case 'partly-cloudy':
      return 'Partly Cloudy';
    case 'cloudy':
      return 'Cloudy';
    case 'fog':
      return 'Fog';
    case 'drizzle':
      return 'Drizzle';
    case 'rain':
      return 'Rain';
    case 'snow':
      return 'Snow';
    case 'thunderstorm':
      return 'Thunderstorm';
    case 'hot':
      return 'Hot';
    case 'cold':
      return 'Cold';
    case 'wind':
      return 'Windy';
  }
}
