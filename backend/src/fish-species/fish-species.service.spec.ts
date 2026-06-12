import { FishSpeciesService } from './fish-species.service';

/**
 * Unit tests for the toI18n() helper, which is the heart of the
 * localization pipeline. We construct the service with a stub
 * PrismaService because toI18n() only reads its argument.
 */
describe('FishSpeciesService.toI18n', () => {
  let svc: FishSpeciesService;

  beforeEach(() => {
    svc = new FishSpeciesService({} as any);
  });

  const baseRow = {
    id: 'sp-1',
    nameI18n: JSON.stringify({ zh: '金鱼', en: 'Goldfish', ja: '金魚' }),
    descI18n: JSON.stringify({
      zh: '最受欢迎的观赏鱼',
      en: 'Most popular aquarium fish',
      ja: '最も人気のある観賞魚',
    }),
    tempMin: 18,
    tempMax: 26,
    phMin: 6.5,
    phMax: 8,
    growthDays: 90,
    feedFreq: 'twice_daily',
    stages: JSON.stringify([
      { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 7 },
    ]),
    color: '#FFD700',
    isDefault: true,
  } as any;

  it('returns the Chinese name when lang=zh', () => {
    expect(svc.toI18n(baseRow, 'zh').name).toBe('金鱼');
  });

  it('returns the English name when lang=en', () => {
    expect(svc.toI18n(baseRow, 'en').name).toBe('Goldfish');
  });

  it('returns the Japanese name when lang=ja', () => {
    expect(svc.toI18n(baseRow, 'ja').name).toBe('金魚');
  });

  it('falls back to Chinese when requested lang is missing', () => {
    const rowMissingJa = {
      ...baseRow,
      nameI18n: JSON.stringify({ zh: '金鱼', en: 'Goldfish' }),
    };
    expect(svc.toI18n(rowMissingJa, 'ja').name).toBe('金鱼');
  });

  it('falls back to raw nameI18n string when both requested and zh are missing', () => {
    const rowBroken = { ...baseRow, nameI18n: 'unparseable{' };
    expect(svc.toI18n(rowBroken, 'en').name).toBe('unparseable{');
  });

  it('returns parsed stages array', () => {
    const result = svc.toI18n(baseRow, 'en');
    expect(Array.isArray(result.stages)).toBe(true);
    expect(result.stages[0].name).toBe('fry');
  });

  it('returns empty array for stages when JSON is invalid', () => {
    const row = { ...baseRow, stages: 'garbage' };
    expect(svc.toI18n(row, 'en').stages).toEqual([]);
  });

  it('preserves numeric and boolean fields unchanged', () => {
    const result = svc.toI18n(baseRow, 'zh');
    expect(result.tempMin).toBe(18);
    expect(result.growthDays).toBe(90);
    expect(result.isDefault).toBe(true);
    expect(result.color).toBe('#FFD700');
  });
});
