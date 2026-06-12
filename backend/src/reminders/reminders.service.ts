import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Reminder } from '@prisma/client';

export interface CreateReminderDto {
  userId: string;
  type: 'feed' | 'water_change' | 'clean';
  titleI18n: string;
  dueAt: string | Date;
}

export interface UpdateReminderDto {
  isDone?: boolean;
  dueAt?: string | Date;
}

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, includeDone = false, lang = 'zh') {
    const items = await this.prisma.reminder.findMany({
      where: { userId, ...(includeDone ? {} : { isDone: false }) },
      orderBy: { dueAt: 'asc' },
    });
    return items.map((r) => this.toI18n(r, lang));
  }

  toI18n(r: Reminder, lang: string) {
    let titleI18n: Record<string, string> = {};
    try { titleI18n = JSON.parse(r.titleI18n); } catch {}
    return {
      ...r,
      title: titleI18n[lang] || titleI18n['zh'] || r.titleI18n,
      titleI18n,
    };
  }

  async create(data: CreateReminderDto) {
    return this.prisma.reminder.create({
      data: {
        userId: data.userId,
        type: data.type,
        titleI18n: data.titleI18n,
        dueAt: new Date(data.dueAt),
      },
    });
  }

  async update(id: string, data: UpdateReminderDto) {
    const exists = await this.prisma.reminder.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Reminder not found');
    return this.prisma.reminder.update({
      where: { id },
      data: {
        ...data,
        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.reminder.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Reminder not found');
    return this.prisma.reminder.delete({ where: { id } });
  }

  /**
   * Auto-generate default reminders for a user based on their fish tank(s).
   * Called when a tank is created or the user has no reminders yet.
   */
  async ensureDefaults(userId: string) {
    const existing = await this.prisma.reminder.count({ where: { userId } });
    if (existing > 0) return [];

    const tanks = await this.prisma.fishTank.findMany({ where: { userId } });
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const created: Reminder[] = [];
    for (const tank of tanks) {
      const items: CreateReminderDto[] = [
        {
          userId,
          type: 'feed',
          titleI18n: JSON.stringify({ zh: '投喂时间', en: 'Feeding time', ja: '餌やり' }),
          dueAt: new Date(now + oneDay),
        },
        {
          userId,
          type: 'water_change',
          titleI18n: JSON.stringify({ zh: '换水', en: 'Water change', ja: '水換え' }),
          dueAt: new Date(now + 7 * oneDay),
        },
        {
          userId,
          type: 'clean',
          titleI18n: JSON.stringify({ zh: '清理鱼便', en: 'Clean waste', ja: '掃除' }),
          dueAt: new Date(now + 3 * oneDay),
        },
      ];
      for (const it of items) {
        created.push(await this.create(it));
      }
    }
    return created;
  }
}
