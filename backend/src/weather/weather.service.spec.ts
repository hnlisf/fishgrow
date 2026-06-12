import { WeatherService } from './weather.service';

/**
 * Unit tests for WeatherService pure helpers and live-fetch path.
 * Mocks global fetch and PrismaService.
 */
describe('WeatherService', () => {
  let svc: WeatherService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      weatherCache: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };
    svc = new WeatherService(prisma);
  });

  describe('describeCode', () => {
    it('classifies WMO weather codes into Chinese descriptions', () => {
      expect(svc.describeCode(0)).toBe('晴朗');
      expect(svc.describeCode(1)).toBe('多云');
      expect(svc.describeCode(3)).toBe('多云');
      expect(svc.describeCode(45)).toBe('雾');
      expect(svc.describeCode(51)).toBe('雨');
      expect(svc.describeCode(67)).toBe('雨');
      expect(svc.describeCode(75)).toBe('雪');
      expect(svc.describeCode(95)).toBe('雷暴');
      expect(svc.describeCode(150)).toBe('未知');
    });
  });

  describe('getWeather cache behavior', () => {
    it('returns cached data when fresh', async () => {
      const cached = {
        data: JSON.stringify({
          lat: 39.9, lon: 116.4, temp: 25, feelsLike: 26,
          humidity: 60, weatherCode: 1, description: '多云',
          windSpeed: 3, cachedAt: new Date().toISOString(),
        }),
      };
      prisma.weatherCache.findFirst.mockResolvedValue(cached);
      const result = await svc.getWeather(39.9, 116.4);
      expect(result.source).toBe('cache');
      expect(result.temp).toBe(25);
      // Should NOT hit network
      expect(prisma.weatherCache.create).not.toHaveBeenCalled();
    });

    it('falls back to live fetch when cache is stale', async () => {
      prisma.weatherCache.findFirst.mockResolvedValue(null);
      // Stub global fetch
      const originalFetch = (global as any).fetch;
      (global as any).fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 22.5,
            apparent_temperature: 23.0,
            relative_humidity_2m: 55,
            weather_code: 2,
            wind_speed_10m: 4.2,
          },
        }),
      }));
      prisma.weatherCache.create.mockResolvedValue({});
      try {
        const result = await svc.getWeather(39.9, 116.4);
        expect(result.source).toBe('live');
        expect(result.temp).toBe(22.5);
        expect(result.description).toBe('多云');
        expect(result.windSpeed).toBe(4.2);
        expect(prisma.weatherCache.create).toHaveBeenCalled();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    it('uses fallback when live API errors', async () => {
      prisma.weatherCache.findFirst.mockResolvedValue(null);
      const originalFetch = (global as any).fetch;
      (global as any).fetch = jest.fn(async () => ({ ok: false, status: 500 }));
      prisma.weatherCache.create.mockResolvedValue({});
      try {
        const result = await svc.getWeather(39.9, 116.4);
        expect(result.source).toBe('live');
        expect(result.temp).toBe(20); // fallback default
        expect(result.description).toBe('晴朗');
      } finally {
        (global as any).fetch = originalFetch;
      }
    });
  });
});
