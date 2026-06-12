'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useApi, api, FishSpecies } from '@/lib/api';

const STORAGE_KEY = 'fishgrow.tankId';

export default function SpeciesPage() {
  const t = useTranslations('species');
  const tf = useTranslations('fish');
  const { data: species, loading, refetch } = useApi<FishSpecies[]>('/api/fish-species?lang=' + (typeof window !== 'undefined' ? (document.cookie.match(/locale=(\w+)/)?.[1] ?? 'zh') : 'zh'));
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [tempMin, setTempMin] = useState(20);
  const [tempMax, setTempMax] = useState(28);
  const [phMin, setPhMin] = useState(6.5);
  const [phMax, setPhMax] = useState(7.5);
  const [growthDays, setGrowthDays] = useState(60);
  const [feedFreq, setFeedFreq] = useState<'daily' | 'twice_daily' | 'every_2_days'>('twice_daily');
  const [color, setColor] = useState('#5BA9C7');
  const [busy, setBusy] = useState(false);

  const addToTank = async (sp: FishSpecies) => {
    let tankId = localStorage.getItem(STORAGE_KEY);
    if (!tankId) {
      const tank = await api<{ id: string }>('/api/fish-tanks', {
        method: 'POST',
        body: JSON.stringify({ userId: 'demo-user', name: '我的鱼缸' }),
      });
      tankId = tank.id;
      localStorage.setItem(STORAGE_KEY, tankId);
    }
    await api('/api/fish', {
      method: 'POST',
      body: JSON.stringify({ tankId, speciesId: sp.id }),
    });
    alert(`Added ${sp.name} to your tank!`);
  };

  const createCustom = async () => {
    if (!name) return;
    setBusy(true);
    try {
      const lang = document.cookie.match(/locale=(\w+)/)?.[1] ?? 'zh';
      await api('/api/fish-species/custom', {
        method: 'POST',
        body: JSON.stringify({
          nameI18n: JSON.stringify({ zh: name, en: name, ja: name }),
          descI18n: JSON.stringify({ zh: '自定义鱼种', en: 'Custom species', ja: 'カスタム魚種' }),
          tempMin, tempMax, phMin, phMax, growthDays, feedFreq, color,
          stages: JSON.stringify([
            { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: Math.round(growthDays * 0.1) },
            { name: 'juvenile', label: { zh: '幼鱼', en: 'Juvenile', ja: '幼魚' }, days: Math.round(growthDays * 0.4) },
            { name: 'subadult', label: { zh: '亚成鱼', en: 'Subadult', ja: '亜成魚' }, days: Math.round(growthDays * 0.75) },
            { name: 'adult', label: { zh: '成鱼', en: 'Adult', ja: '成魚' }, days: growthDays },
          ]),
        }),
      });
      setAdding(false);
      setName('');
      refetch();
    } catch (e: any) {
      alert('Failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-water-600">{t('title')}</h1>
          <p className="text-water-500 text-sm mt-1">{t('subtitle')}</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-secondary text-sm">+ {t('addCustom')}</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {species?.map((sp) => (
          <div key={sp.id} className="card hover:shadow-md transition">
            <div className="h-20 rounded-2xl mb-3" style={{ background: `linear-gradient(135deg, ${sp.color}55, ${sp.color}aa)` }} />
            <h3 className="font-semibold text-water-600 text-lg">{sp.name}</h3>
            <p className="text-sm text-water-500 mt-1 line-clamp-2">{sp.description}</p>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="rounded-lg bg-water-50 p-2">
                <p className="text-water-500">🌡️ {t('tempRange')}</p>
                <p className="font-medium text-water-700">{sp.tempMin}-{sp.tempMax}°C</p>
              </div>
              <div className="rounded-lg bg-water-50 p-2">
                <p className="text-water-500">⚗️ {t('phRange')}</p>
                <p className="font-medium text-water-700">{sp.phMin}-{sp.phMax}</p>
              </div>
              <div className="rounded-lg bg-water-50 p-2">
                <p className="text-water-500">📅 {t('growthDays')}</p>
                <p className="font-medium text-water-700">{sp.growthDays} {tf('days')}</p>
              </div>
              <div className="rounded-lg bg-water-50 p-2">
                <p className="text-water-500">🍤 {t('feedFreq')}</p>
                <p className="font-medium text-water-700">
                  {sp.feedFreq === 'daily' ? t('freqDaily') : sp.feedFreq === 'twice_daily' ? t('freqTwice') : t('freq2Days')}
                </p>
              </div>
            </div>
            <button onClick={() => addToTank(sp)} className="btn-primary w-full mt-4 text-sm">
              {t('selectButton')}
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="fixed inset-0 bg-water-600/30 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-water-600 mb-4">{t('addCustom')}</h2>
            <div className="space-y-3">
              <div>
                <label className="label">{t('customName')}</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">🌡️ Temp min</label>
                  <input className="input" type="number" value={tempMin} onChange={(e) => setTempMin(+e.target.value)} />
                </div>
                <div>
                  <label className="label">Temp max</label>
                  <input className="input" type="number" value={tempMax} onChange={(e) => setTempMax(+e.target.value)} />
                </div>
                <div>
                  <label className="label">⚗️ pH min</label>
                  <input className="input" type="number" step="0.1" value={phMin} onChange={(e) => setPhMin(+e.target.value)} />
                </div>
                <div>
                  <label className="label">pH max</label>
                  <input className="input" type="number" step="0.1" value={phMax} onChange={(e) => setPhMax(+e.target.value)} />
                </div>
                <div>
                  <label className="label">📅 {t('growthDays')}</label>
                  <input className="input" type="number" value={growthDays} onChange={(e) => setGrowthDays(+e.target.value)} />
                </div>
                <div>
                  <label className="label">🎨 Color</label>
                  <input className="input h-10 p-1" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">{t('feedFreq')}</label>
                <select className="input" value={feedFreq} onChange={(e) => setFeedFreq(e.target.value as any)}>
                  <option value="daily">{t('freqDaily')}</option>
                  <option value="twice_daily">{t('freqTwice')}</option>
                  <option value="every_2_days">{t('freq2Days')}</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setAdding(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={createCustom} disabled={busy} className="btn-primary flex-1">{busy ? '…' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
