import 'dotenv/config';
import { main } from '../../prisma/seed';
import { PrismaClient } from '@prisma/client';

/**
 * Verifies the seed script is idempotent: calling main() multiple times
 * should leave the database in the same state (10 default species, 1 demo
 * user, 1 demo tank, 1 goldfish). This is the regression test for
 * "task t_0b43dae4 Bug 1: seed.ts duplicates species".
 *
 * We point Prisma at a separate on-disk DB (under dist/ via a custom
 * DATABASE_URL) so the spec never touches the dev DB and the running
 * backend on :3000 can keep serving.
 */
const TEST_DB_PATH = '/tmp/fishgrow-seed-test.db';
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

// Force the test client to re-resolve after we mutated DATABASE_URL
// (Prisma reads the env var at construction time).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { execSync } = require('child_process');
execSync(`rm -f ${TEST_DB_PATH}`, { stdio: 'ignore' });

describe('seed.ts idempotency', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    // Apply the existing migrations to the test DB
    execSync(`npx prisma migrate deploy --schema prisma/schema.prisma`, {
      stdio: 'ignore',
      env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('first run produces exactly 10 default species + 1 user + 1 tank + 1 fish', async () => {
    await main(prisma);
    const species = await prisma.fishSpecies.count();
    const defaultSpecies = await prisma.fishSpecies.count({ where: { isDefault: true } });
    const users = await prisma.user.count();
    const tanks = await prisma.fishTank.count();
    const fish = await prisma.fish.count();

    expect(species).toBe(10);
    expect(defaultSpecies).toBe(10);
    expect(users).toBe(1);
    expect(tanks).toBe(1);
    expect(fish).toBe(1);
  });

  it('second run is idempotent — still exactly 10 species, not 20 or 30', async () => {
    await main(prisma);
    await main(prisma);
    const species = await prisma.fishSpecies.count();
    const defaultSpecies = await prisma.fishSpecies.count({ where: { isDefault: true } });
    const users = await prisma.user.count();
    const tanks = await prisma.fishTank.count();
    const fish = await prisma.fish.count();

    expect(species).toBe(10);
    expect(defaultSpecies).toBe(10);
    expect(users).toBe(1);
    expect(tanks).toBe(1);
    expect(fish).toBe(1);
  });

  it('handles a pre-existing DB with 20 stale default species — still 10 after seed', async () => {
    // Simulate a bad state: 20 default species already in DB (regression scenario)
    const existing = await prisma.fishSpecies.findMany({ where: { isDefault: true } });
    if (existing.length < 20) {
      // Bulk-insert 10 extras
      const extras = Array.from({ length: 20 - existing.length }, (_, i) => ({
        nameI18n: JSON.stringify({ zh: `重复${i}`, en: `Dup${i}`, ja: `重複${i}` }),
        descI18n: JSON.stringify({ zh: 'd', en: 'd', ja: 'd' }),
        tempMin: 18, tempMax: 26, phMin: 6.5, phMax: 8,
        growthDays: 90, feedFreq: 'twice_daily',
        stages: JSON.stringify([{ name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 7 }]),
        color: '#FFD700', isDefault: true,
      }));
      await prisma.fishSpecies.createMany({ data: extras });
    }
    const before = await prisma.fishSpecies.count();
    expect(before).toBeGreaterThanOrEqual(20);

    await main(prisma);

    const after = await prisma.fishSpecies.count();
    expect(after).toBe(10);
  });
});
