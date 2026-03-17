import type { WeatherData } from '../types/weather';

function fmtHour(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric' });
}

export function HourlyScroll({ data }: { data: WeatherData }) {
  return (
    <section className="glass panel">
      <div className="panelTitle">Next 24 hours</div>
      <div className="hourly">
        {data.hourly.map((h) => (
          <div className="hour" key={h.time}>
            <div className="t">{fmtHour(h.time)}</div>
            <div className="temp">{Math.round(h.temperature)}°</div>
            <div className="pp">{Math.round(h.precipitationProbability)}%</div>
          </div>
        ))}
      </div>
    </section>
  );
}
