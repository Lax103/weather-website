import type { GeoLocation, WeatherData } from '../types/weather';
import { labelForCondition } from '../lib/weatherCondition';

function row(label: string, value: string) {
  return (
    <div className="kv" key={label}>
      <div className="k">{label}</div>
      <div className="v">{value}</div>
    </div>
  );
}

export function HeroCard({ location, data }: { location: GeoLocation; data: WeatherData }) {
  const c = data.current;

  return (
    <section className="glass heroCard">
      <div className="heroTop">
        <div>
          <div className="heroCity">{data.cityLabel || location.city}</div>
          <div className="heroCond">{labelForCondition(c.condition)}</div>
        </div>
        <div className="heroTemp">{Math.round(c.temperature)}°</div>
      </div>

      <div className="heroMeta">
        {row('Feels like', `${Math.round(c.apparentTemperature)}°`)}
        {row('Wind', `${Math.round(c.windSpeed)} mph`)}
        {row('Humidity', `${Math.round(c.humidity)}%`)}
        {row('Precip', `${c.precipitation.toFixed(2)} in`)}
      </div>
    </section>
  );
}
