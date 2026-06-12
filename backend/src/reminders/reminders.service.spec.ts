import { RemindersService } from './reminders.service';

/**
 * Unit tests for RemindersService.
 * Mocks PrismaService to exercise CRUD + i18n + ensureDefaults logic.
 */
describe('RemindersService', () => {
  let svc: RemindersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      reminder: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      fishTank: {
        findMany: jest.fn(),
      },
    };
    svc = new RemindersService(prisma);
  });

  describe('list', () => {
    it('filters out completed reminders by default', async () => {
      prisma.reminder.findMany.mockResolvedValue([]);
      await svc.list('u1');
      expect(prisma.reminder.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1', isDone: false },
        orderBy: { dueAt: 'asc' },
      });
    });

    it('includes completed reminders when requested', async () => {
      prisma.reminder.findMany.mockResolvedValue([]);
      await svc.list('u1', true);
      expect(prisma.reminder.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { dueAt: 'asc' },
      });
    });

    it('applies i18n to title field per lang', async () => {
      prisma.reminder.findMany.mockResolvedValue([
        { id: 'r1', titleI18n: JSON.stringify({ zh: '喂食', en: 'Feed', ja: '餌' }) },
      ]);
      const result = await svc.list('u1', false, 'ja');
      expect(result[0].title).toBe('餌');
      expect(result[0].titleI18n).toEqual({ zh: '喂食', en: 'Feed', ja: '餌' });
    });
  });

  describe('toI18n', () => {
    it('returns zh title as fallback when lang missing', () => {
      const r = { id: 'r1', titleI18n: JSON.stringify({ zh: '喂食' }) } as any;
      const result = svc.toI18n(r, 'en');
      expect(result.title).toBe('喂食');
    });

    it('returns raw titleI18n when neither lang nor zh present', () => {
      const r = { id: 'r1', titleI18n: 'plain string' } as any;
      const result = svc.toI18n(r, 'en');
      expect(result.title).toBe('plain string');
    });

    it('handles invalid JSON gracefully', () => {
      const r = { id: 'r1', titleI18n: 'not-json' } as any;
      const result = svc.toI18n(r, 'en');
      expect(result.titleI18n).toEqual({});
      expect(result.title).toBe('not-json');
    });
  });

  describe('create', () => {
    it('converts dueAt string to Date', async () => {
      prisma.reminder.create.mockImplementation(({ data }: any) => data);
      const dueAt = '2026-07-01T00:00:00Z';
      const result = await svc.create({
        userId: 'u1', type: 'feed', titleI18n: '{}', dueAt,
      });
      expect(result.dueAt).toBeInstanceOf(Date);
      // Drop the .000 millisecond suffix; Date adds it back
      expect(result.dueAt.toISOString().replace(/\.000Z$/, 'Z')).toBe(dueAt);
    });
  });

  describe('update / remove', () => {
    it('update throws NotFound when reminder missing', async () => {
      prisma.reminder.findUnique.mockResolvedValue(null);
      await expect(svc.update('missing', { isDone: true })).rejects.toThrow();
    });

    it('update succeeds when reminder exists', async () => {
      prisma.reminder.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.reminder.update.mockResolvedValue({ id: 'r1', isDone: true });
      await svc.update('r1', { isDone: true });
      expect(prisma.reminder.update).toHaveBeenCalled();
    });

    it('remove throws NotFound when missing', async () => {
      prisma.reminder.findUnique.mockResolvedValue(null);
      await expect(svc.remove('missing')).rejects.toThrow();
    });
  });

  describe('ensureDefaults', () => {
    it('skips when user already has reminders', async () => {
      prisma.reminder.count.mockResolvedValue(3);
      const result = await svc.ensureDefaults('u1');
      expect(result).toEqual([]);
      expect(prisma.fishTank.findMany).not.toHaveBeenCalled();
    });

    it('creates 3 default reminders per tank when none exist', async () => {
      prisma.reminder.count.mockResolvedValue(0);
      prisma.fishTank.findMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);
      prisma.reminder.create.mockImplementation(({ data }: any) => ({ id: 'r', ...data }));

      const result = await svc.ensureDefaults('u1');
      expect(result).toHaveLength(6); // 3 per tank × 2 tanks
      // First reminder of first tank should be feed type, 1 day out
      const types = result.map((r: any) => r.type);
      expect(types).toEqual(['feed', 'water_change', 'clean', 'feed', 'water_change', 'clean']);
      // First feed reminder's dueAt should be ~24h in the future
      const now = Date.now();
      const feedDue = new Date(result[0].dueAt).getTime();
      expect(feedDue - now).toBeGreaterThan(23 * 3600 * 1000);
      expect(feedDue - now).toBeLessThan(25 * 3600 * 1000);
    });
  });
});
