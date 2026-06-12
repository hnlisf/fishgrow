import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from '../weather/weather.service';

export interface FeedingAdvice {
  speciesId: string;
  speciesName: string;
  tempSuitability: 'ideal' | 'ok' | 'poor';
  recommendation: string;
  actionItems: string[];
}

// Localized strings per lang. Action items are short directives.
const T = {
  zh: {
    farOutside: (cur: number, min: number, max: number) =>
      `当前气温 ${cur}°C 远超适宜范围 ${min}-${max}°C，请开启加热或降温设备。`,
    idealMid: (cur: number) => `当前 ${cur}°C 处于最佳区间，按正常频率投喂即可。`,
    idealOk: (cur: number) => `当前 ${cur}°C 在适宜范围内，按正常频率投喂。`,
    slightlyCold: (cur: number) => `当前 ${cur}°C 略低于适宜温度，建议减少投喂。`,
    slightlyHot: (cur: number) => `当前 ${cur}°C 略高于适宜温度，建议增加氧气。`,
    actions: {
      checkHeater: '检查加热棒',
      reduceFeeding: '减少投喂量（代谢降低）',
      feedNormal: '按鱼种频率正常投喂',
      keepWaterClean: '保持水质清洁',
      halfFeeding: '投喂量减半',
      watchHeater: '关注加热棒状态',
      turnOnAerator: '开启增氧泵',
      reduceAmount: '减少投喂量',
    },
  },
  en: {
    farOutside: (cur: number, min: number, max: number) =>
      `Current temperature ${cur}C is far outside the suitable range ${min}-${max}C. Please enable heating/cooling.`,
    idealMid: (cur: number) => `Current ${cur}C is in the optimal zone, normal feeding recommended.`,
    idealOk: (cur: number) => `Current ${cur}C is within the suitable range, normal feeding is fine.`,
    slightlyCold: (cur: number) => `Current ${cur}C is slightly below the suitable temperature; consider reducing feeding.`,
    slightlyHot: (cur: number) => `Current ${cur}C is slightly above the suitable temperature; add oxygen.`,
    actions: {
      checkHeater: 'Check tank heater',
      reduceFeeding: 'Reduce feeding (lower metabolism)',
      feedNormal: 'Feed at species frequency',
      keepWaterClean: 'Keep water clean',
      halfFeeding: 'Halve feeding amount',
      watchHeater: 'Watch the heater',
      turnOnAerator: 'Turn on aerator',
      reduceAmount: 'Reduce feeding amount',
    },
  },
  ja: {
    farOutside: (cur: number, min: number, max: number) =>
      `現在の気温 ${cur}°C は適性範囲 ${min}-${max}°C を大きく外れています。ヒーター・冷却を確認してください。`,
    idealMid: (cur: number) => `現在 ${cur}°C は最適範囲内です。通常通り餌を与えてください。`,
    idealOk: (cur: number) => `現在 ${cur}°C は適性範囲内です。通常通り餌を与えてください。`,
    slightlyCold: (cur: number) => `現在 ${cur}°C は適性温度をわずかに下回っています。餌やりを減らしてください。`,
    slightlyHot: (cur: number) => `現在 ${cur}°C は適性温度をわずかに上回っています。酸素を補給してください。`,
    actions: {
      checkHeater: 'ヒーターを確認',
      reduceFeeding: '餌やりを減らす（代謝低下）',
      feedNormal: '魚種の頻度に従って餌やり',
      keepWaterClean: '水質を清潔に保つ',
      halfFeeding: '餌の量を半分に',
      watchHeater: 'ヒーターの状態を確認',
      turnOnAerator: 'エアレーションON',
      reduceAmount: '餌の量を減らす',
    },
  },
} as const;

@Injectable()
export class FeedingAdviceService {
  constructor(
    private prisma: PrismaService,
    private weather: WeatherService,
  ) {}

  async getAdviceForUser(userId: string, lang = 'zh'): Promise<FeedingAdvice[]> {
    const fish = await this.prisma.fish.findMany({
      where: { tank: { userId } },
      include: { species: true, tank: true },
    });
    if (!fish.length) return [];

    // MVP: use Beijing default; later replace with stored user location
    const lat = 39.9042;
    const lon = 116.4074;
    const w = await this.weather.getWeather(lat, lon);

    return fish.map((f) => this.advise(f.species, w.temp, lang));
  }

  private advise(species: any, currentTemp: number, lang: string): FeedingAdvice {
    const L = (T as any)[lang] ?? T.zh;
    let name = species.nameI18n;
    try { name = JSON.parse(species.nameI18n)[lang] ?? JSON.parse(species.nameI18n).zh; } catch {}
    const { tempMin, tempMax } = species;
    const mid = (tempMin + tempMax) / 2;
    const tolerance = (tempMax - tempMin) / 2;

    let suitability: 'ideal' | 'ok' | 'poor' = 'ok';
    let rec = '';
    const actions: string[] = [];

    if (currentTemp < tempMin - 3 || currentTemp > tempMax + 3) {
      suitability = 'poor';
      rec = L.farOutside(currentTemp, tempMin, tempMax);
      actions.push(L.actions.checkHeater, L.actions.reduceFeeding);
    } else if (currentTemp >= tempMin && currentTemp <= tempMax) {
      suitability = 'ideal';
      if (Math.abs(currentTemp - mid) <= tolerance * 0.3) {
        rec = L.idealMid(currentTemp);
      } else {
        rec = L.idealOk(currentTemp);
      }
      actions.push(L.actions.feedNormal, L.actions.keepWaterClean);
    } else {
      if (currentTemp < tempMin) {
        rec = L.slightlyCold(currentTemp);
        actions.push(L.actions.halfFeeding, L.actions.watchHeater);
      } else {
        rec = L.slightlyHot(currentTemp);
        actions.push(L.actions.turnOnAerator, L.actions.reduceAmount);
      }
    }

    return {
      speciesId: species.id,
      speciesName: name,
      tempSuitability: suitability,
      recommendation: rec,
      actionItems: actions,
    };
  }
}
