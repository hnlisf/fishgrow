import { FishService } from './fish.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

/**
 * Unit tests for FishService.
 *
 * - Pure helpers (feedIntervalHours, computeStage) tested with no-DI constructor.
 * - Async methods (findAllByTank, findOne, create, update, remove, feed) tested
 *   with a mocked PrismaService + FishSpeciesService.
 */
describe('FishService pure helpers', () => {
  let svc: FishService;

  beforeEach(() => {
    // Cast through any to avoid wiring PrismaService for unit tests.
    svc = new FishService({} as any, {} as any);
  });

  describe('feedIntervalHours', () => {
    it('returns 12h for daily', () => {
      expect(svc.feedIntervalHours('daily')).toBe(12);
    });
    it('returns 6h for twice_daily', () => {
      expect(svc.feedIntervalHours('twice_daily')).toBe(6);
    });
    it('returns 36h for every_2_days', () => {
      expect(svc.feedIntervalHours('every_2_days')).toBe(36);
    });
    it('returns default 8h for unknown freq', () => {
      expect(svc.feedIntervalHours('weekly')).toBe(8);
      expect(svc.feedIntervalHours('')).toBe(8);
    });
  });

  describe('computeStage', () => {
    const stages = JSON.stringify([
      { name: 'fry', days: 7 },
      { name: 'juvenile', days: 30 },
      { name: 'subadult', days: 60 },
      { name: 'adult', days: 90 },
    ]);

    it('returns fry for 0% growth', () => {
      expect(svc.computeStage(0, stages)).toBe('fry');
    });
    it('stays at fry for the first portion of growth', () => {
      // Note: stages[i].days is the end-of-stage in days. The transition
      // boundary is `days >= s.days`, so a fish is in stage N until growth
      // crosses N's day threshold. We use slightly-larger growth values
      // (e.g. 50%) to avoid floating-point edge cases at the exact boundary.
      expect(svc.computeStage(0, stages)).toBe('fry');
      expect(svc.computeStage(10, stages)).toBe('fry');
    });
    it('promotes past fry once growth exceeds the juvenile threshold', () => {
      // 50% growth → 45 days → past 30d juvenile threshold
      expect(svc.computeStage(50, stages)).toBe('juvenile');
    });
    it('promotes past juvenile once growth exceeds the subadult threshold', () => {
      // 75% growth → 67.5 days → past 60d subadult threshold
      expect(svc.computeStage(75, stages)).toBe('subadult');
    });
    it('returns adult at full growth', () => {
      expect(svc.computeStage(100, stages)).toBe('adult');
    });
    it('falls back to fry on invalid JSON', () => {
      expect(svc.computeStage(50, 'not-json')).toBe('fry');
    });
    it('falls back to fry on empty array', () => {
      expect(svc.computeStage(50, '[]')).toBe('fry');
    });
  });
});

