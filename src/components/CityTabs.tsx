import type { GeoLocation } from '../types/weather';
import { cityKey } from '../lib/cityKey';

export function CityTabs({
  cities,
  active,
  onSelect,
}: {
  cities: GeoLocation[];
  active: GeoLocation | null;
  onSelect: (c: GeoLocation) => void;
}) {
  if (!cities.length) return null;

  const activeKey = active ? cityKey(active) : null;

  return (
    <div className="tabs">
      {cities.map((c) => {
        const k = cityKey(c);
        const isActive = k === activeKey;
        return (
          <button
            key={k}
            className={isActive ? 'tab tabActive' : 'tab'}
            onClick={() => onSelect(c)}
            type="button"
          >
            {c.city}
          </button>
        );
      })}
    </div>
  );
}
