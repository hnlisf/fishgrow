import { FeedingAdviceService } from './feeding-advice.service';

/**
 * Unit tests for FeedingAdviceService.
 * Mocks the WeatherService to avoid network calls.
 */
describe('FeedingAdviceService', () => {
  let svc: FeedingAdviceService;
  let prisma: any;
  let weather: any;

  beforeEach(() => {
    prisma = {
      fish: {
        findMany: jest.fn(),
      },
    };
    weather = {
      getWeather: jest.fn(),
    };
    svc = new FeedingAdviceService(prisma, weather);
  });

  describe('getAdviceForUser', () => {
    it('returns empty array when user has no fish', async () => {
      prisma.fish.findMany.mockResolvedValue([]);
      const result = await svc.getAdviceForUser('u1', 'zh');
      expect(result).toEqual([]);
      // Should NOT hit weather when no fish
      expect(weather.getWeather).not.toHaveBeenCalled();
    });

    it('returns ideal-mid advice when weather is at the midpoint of species range', async () => {
      prisma.fish.findMany.mockResolvedValue([
        { speciesId: 's1', species: { id: 's1', nameI18n: JSON.stringify({ zh: '金鱼' }), tempMin: 18, tempMax: 26 } },
      ]);
      weather.getWeather.mockResolvedValue({ temp: 22, description: '晴' }); // mid=22
      const result = await svc.getAdviceForUser('u1', 'zh');
      expect(result).toHaveLength(1);
      expect(result[0].tempSuitability).toBe('ideal');
      expect(result[0].speciesName).toBe('金鱼');
      expect(result[0].recommendation).toContain('22');
      expect(result[0].actionItems).toContain('按鱼种频率正常投喂');
    });

    it('returns ideal (not mid) when in range but not at midpoint', async () => {
      prisma.fish.findMany.mockResolvedValue([
        { speciesId: 's1', species: { id: 's1', nameI18n: JSON.stringify({ zh: '金鱼' }), tempMin: 18, tempMax: 26 } },
      ]);
      // mid=22, tolerance=4, idealMid window = ±1.2 → so 19 should be ideal but not mid
      weather.getWeather.mockResolvedValue({ temp: 19, description: '阴' });
      const result = await svc.getAdviceForUser('u1', 'zh');
      expect(result[0].tempSuitability).toBe('ideal');
      expect(result[0].recommendation).toContain('适宜');
    });

    it('returns "ok" with cold advice when weather is slightly below min', async () => {
      prisma.fish.findMany.mockResolvedValue([
        { speciesId: 's1', species: { id: 's1', nameI18n: JSON.stringify({ zh: '金鱼' }), tempMin: 18, tempMax: 26 } },
      ]);
      weather.getWeather.mockResolvedValue({ temp: 16, description: '冷' }); // 2 below min
      const result = await svc.getAdviceForUser('u1', 'zh');
      expect(result[0].tempSuitability).toBe('ok');
      expect(result[0].recommendation).toContain('略低');
      expect(result[0].actionItems).toContain('投喂量减半');
    });

    it('returns "ok" with hot advice when weather is slightly above max', async () => {
      prisma.fish.findMany.mockResolvedValue([
        { speciesId: 's1', species: { id: 's1', nameI18n: JSON.stringify({ zh: '金鱼' }), tempMin: 18, tempMax: 26 } },
      ]);
      weather.getWeather.mockResolvedValue({ temp: 28, description: '热' }); // 2 above max
      const result = await svc.getAdviceForUser('u1', 'zh');
      expect(result[0].tempSuitability).toBe('ok');
      expect(result[0].recommendation).toContain('略高');
      expect(result[0].actionItems).toContain('开启增氧泵');
    });

    it('returns "poor" when temperature is far outside the range', async () => {
      prisma.fish.findMany.mockResolvedValue([
        { speciesId: 's1', species: { id: 's1', nameI18n: JSON.stringify({ zh: '金鱼' }), tempMin: 18, tempMax: 26 } },
      ]);
      weather.getWeather.mockResolvedValue({ temp: 5, description: '寒' }); // way below
      const result = await svc.getAdviceForUser('u1', 'zh');
      expect(result[0].tempSuitability).toBe('poor');
      expect(result[0].recommendation).toContain('远超');
      expect(result[0].actionItems).toContain('检查加热棒');
    });

    it('uses ja locale for species name and action items', async () => {
      prisma.fish.findMany.mockResolvedValue([
        { speciesId: 's1', species: { id: 's1', nameI18n: JSON.stringify({ zh: '金鱼', ja: '金魚' }), tempMin: 18, tempMax: 26 } },
      ]);
      weather.getWeather.mockResolvedValue({ temp: 22, description: '晴' });
      const result = await svc.getAdviceForUser('u1', 'ja');
      expect(result[0].speciesName).toBe('金魚');
      expect(result[0].actionItems).toContain('魚種の頻度に従って餌やり');
    });

    it('falls back to zh species name when requested lang missing', async () => {
      prisma.fish.findMany.mockResolvedValue([
        { speciesId: 's1', species: { id: 's1', nameI18n: JSON.stringify({ zh: '金鱼' }), tempMin: 18, tempMax: 26 } },
      ]);
      weather.getWeather.mockResolvedValue({ temp: 22, description: '晴' });
      const result = await svc.getAdviceForUser('u1', 'en');
      expect(result[0].speciesName).toBe('金鱼');
    });

    it('handles invalid JSON in nameI18n gracefully', async () => {
      prisma.fish.findMany.mockResolvedValue([
        { speciesId: 's1', species: { id: 's1', nameI18n: 'not-json', tempMin: 18, tempMax: 26 } },
      ]);
      weather.getWeather.mockResolvedValue({ temp: 22, description: '晴' });
      const result = await svc.getAdviceForUser('u1', 'zh');
      expect(result[0].speciesName).toBe('not-json');
    });

    it('falls back to zh strings when lang is unknown', async () => {
      prisma.fish.findMany.mockResolvedValue([
        { speciesId: 's1', species: { id: 's1', nameI18n: JSON.stringify({ zh: '金鱼' }), tempMin: 18, tempMax: 26 } },
      ]);
      weather.getWeather.mockResolvedValue({ temp: 22, description: '晴' });
      const result = await svc.getAdviceForUser('u1', 'fr'); // unknown lang
      expect(result[0].actionItems).toContain('按鱼种频率正常投喂');
    });
  });
});
