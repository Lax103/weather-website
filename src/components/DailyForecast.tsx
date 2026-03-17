import type { WeatherData } from '../types/weather';

function fmtDay(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

export function DailyForecast({ data }: { data: WeatherData }) {
  return (
    <section className="glass panel">
      <div className="panelTitle">7-day</div>
      <div className="daily">
        {data.daily.map((d) => (
          <div className="dailyRow" key={d.date}>
            <div className="dailyDay">{fmtDay(d.date)}</div>
            <div className="dailyTemps">
              <span className="hi">{Math.round(d.maxTemp)}°</span>
              <span className="lo">{Math.round(d.minTemp)}°</span>
            </div>
            <div className="dailyP">{d.precipitation.toFixed(1)} mm</div>
          </div>
        ))}
      </div>
    </section>
  );
}
