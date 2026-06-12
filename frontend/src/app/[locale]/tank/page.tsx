'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api, useApi, FishTank, Fish } from '@/lib/api';

const TANK_ID_KEY = 'fishgrow.tankId';
// MVP: hardcoded demo user. Backend creates this user on first tank create,
// or the seed already has a user with fish. We always pass it on first POST.
const USER_ID = 'demo-user';

function getStoredTankId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TANK_ID_KEY);
}
function setStoredTankId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TANK_ID_KEY, id);
}

function FishAvatar({ fish, size = 80 }: { fish: Fish; size?: number }) {
  const stageSize = {
    fry: 0.4,
    juvenile: 0.6,
    subadult: 0.8,
    adult: 1.0,
  }[fish.stage] ?? 0.5;
  const color = fish.species?.color ?? '#5BA9C7';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full bg-fishbowl animate-swim"
           style={{ background: `radial-gradient(circle, ${color}55 0%, ${color}aa 100%)` }} />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
        style={{ fontSize: size * stageSize * 0.7, animation: 'swim 6s ease-in-out infinite' }}
      >
        🐟
      </div>
      {size >= 60 && fish.stage === 'adult' && (
        <div className="absolute -top-1 -right-1 text-lg">✨</div>
      )}
    </div>
  );
}

function StatBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-water-600 mb-1">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full bg-water-50 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function TankPage() {
  const t = useTranslations('tank');
  const tf = useTranslations('fish');
  const tCommon = useTranslations('common');
  const [tankId, setTankId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('我的鱼缸');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [busy, setBusy] = useState(false);

  // Init: hydrate tankId from localStorage. If absent, look up the demo
  // user's existing tanks (the seed creates one) and adopt it.
  useEffect(() => {
    const id = getStoredTankId();
    if (id) { setTankId(id); return; }
    (async () => {
      try {
        const tanks = await api<FishTank[]>(`/api/fish-tanks?userId=${USER_ID}`);
        if (tanks.length) {
          setStoredTankId(tanks[0].id);
          setTankId(tanks[0].id);
        }
      } catch { /* ignore — user can still create manually */ }
    })();
  }, []);

  const { data: tank, loading, refetch } = useApi<FishTank>(tankId ? `/api/fish-tanks/${tankId}` : null);
  const { data: fishList, refetch: refetchFish } = useApi<Fish[]>(tankId ? `/api/fish?tankId=${tankId}` : null);

  const createTank = async () => {
    setBusy(true);
    try {
      const created = await api<FishTank>('/api/fish-tanks', {
        method: 'POST',
        body: JSON.stringify({ userId: USER_ID, name, size }),
      });
      setStoredTankId(created.id);
      setTankId(created.id);
      setCreating(false);
    } catch (e: any) {
      alert('Failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  const feedAll = async () => {
    if (!fishList?.length) return;
    setBusy(true);
    try {
      for (const f of fishList) {
        await api(`/api/fish/${f.id}/feed`, { method: 'POST', body: JSON.stringify({ amount: 'normal' }) });
      }
      refetch();
      refetchFish();
    } catch (e: any) {
      alert('Feed failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-water-600">{t('loading')}</p>;

  if (!tank) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-water-600">{t('title')}</h1>
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🐠</div>
          <p className="text-water-600 mb-6">{t('empty')}</p>
          {!creating ? (
            <button onClick={() => setCreating(true)} className="btn-primary">
              {t('createButton')}
            </button>
          ) : (
            <div className="max-w-sm mx-auto space-y-3 text-left">
              <div>
                <label className="label">{t('name')}</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">{t('size')}</label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`flex-1 py-2 rounded-xl ${size === s ? 'bg-water-400 text-white' : 'bg-water-50 text-water-600'}`}
                    >
                      {s === 'small' ? t('sizeSmall') : s === 'medium' ? t('sizeMedium') : t('sizeLarge')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCreating(false)} className="btn-secondary flex-1">{tCommon('cancel')}</button>
                <button onClick={createTank} disabled={busy} className="btn-primary flex-1">
                  {busy ? '…' : tCommon('create')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-water-600">{tank.name}</h1>
        <div className="flex gap-2">
          <button onClick={() => { refetch(); refetchFish(); }} className="btn-secondary text-sm">↻</button>
          <button onClick={feedAll} disabled={busy || !fishList?.length} className="btn-accent text-sm">
            {t('feedAll')}
          </button>
        </div>
      </div>

      {/* Tank visual */}
      <div className="card bg-fishbowl min-h-[260px] relative overflow-hidden">
        <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-white/70 text-water-600">
          {tank.temp}°C · pH {tank.ph.toFixed(1)}
        </div>
        {fishList && fishList.length > 0 ? (
          <div className="flex flex-wrap gap-4 items-end justify-center h-full py-8">
            {fishList.map((f, i) => (
              <div key={f.id} className="flex flex-col items-center animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
                <FishAvatar fish={f} size={70 + (fishList.indexOf(f) === 0 ? 10 : 0)} />
                <p className="text-xs text-white/90 mt-1 font-medium drop-shadow">{f.name || tf(`stage.${f.stage}`)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/80 py-16">
            <div className="text-center">
              <div className="text-5xl mb-2">🫧</div>
              <p>{t('noFish')}</p>
            </div>
          </div>
        )}
        {/* bubbles */}
        <div className="absolute bottom-2 left-6 w-2 h-2 rounded-full bg-white/40 animate-bubble" />
        <div className="absolute bottom-2 right-10 w-3 h-3 rounded-full bg-white/30 animate-bubble" style={{ animationDelay: '2s' }} />
      </div>

      {/* Tank status */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-water-600">{t('tankStatus')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatBar value={tank.cleanliness} color="#5BA9C7" label={t('cleanliness')} />
          <StatBar value={tank.oxygen} color="#7FC0D5" label={t('oxygen')} />
        </div>
      </div>

      {/* Fish list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-water-600">{t('fish')} ({fishList?.length ?? 0})</h2>
          <Link href="/species" className="btn-primary text-sm">{t('addFish')}</Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {(fishList ?? []).map((f) => (
            <div key={f.id} className="rounded-2xl bg-sand-50/60 p-3 flex items-center gap-3">
              <FishAvatar fish={f} size={56} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-water-600 truncate">{f.name || tf(`stage.${f.stage}`)}</p>
                <p className="text-xs text-water-500">{tf(`stage.${f.stage}`)} · {Math.round(f.growth)}%</p>
                <div className="flex gap-1 mt-1.5">
                  <span className="badge bg-water-100 text-water-600 text-[10px]">💚 {Math.round(f.health)}</span>
                  <span className="badge bg-sand-100 text-water-600 text-[10px]">🍤 {Math.round(f.nutrition)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