describe('FishService async methods', () => {
  let svc: FishService;
  let prisma: any;
  let speciesService: any;

  const baseSpecies = {
    id: 's1',
    nameI18n: JSON.stringify({ zh: '金鱼', en: 'Goldfish' }),
    descI18n: JSON.stringify({ zh: '...' }),
    feedFreq: 'twice_daily',
    growthDays: 90,
    tempMin: 18, tempMax: 26,
    stages: JSON.stringify([
      { name: 'fry', days: 7 },
      { name: 'juvenile', days: 30 },
      { name: 'subadult', days: 60 },
      { name: 'adult', days: 90 },
    ]),
  };

  const baseFish = {
    id: 'f1', tankId: 't1', speciesId: 's1', name: '小金',
    birthday: new Date(Date.now() - 10 * 24 * 3600 * 1000), // 10 days old
    stage: 'fry', growth: 11, health: 80, nutrition: 50,
    lastFedAt: new Date(Date.now() - 24 * 3600 * 1000), // fed 1 day ago
    species: baseSpecies,
  };

  beforeEach(() => {
    prisma = {
      fish: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      fishTank: { findUnique: jest.fn() },
      fishSpecies: { findUnique: jest.fn() },
      feedRecord: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    speciesService = {
      toI18n: jest.fn((s: any, lang: string) => ({ ...s, _lang: lang })),
    };
    svc = new FishService(prisma, speciesService);
  });

  describe('findAllByTank', () => {
    it('returns fish with i18n species attached', async () => {
      prisma.fish.findMany.mockResolvedValue([{ id: 'f1', species: baseSpecies }]);
      const result = await svc.findAllByTank('t1', 'en');
      expect(speciesService.toI18n).toHaveBeenCalledWith(baseSpecies, 'en');
      expect(result[0].species._lang).toBe('en');
    });
  });

  describe('findOne', () => {
    it('returns null when fish does not exist', async () => {
      prisma.fish.findUnique.mockResolvedValue(null);
      expect(await svc.findOne('missing')).toBeNull();
    });

    it('attaches i18n species', async () => {
      prisma.fish.findUnique.mockResolvedValue({ id: 'f1', species: baseSpecies });
      const result = await svc.findOne('f1', 'ja');
      expect(result.species._lang).toBe('ja');
    });
  });

  describe('create', () => {
    it('throws NotFound when tank missing', async () => {
      prisma.fishTank.findUnique.mockResolvedValue(null);
      await expect(svc.create({ tankId: 't', speciesId: 's' })).rejects.toThrow(NotFoundException);
    });

    it('throws NotFound when species missing', async () => {
      prisma.fishTank.findUnique.mockResolvedValue({ id: 't' });
      prisma.fishSpecies.findUnique.mockResolvedValue(null);
      await expect(svc.create({ tankId: 't', speciesId: 's' })).rejects.toThrow(NotFoundException);
    });

    it('creates fish with default initial state', async () => {
      prisma.fishTank.findUnique.mockResolvedValue({ id: 't' });
      prisma.fishSpecies.findUnique.mockResolvedValue(baseSpecies);
      prisma.fish.create.mockImplementation(({ data }: any) => data);
      const result = await svc.create({ tankId: 't', speciesId: 's' });
      expect(result).toMatchObject({
        tankId: 't', speciesId: 's',
        stage: 'fry', growth: 0, health: 100, nutrition: 100,
      });
    });
  });

  describe('feed', () => {
    it('throws NotFound when fish missing', async () => {
      prisma.fish.findUnique.mockResolvedValue(null);
      await expect(svc.feed('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequest when feeding too soon (twice_daily = 6h)', async () => {
      prisma.fish.findUnique.mockResolvedValue({
        ...baseFish, lastFedAt: new Date(Date.now() - 1 * 3600 * 1000), // 1h ago
      });
      await expect(svc.feed('f1')).rejects.toThrow(BadRequestException);
    });

    it('updates fish + creates feedRecord on successful feed', async () => {
      prisma.fish.findUnique.mockResolvedValue(baseFish);
      prisma.$transaction.mockResolvedValue([{ id: 'f1', growth: 50 }]);
      const result = await svc.feed('f1', 'normal');
      expect(result.id).toBe('f1');
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const txOps = prisma.$transaction.mock.calls[0][0];
      expect(txOps).toHaveLength(2); // fish update + feedRecord create
    });

    it('clamps nutrition to 100 even with large amount', async () => {
      const fullFish = { ...baseFish, nutrition: 80 };
      prisma.fish.findUnique.mockResolvedValue(fullFish);
      prisma.$transaction.mockResolvedValue([{ id: 'f1' }]);
      await svc.feed('f1', 'large'); // +50, would be 130 → clamped to 100
      // The first arg to $transaction is an array of Prisma operation promises
      const txArgs = prisma.$transaction.mock.calls[0][0];
      // When using array form, $transaction awaits each entry; verify the fish update
      // by inspecting the prisma.fish.update mock that was passed in.
      const fishUpdateMock = prisma.fish.update;
      expect(fishUpdateMock).toHaveBeenCalledTimes(1);
      // Re-run with a captured update to inspect data directly
      const captured: any[] = [];
      prisma.fish.update.mockImplementation(({ data }: any) => { captured.push(data); return {}; });
      prisma.$transaction.mockReset();
      prisma.$transaction.mockResolvedValue([{ id: 'f1' }]);
      await svc.feed('f1', 'large');
      expect(captured[0].nutrition).toBe(100);
    });
  });
});
