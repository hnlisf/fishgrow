'use client';

import { useEffect, useState } from 'react';

// Helper: client-side API calls go to /api (rewritten by Next.js to backend)
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export interface FishSpecies {
  id: string;
  name: string;
  description: string;
  tempMin: number;
  tempMax: number;
  phMin: number;
  phMax: number;
  growthDays: number;
  feedFreq: 'daily' | 'twice_daily' | 'every_2_days';
  stages: Array<{ name: string; label: Record<string, string>; days: number }>;
  color: string;
  isDefault: boolean;
}

export interface Fish {
  id: string;
  tankId: string;
  speciesId: string;
  name: string;
  birthday: string;
  stage: 'fry' | 'juvenile' | 'subadult' | 'adult';
  growth: number;
  health: number;
  nutrition: number;
  lastFedAt: string | null;
  species?: FishSpecies;
  feedRecords?: Array<{ id: string; fedAt: string; amount: string }>;
}

export interface FishTank {
  id: string;
  userId: string;
  name: string;
  size: 'small' | 'medium' | 'large';
  temp: number;
  cleanliness: number;
  oxygen: number;
  ph: number;
  fish?: Fish[];
}

export interface Reminder {
  id: string;
  userId: string;
  type: 'feed' | 'water_change' | 'clean';
  titleI18n: string | Record<string, string>;
  dueAt: string;
  isDone: boolean;
  // backend may also return the resolved title:
  title?: string;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  weatherCode: number;
  description: string;
  windSpeed: number;
  source: string;
}

export interface LocationInfo {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  source: 'ipapi' | 'fallback';
}

export interface FeedingAdvice {
  speciesId: string;
  speciesName: string;
  tempSuitability: 'ideal' | 'ok' | 'poor';
  recommendation: string;
  actionItems: string[];
}

// Re-exported for convenience
export { api };

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!path) return;
    setLoading(true);
    setError(null);
    api<T>(path)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path]);
  return { data, error, loading, refetch: () => path && api<T>(path).then(setData) };
}
