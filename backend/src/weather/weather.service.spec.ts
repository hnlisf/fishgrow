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

    it('builds Open-Meteo URL with split lat and lon (not concatenated)', async () => {
      // Regression for Bug 3 (task t_0b43dae4): the URL must pass
      // latitude and longitude as separate query params, not as a single
      // "lat,lon" string in the latitude param. If the URL is malformed,
      // Open-Meteo returns 400 and we fall back to a fake 20°C.
      prisma.weatherCache.findFirst.mockResolvedValue(null);
      const originalFetch = (global as any).fetch;
      let capturedUrl = '';
      (global as any).fetch = jest.fn(async (url: string) => {
        capturedUrl = url;
        return {
          ok: true,
          json: async () => ({
            current: {
              temperature_2m: 26.8,
              apparent_temperature: 28.0,
              relative_humidity_2m: 65,
              weather_code: 2,
              wind_speed_10m: 3.1,
            },
          }),
        };
      });
      prisma.weatherCache.create.mockResolvedValue({});
      try {
        const result = await svc.getWeather(39.9, 116.4);
        // Assert URL shape — both lat and lon must be separate params
        expect(capturedUrl).toContain('latitude=39.9');
        expect(capturedUrl).toContain('longitude=116.4');
        expect(capturedUrl).not.toContain('latitude=39.9,116.4');
        expect(capturedUrl).not.toContain('latitude=39.9%2C116.4');
        // And the response is real (not the 20°C fallback)
        expect(result.temp).toBe(26.8);
        expect(result.source).toBe('live');
      } finally {
        (global as any).fetch = originalFetch;
      }
    });
  });
});
