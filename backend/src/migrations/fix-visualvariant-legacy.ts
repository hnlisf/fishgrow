#!/usr/bin/env -S node --import tsx
/**
 * One-off, idempotent migration for BUG-V10.1.4-3.
 * golden -> yellow, striped -> stripe, round -> disc.
 *
 * Usage (from backend/):
 *   npm run migrate:visualvariant
 *   DRY_RUN=1 npm run migrate:visualvariant
 * DATABASE_URL may point to a SQLite fixture or deployment database.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
// P2 PR 11 — i18n helper（项目策略禁止裸 JSON.parse）
import { safeParse } from '../common/i18n';
// P3 §2.2 PR 15：visualVariant 映射统一到 src/common/mappings/visual-variant.ts
// LEGACY_TO_CANONICAL 在 visual-variant.ts 中定义（已通过 canonicalize 间接使用）
import { canonicalize } from '../common/mappings/visual-variant';

const DIMENSIONS = ['color', 'pattern', 'body'] as const;

function sqlitePath(): string | null {
  const url = process.env.DATABASE_URL || 'file:./dev.db';
  if (!url.startsWith('file:')) return null;
  const raw = url.slice('file:'.length);
  return isAbsolute(raw) ? raw : resolve(process.cwd(), 'prisma', raw.replace(/^\.\//, ''));
}

async function main(): Promise<void> {
  const dryRun = process.env.DRY_RUN === '1';
  const dbPath = sqlitePath();
  if (dbPath && !existsSync(dbPath)) throw new Error(`DB file does not exist: ${dbPath}`);
  if (dbPath && !dryRun) {
    const backup = `${dbPath}.before-visualvariant-${new Date().toISOString().replace(/[:.]/g, '-')}.bak`;
    copyFileSync(dbPath, backup);
    console.log(`backup\t${backup}`);
  }

  const prisma = new PrismaClient();
  let scanned = 0;
  let migrated = 0;
  let skippedInvalid = 0;
  const counts = new Map<string, number>();

  try {
    const rows = await prisma.fishSpecies.findMany({
      where: { visualVariant: { not: null } },
      select: { id: true, visualVariant: true },
    });
    scanned = rows.length;

    for (const row of rows) {
      // P2 PR 11: 用 safeParse 替换裸 JSON.parse（项目策略禁止）
      const value = safeParse<Record<string, unknown>>(row.visualVariant!, null as any);
      if (!value) {
        console.warn(`skip-invalid-json\t${row.id}`);
        skippedInvalid++;
        continue;
      }

      let changed = false;
      for (const dim of DIMENSIONS) {
        const oldValue = value[dim];
        if (typeof oldValue !== 'string') continue;
        // P3 §2.2 PR 15：改用共享映射函数（与 service 保持一致）
        const newValue = canonicalize(dim as any, oldValue);
        if (newValue === oldValue) continue;  // 没变 = 已规范
        value[dim] = newValue;
        counts.set(`${dim}\t${oldValue}\t${newValue}`, (counts.get(`${dim}\t${oldValue}\t${newValue}`) || 0) + 1);
        changed = true;
      }

      if (!changed) continue;
      migrated++;
      if (!dryRun) {
        await prisma.fishSpecies.update({
          where: { id: row.id },
          data: { visualVariant: JSON.stringify(value) },
        });
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('dimension\tfrom\tto\tcount');
  for (const [key, count] of counts) console.log(`${key}\t${count}`);
  console.log(`summary\tscanned=${scanned}\tmigrated=${migrated}\tinvalid=${skippedInvalid}\tdryRun=${dryRun}`);
}

main().catch((error) => {
  console.error(`[fix-visualvariant-legacy] ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
