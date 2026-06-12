'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useApi, api, WeatherData, FeedingAdvice, LocationInfo } from '@/lib/api';
import { useLocale } from '@/components/LocaleProvider';

const LOC_KEY = 'fishgrow.location';

function getStoredLocation(): LocationInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOC_KEY);
    return raw ? (JSON.parse(raw) as LocationInfo) : null;
  } catch {
    return null;
  }
}

export default function WeatherPage() {
  const t = useTranslations('weather');
  const { locale } = useLocale();
  const [loc, setLoc] = useState<LocationInfo | null>(null);

  // 1) Resolve location: cached → IP-based → Beijing fallback
  useEffect(() => {
    const cached = getStoredLocation();
    if (cached) {
      setLoc(cached);
      return;
    }
    api<LocationInfo>('/api/location')
      .then((l) => {
        setLoc(l);
        try { localStorage.setItem(LOC_KEY, JSON.stringify(l)); } catch {}
      })
      .catch(() => {
        // Fallback: Beijing
        const fb: LocationInfo = {
          ip: '0.0.0.0', country: 'CN', countryCode: 'CN', region: 'Beijing',
          city: 'Beijing', lat: 39.9042, lon: 116.4074, timezone: 'Asia/Shanghai', source: 'fallback',
        };
        setLoc(fb);
        try { localStorage.setItem(LOC_KEY, JSON.stringify(fb)); } catch {}
      });
  }, []);

  // 2) When location resolves, hit weather + feeding-advice with those coords
  const weatherPath = loc ? `/api/weather?lat=${loc.lat}&lon=${loc.lon}` : null;
  const { data: weather, loading: wLoading } = useApi<WeatherData>(weatherPath);
  const { data: advice, loading: aLoading } = useApi<FeedingAdvice[]>(`/api/feeding-advice?userId=demo-user&lang=${locale}`);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-water-600">{t('title')}</h1>

      {/* Location badge */}
      {loc && (
        <div className="text-sm text-water-500 flex items-center gap-2">
          <span>📍</span>
          <span>
            {t('locationTitle')}:{' '}
            <span className="font-medium text-water-700">
              {[loc.city, loc.region, loc.country].filter(Boolean).join(', ') || loc.ip}
            </span>
            {loc.source === 'fallback' && (
              <span className="ml-2 text-xs text-water-400">({t('fallback')})</span>
            )}
          </span>
        </div>
      )}

      {/* Weather card */}
      {wLoading ? <p>{t('loading')}</p> : weather && (
        <div className="card bg-water-gradient">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-light text-water-600">{weather.temp}°</p>
              <p className="text-water-500 mt-1">{weather.description}</p>
              {weather.source === 'live' && (
                <p className="text-[10px] text-water-400 mt-0.5">● {t('live')}</p>
              )}
            </div>
            <div className="text-right text-sm space-y-1 text-water-600">
              <p>💧 {t('humidity')}: {weather.humidity}%</p>
              <p>💨 {t('wind')}: {weather.windSpeed} m/s</p>
              <p className="text-xs text-water-400">{t('feels')}: {weather.feelsLike}°</p>
            </div>
          </div>
        </div>
      )}

      {/* Feeding advice */}
      <div>
        <h2 className="font-semibold text-water-600 mb-3">{t('adviceTitle')}</h2>
        {aLoading ? <p>{t('loading')}</p> : advice && advice.length === 0 && (
          <p className="text-water-500 text-sm">{t('noFishHint')}</p>
        )}
        <div className="space-y-3">
          {advice?.map((a, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-water-600">{a.speciesName}</p>
                <span className={
                  a.tempSuitability === 'ideal' ? 'badge-ideal' :
                  a.tempSuitability === 'ok' ? 'badge-ok' : 'badge-poor'
                }>
                  {a.tempSuitability === 'ideal' ? t('ideal') : a.tempSuitability === 'ok' ? t('ok') : t('poor')}
                </span>
              </div>
              <p className="text-sm text-water-600 mb-2">{a.recommendation}</p>
              {a.actionItems.length > 0 && (
                <ul className="text-sm text-water-500 space-y-1">
                  {a.actionItems.map((act, j) => (
                    <li key={j}>• {act}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
