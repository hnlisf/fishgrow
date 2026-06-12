import { FishTanksService } from './fish-tanks.service';

/**
 * Unit tests for FishTanksService.
 *
 * We mock the PrismaService and FishSpeciesService so we can exercise the
 * business logic (create/update/tick) without a real database.
 */
describe('FishTanksService', () => {
  let svc: FishTanksService;
  let prisma: any;
  let speciesService: any;

  beforeEach(() => {
    prisma = {
      fishTank: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };
    speciesService = { toI18n: jest.fn((s: any, lang: string) => ({ ...s, lang })) };
    svc = new FishTanksService(prisma, speciesService);
  });

  describe('findAllByUser', () => {
    it('returns tanks with i18n applied to nested fish species', async () => {
      const tank = { id: 't1', fish: [{ species: { name: 'goldfish' } }] };
      prisma.fishTank.findMany.mockResolvedValue([tank]);
      const result = await svc.findAllByUser('u1', 'en');
      expect(prisma.fishTank.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        include: { fish: { include: { species: true } } },
        orderBy: { createdAt: 'asc' },
      });
      expect(speciesService.toI18n).toHaveBeenCalledWith({ name: 'goldfish' }, 'en');
      expect(result[0].fish[0].species).toEqual({ name: 'goldfish', lang: 'en' });
    });

    it('handles tanks with no fish without crashing', async () => {
      prisma.fishTank.findMany.mockResolvedValue([{ id: 't1' }]);
      const result = await svc.findAllByUser('u1');
      expect(result[0]).toEqual({ id: 't1' });
    });
  });

  describe('findOne', () => {
    it('returns null when tank does not exist', async () => {
      prisma.fishTank.findUnique.mockResolvedValue(null);
      expect(await svc.findOne('missing')).toBeNull();
    });

    it('returns the tank with i18n applied', async () => {
      const tank = { id: 't1', fish: [{ species: { name: 'koi' } }] };
      prisma.fishTank.findUnique.mockResolvedValue(tank);
      const result = await svc.findOne('t1', 'ja');
      expect(result.fish[0].species.lang).toBe('ja');
    });
  });

  describe('create', () => {
    it('uses provided userId when it already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.fishTank.create.mockResolvedValue({ id: 't1', userId: 'u1' });
      const result = await svc.create({ userId: 'u1', name: 'My tank' });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.fishTank.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 'u1', name: 'My tank' }),
      });
      expect(result.id).toBe('t1');
    });

    it('creates a new user when provided userId does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'u-new' });
      prisma.fishTank.create.mockResolvedValue({ id: 't1', userId: 'u-new' });
      await svc.create({ userId: 'u-missing' });
      expect(prisma.user.create).toHaveBeenCalledWith({ data: { id: 'u-missing' } });
    });

    it('reuses latest user when no userId provided (single-user mode)', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u-latest' });
      prisma.fishTank.create.mockResolvedValue({ id: 't1', userId: 'u-latest' });
      await svc.create({});
      expect(prisma.fishTank.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 'u-latest' }),
      });
    });

    it('creates a fresh user when no users exist yet', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'u-fresh' });
      prisma.fishTank.create.mockResolvedValue({ id: 't1', userId: 'u-fresh' });
      await svc.create({});
      expect(prisma.user.create).toHaveBeenCalledWith({ data: {} });
    });

    it('applies defaults for missing fields', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u1' });
      prisma.fishTank.create.mockResolvedValue({ id: 't1' });
      await svc.create({});
      const args = prisma.fishTank.create.mock.calls[0][0];
      expect(args.data).toMatchObject({
        name: '我的鱼缸',
        size: 'medium',
        temp: 24.0,
        ph: 7.0,
      });
    });
  });

  describe('update / remove', () => {
    it('update throws NotFound when tank does not exist', async () => {
      prisma.fishTank.findUnique.mockResolvedValue(null);
      await expect(svc.update('missing', { name: 'x' })).rejects.toThrow();
    });

    it('update succeeds when tank exists', async () => {
      prisma.fishTank.findUnique.mockResolvedValue({ id: 't1' });
      prisma.fishTank.update.mockResolvedValue({ id: 't1', name: 'new' });
      await svc.update('t1', { name: 'new' });
      expect(prisma.fishTank.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { name: 'new' },
      });
    });

    it('remove throws NotFound when tank does not exist', async () => {
      prisma.fishTank.findUnique.mockResolvedValue(null);
      await expect(svc.remove('missing')).rejects.toThrow();
    });
  });

  describe('tick', () => {
    it('decays cleanliness and oxygen over time', async () => {
      prisma.fishTank.findUnique.mockResolvedValue({
        id: 't1', cleanliness: 100, oxygen: 100, ph: 7.0,
      });
      prisma.fishTank.update.mockImplementation(({ data }: any) => ({ id: 't1', ...data }));

      const result = await svc.tick('t1', 24); // 1 day
      // 5% cleanliness decay, 4% oxygen decay
      expect(result.cleanliness).toBeCloseTo(95, 1);
      expect(result.oxygen).toBeCloseTo(96, 1);
    });

    it('clamps cleanliness/oxygen to 0 (no negatives)', async () => {
      prisma.fishTank.findUnique.mockResolvedValue({
        id: 't1', cleanliness: 2, oxygen: 2, ph: 7.0,
      });
      prisma.fishTank.update.mockImplementation(({ data }: any) => ({ id: 't1', ...data }));
      const result = await svc.tick('t1', 24 * 30); // 30 days
      expect(result.cleanliness).toBe(0);
      expect(result.oxygen).toBe(0);
    });

    it('throws NotFound when ticking a missing tank', async () => {
      prisma.fishTank.findUnique.mockResolvedValue(null);
      await expect(svc.tick('missing')).rejects.toThrow();
    });
  });
});
