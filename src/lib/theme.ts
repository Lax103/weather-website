import type { WeatherCondition } from '../types/weather';

export function bgTokens(condition: WeatherCondition) {
  // light-mode only: bright, subtle gradients
  switch (condition) {
    case 'clear':
      return { from: '#BEE7FF', to: '#EAF6FF' };
    case 'partly-cloudy':
      return { from: '#D7ECFF', to: '#F7FBFF' };
    case 'cloudy':
      return { from: '#DEE9F3', to: '#F8FAFC' };
    case 'fog':
      return { from: '#E7EEF5', to: '#F7FAFF' };
    case 'drizzle':
      return { from: '#D9E8F7', to: '#F1F7FF' };
    case 'rain':
      return { from: '#CFE4F8', to: '#EEF6FF' };
    case 'snow':
      return { from: '#EDF6FF', to: '#FFFFFF' };
    case 'thunderstorm':
      return { from: '#D6E1F1', to: '#F3F6FB' };
    case 'wind':
      return { from: '#D8F2F0', to: '#F2FFFE' };
    case 'hot':
      return { from: '#FFE0C2', to: '#FFF6ED' };
    case 'cold':
      return { from: '#D7ECFF', to: '#F6FAFF' };
  }
}
