import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Fish } from '@prisma/client';
import { FishSpeciesService } from '../fish-species/fish-species.service';

export interface CreateFishDto {
  tankId: string;
  speciesId: string;
  name?: string;
}

export interface UpdateFishDto {
  name?: string;
}

export type FeedAmount = 'small' | 'normal' | 'large';
const FEED_NUTRITION: Record<FeedAmount, number> = { small: 15, normal: 30, large: 50 };

@Injectable()
export class FishService {
  constructor(
    private prisma: PrismaService,
    private speciesService: FishSpeciesService,
  ) {}

  async findAllByTank(tankId: string, lang = 'zh') {
    const list = await this.prisma.fish.findMany({
      where: { tankId },
      include: { species: true, feedRecords: { orderBy: { fedAt: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'asc' },
    });
    return list.map((f) => this.attachI18nSpecies(f, lang));
  }

  async findOne(id: string, lang = 'zh') {
    const fish = await this.prisma.fish.findUnique({
      where: { id },
      include: { species: true, feedRecords: { orderBy: { fedAt: 'desc' }, take: 10 } },
    });
    if (!fish) return null;
    return this.attachI18nSpecies(fish, lang);
  }

  private attachI18nSpecies(fish: any, lang: string) {
    if (fish.species) {
      fish.species = this.speciesService.toI18n(fish.species, lang);
    }
    return fish;
  }

  async create(data: CreateFishDto): Promise<Fish> {
    // Validate tank and species exist
    const tank = await this.prisma.fishTank.findUnique({ where: { id: data.tankId } });
    if (!tank) throw new NotFoundException('Fish tank not found');
    const species = await this.prisma.fishSpecies.findUnique({ where: { id: data.speciesId } });
    if (!species) throw new NotFoundException('Fish species not found');

    return this.prisma.fish.create({
      data: {
        tankId: data.tankId,
        speciesId: data.speciesId,
        name: data.name ?? '',
        stage: 'fry',
        growth: 0,
        health: 100,
        nutrition: 100,
      },
    });
  }

  async update(id: string, data: UpdateFishDto) {
    await this.ensureExists(id);
    return this.prisma.fish.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.fish.delete({ where: { id } });
  }

  /**
   * Feed a fish: validate frequency, update nutrition, add feed record,
   * and advance growth/health based on the species' growth model.
   */
  async feed(fishId: string, amount: FeedAmount = 'normal') {
    const fish = await this.findOne(fishId);
    if (!fish) throw new NotFoundException('Fish not found');

    // Frequency check
    const minIntervalHours = this.feedIntervalHours(fish.species.feedFreq);
    if (fish.lastFedAt) {
      const hoursSinceLastFeed = (Date.now() - new Date(fish.lastFedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastFeed < minIntervalHours) {
        throw new BadRequestException(
          `Too soon to feed. Wait at least ${minIntervalHours}h (last fed ${hoursSinceLastFeed.toFixed(1)}h ago)`,
        );
      }
    }

    const nutritionGain = FEED_NUTRITION[amount];
    const newNutrition = Math.min(100, fish.nutrition + nutritionGain);
    const healthGain = fish.health < 70 ? 5 : 1;
    const newHealth = Math.min(100, fish.health + healthGain);

    // Growth model: 100 / growthDays per day
    const daysOld = Math.max(0, (Date.now() - new Date(fish.birthday).getTime()) / (1000 * 60 * 60 * 24));
    const naturalGrowth = (daysOld / fish.species.growthDays) * 100;
    const feedBonus = amount === 'large' ? 1 : amount === 'normal' ? 0.5 : 0.25;
    const newGrowth = Math.min(100, naturalGrowth + feedBonus);
    const newStage = this.computeStage(newGrowth, fish.species.stages);

    const [updated] = await this.prisma.$transaction([
      this.prisma.fish.update({
        where: { id: fishId },
        data: {
          nutrition: newNutrition,
          health: newHealth,
          growth: newGrowth,
          stage: newStage,
          lastFedAt: new Date(),
        },
      }),
      this.prisma.feedRecord.create({
        data: { fishId, amount },
      }),
    ]);

    return updated;
  }

  /**
   * Compute the current stage by growth percentage vs species stages.
   */
  computeStage(growth: number, stagesJson: string): string {
    let stages: any[] = [];
    try { stages = JSON.parse(stagesJson); } catch {}
    if (!stages.length) return 'fry';
    const days = (growth / 100) * (stages[stages.length - 1]?.days ?? 1);
    let current = stages[0].name;
    for (const s of stages) {
      if (days >= s.days) current = s.name;
    }
    return current;
  }

  feedIntervalHours(freq: string): number {
    if (freq === 'daily') return 12;
    if (freq === 'twice_daily') return 6;
    if (freq === 'every_2_days') return 36;
    return 8;
  }

  private async ensureExists(id: string) {
    const f = await this.prisma.fish.findUnique({ where: { id } });
    if (!f) throw new NotFoundException('Fish not found');
  }
}
