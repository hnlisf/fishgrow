import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FishSpecies } from '@prisma/client';

@Injectable()
export class FishSpeciesService {
  constructor(private prisma: PrismaService) {}

  async findAll(lang = 'zh'): Promise<any[]> {
    const list = await this.prisma.fishSpecies.findMany({ where: { isDefault: true } });
    return list.map((s) => this.toI18n(s, lang));
  }

  async findOne(id: string, lang = 'zh'): Promise<any> {
    const s = await this.prisma.fishSpecies.findUnique({ where: { id } });
    if (!s) return null;
    return this.toI18n(s, lang);
  }

  async createCustom(data: {
    nameI18n: any;          // accepted as object from client
    descI18n?: any;
    tempMin: number;
    tempMax: number;
    phMin: number;
    phMax: number;
    growthDays: number;
    feedFreq: string;
    stages?: any;
    color?: string;
  }): Promise<FishSpecies> {
    // DB columns are String (we store JSON-encoded), so stringify if client sent objects
    const nameI18nStr =
      typeof data.nameI18n === 'string' ? data.nameI18n : JSON.stringify(data.nameI18n ?? {});
    const descI18nStr =
      typeof data.descI18n === 'string' ? data.descI18n : JSON.stringify(data.descI18n ?? {});
    const stagesStr =
      typeof data.stages === 'string' ? data.stages : JSON.stringify(data.stages ?? []);
    return this.prisma.fishSpecies.create({
      data: {
        nameI18n: nameI18nStr,
        descI18n: descI18nStr,
        tempMin: data.tempMin,
        tempMax: data.tempMax,
        phMin: data.phMin,
        phMax: data.phMax,
        growthDays: data.growthDays,
        feedFreq: data.feedFreq,
        stages: stagesStr,
        color: data.color || '#5BA9C7',
        isDefault: false,
      },
    });
  }

  toI18n(s: FishSpecies, lang: string) {
    let nameI18n: Record<string, string> = {};
    let descI18n: Record<string, string> = {};
    let stages: any[] = [];
    try { nameI18n = JSON.parse(s.nameI18n); } catch {}
    try { descI18n = JSON.parse(s.descI18n); } catch {}
    try { stages = JSON.parse(s.stages); } catch {}
    return {
      id: s.id,
      name: nameI18n[lang] || nameI18n['zh'] || s.nameI18n,
      description: descI18n[lang] || descI18n['zh'] || '',
      tempMin: s.tempMin,
      tempMax: s.tempMax,
      phMin: s.phMin,
      phMax: s.phMax,
      growthDays: s.growthDays,
      feedFreq: s.feedFreq,
      stages,
      color: s.color,
      isDefault: s.isDefault,
    };
  }
}
