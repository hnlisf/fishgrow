import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FishTank } from '@prisma/client';
import { FishSpeciesService } from '../fish-species/fish-species.service';

export interface CreateFishTankDto {
  userId?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  temp?: number;
  ph?: number;
}

export interface UpdateFishTankDto {
  name?: string;
  size?: 'small' | 'medium' | 'large';
  temp?: number;
  cleanliness?: number;
  oxygen?: number;
  ph?: number;
}

@Injectable()
export class FishTanksService {
  constructor(
    private prisma: PrismaService,
    private speciesService: FishSpeciesService,
  ) {}

  async findAllByUser(userId: string, lang = 'zh'): Promise<any[]> {
    const tanks = await this.prisma.fishTank.findMany({
      where: { userId },
      include: { fish: { include: { species: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return tanks.map((t) => this.attachI18n(t, lang));
  }

  async findOne(id: string, lang = 'zh'): Promise<any> {
    const tank = await this.prisma.fishTank.findUnique({
      where: { id },
      include: { fish: { include: { species: true } } },
    });
    if (!tank) return null;
    return this.attachI18n(tank, lang);
  }

  private attachI18n(tank: any, lang: string) {
    if (tank.fish) {
      tank.fish = tank.fish.map((f: any) => {
        if (f.species) f.species = this.speciesService.toI18n(f.species, lang);
        return f;
      });
    }
    return tank;
  }

  async create(data: CreateFishTankDto): Promise<FishTank> {
    // MVP: auto-create user if no userId provided (no auth in MVP)
    const userId = data.userId
      ? await this.ensureUser(data.userId)
      : await this.createDemoUser();
    return this.prisma.fishTank.create({
      data: {
        userId,
        name: data.name ?? '我的鱼缸',
        size: data.size ?? 'medium',
        temp: data.temp ?? 24.0,
        ph: data.ph ?? 7.0,
      },
    });
  }

  private async ensureUser(userId: string): Promise<string> {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (existing) return existing.id;
    return (await this.prisma.user.create({ data: { id: userId } })).id;
  }

  private async createDemoUser(): Promise<string> {
    // MVP single-user mode: always reuse the most-recent user if any,
    // otherwise create a fresh one. This makes the app feel like a personal
    // local app without requiring login.
    const latest = await this.prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
    if (latest) return latest.id;
    return (await this.prisma.user.create({ data: {} })).id;
  }

  async update(id: string, data: UpdateFishTankDto): Promise<FishTank> {
    await this.ensureExists(id);
    return this.prisma.fishTank.update({ where: { id }, data });
  }

  async remove(id: string): Promise<FishTank> {
    await this.ensureExists(id);
    return this.prisma.fishTank.delete({ where: { id } });
  }

  /**
   * Tick the tank status:
   * - cleanliness decays each day
   * - oxygen decays each day
   * - ph drifts slightly
   * Returns the updated tank.
   */
  async tick(id: string, hoursDelta: number = 24): Promise<FishTank> {
    const tank = await this.findOne(id);
    if (!tank) throw new NotFoundException('Fish tank not found');
    const decay = (hoursDelta / 24) * 5; // 5% per day
    return this.prisma.fishTank.update({
      where: { id },
      data: {
        cleanliness: Math.max(0, tank.cleanliness - decay),
        oxygen: Math.max(0, tank.oxygen - decay * 0.8),
        ph: Math.max(5, Math.min(9, tank.ph + (Math.random() - 0.5) * 0.05)),
      },
    });
  }

  private async ensureExists(id: string) {
    const tank = await this.prisma.fishTank.findUnique({ where: { id } });
    if (!tank) throw new NotFoundException('Fish tank not found');
  }
}
