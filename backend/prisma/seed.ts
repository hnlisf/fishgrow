import { PrismaClient } from '@prisma/client';

const defaultPrisma = new PrismaClient();

export async function main(prismaArg?: PrismaClient) {
  const prisma = prismaArg ?? defaultPrisma;
  const species = [
    {
      nameI18n: JSON.stringify({ zh: '金鱼', en: 'Goldfish', ja: '金魚' }),
      descI18n: JSON.stringify({
        zh: '最受欢迎的观赏鱼之一，体态优美，颜色艳丽。',
        en: 'One of the most popular ornamental fish, graceful and colorful.',
        ja: '最も人気のある観賞魚の一つで、優美で色彩豊かです。',
      }),
      tempMin: 18, tempMax: 26, phMin: 6.5, phMax: 8.0,
      growthDays: 90, feedFreq: 'twice_daily',
      stages: JSON.stringify([
        { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 7 },
        { name: 'juvenile', label: { zh: '幼鱼', en: 'Juvenile', ja: '幼魚' }, days: 30 },
        { name: 'subadult', label: { zh: '亚成鱼', en: 'Subadult', ja: '亜成魚' }, days: 60 },
        { name: 'adult', label: { zh: '成鱼', en: 'Adult', ja: '成魚' }, days: 90 },
      ]),
      color: '#FFD700', isDefault: true,
    },
    {
      nameI18n: JSON.stringify({ zh: '锦鲤', en: 'Koi', ja: '錦鯉' }),
      descI18n: JSON.stringify({
        zh: '寓意吉祥的观赏鱼，色彩斑斓，寿命长。',
        en: 'Auspicious ornamental fish with vibrant colors and long lifespan.',
        ja: '縁起の良い観賞魚で、色鮮やかで寿命が長いです。',
      }),
      tempMin: 15, tempMax: 25, phMin: 7.0, phMax: 8.5,
      growthDays: 180, feedFreq: 'twice_daily',
      stages: JSON.stringify([
        { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 14 },
        { name: 'juvenile', label: { zh: '幼鱼', en: 'Juvenile', ja: '幼魚' }, days: 60 },
        { name: 'subadult', label: { zh: '亚成鱼', en: 'Subadult', ja: '亜成魚' }, days: 120 },
        { name: 'adult', label: { zh: '成鱼', en: 'Adult', ja: '成魚' }, days: 180 },
      ]),
      color: '#FF6347', isDefault: true,
    },
    {
      nameI18n: JSON.stringify({ zh: '孔雀鱼', en: 'Guppy', ja: 'グッピー' }),
      descI18n: JSON.stringify({
        zh: '小型热带鱼，繁殖力强，尾鳍如孔雀开屏。',
        en: 'Small tropical fish with strong breeding ability and peacock-like tail.',
        ja: '繁殖力が強く、孔雀のような尾びれを持つ小型熱帯魚です。',
      }),
      tempMin: 22, tempMax: 28, phMin: 6.8, phMax: 7.8,
      growthDays: 60, feedFreq: 'twice_daily',
      stages: JSON.stringify([
        { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 5 },
        { name: 'juvenile', label: { zh: '幼鱼', en: 'Juvenile', ja: '幼魚' }, days: 21 },
        { name: 'subadult', label: { zh: '亚成鱼', en: 'Subadult', ja: '亜成魚' }, days: 40 },
        { name: 'adult', label: { zh: '成鱼', en: 'Adult', ja: '成魚' }, days: 60 },
      ]),
      color: '#00CED1', isDefault: true,
    },
    {
      nameI18n: JSON.stringify({ zh: '热带鱼', en: 'Tetra', ja: 'テトラ' }),
      descI18n: JSON.stringify({
        zh: '群游性小型鱼，色彩丰富，适合草缸。',
        en: 'Schooling small fish, colorful and suitable for planted tanks.',
        ja: '群泳性の小型魚で、色彩豊かで水草水槽に適しています。',
      }),
      tempMin: 23, tempMax: 27, phMin: 6.0, phMax: 7.5,
      growthDays: 75, feedFreq: 'twice_daily',
      stages: JSON.stringify([
        { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 7 },
        { name: 'juvenile', label: { zh: '幼鱼', en: 'Juvenile', ja: '幼魚' }, days: 28 },
        { name: 'subadult', label: { zh: '亚成鱼', en: 'Subadult', ja: '亜成魚' }, days: 50 },
        { name: 'adult', label: { zh: '成鱼', en: 'Adult', ja: '成魚' }, days: 75 },
      ]),
      color: '#4169E1', isDefault: true,
    },
    {
      nameI18n: JSON.stringify({ zh: '神仙鱼', en: 'Angelfish', ja: 'エンゼルフィッシュ' }),
      descI18n: JSON.stringify({
        zh: '体态优雅如天使，三角形身体，性格温和。',
        en: 'Elegant angel-like body, triangular shape, gentle temperament.',
        ja: '天使のように優美で、三角形の体に穏やかな性格です。',
      }),
      tempMin: 24, tempMax: 28, phMin: 6.5, phMax: 7.5,
      growthDays: 120, feedFreq: 'twice_daily',
      stages: JSON.stringify([
        { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 10 },
        { name: 'juvenile', label: { zh: '幼鱼', en: 'Juvenile', ja: '幼魚' }, days: 45 },
        { name: 'subadult', label: { zh: '亚成鱼', en: 'Subadult', ja: '亜成魚' }, days: 80 },
        { name: 'adult', label: { zh: '成鱼', en: 'Adult', ja: '成魚' }, days: 120 },
      ]),
      color: '#DAA520', isDefault: true,
    },
    {
      nameI18n: JSON.stringify({ zh: '灯科鱼', en: 'Rasbora', ja: 'ラスボラ' }),
      descI18n: JSON.stringify({
        zh: '体型小巧，喜欢群游，灯光下闪烁如星。',
        en: 'Tiny schooling fish that sparkle like stars under light.',
        ja: '小さく群泳を好み、光の下で星のように輝きます。',
      }),
      tempMin: 22, tempMax: 26, phMin: 6.0, phMax: 7.5,
      growthDays: 70, feedFreq: 'twice_daily',
      stages: JSON.stringify([
        { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 6 },
        { name: 'juvenile', label: { zh: '幼鱼', en: 'Juvenile', ja: '幼魚' }, days: 25 },
        { name: 'subadult', label: { zh: '亚成鱼', en: 'Subadult', ja: '亜成魚' }, days: 45 },
        { name: 'adult', label: { zh: '成鱼', en: 'Adult', ja: '成魚' }, days: 70 },
      ]),
      color: '#FF8C00', isDefault: true,
    },
    {
      nameI18n: JSON.stringify({ zh: '斗鱼', en: 'Betta', ja: 'ベタ' }),
      descI18n: JSON.stringify({
        zh: '尾鳍华丽如扇，性格好斗，适合单养。',
        en: 'Gorgeous fan-like tail, aggressive temperament, best kept alone.',
        ja: '扇のような華麗な尾びれを持ち、単独飼育に適しています。',
      }),
      tempMin: 24, tempMax: 30, phMin: 6.5, phMax: 7.5,
      growthDays: 100, feedFreq: 'daily',
      stages: JSON.stringify([
        { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 8 },
        { name: 'juvenile', label: { zh: '幼鱼', en: 'Juvenile', ja: '幼魚' }, days: 35 },
        { name: 'subadult', label: { zh: '亚成鱼', en: 'Subadult', ja: '亜成魚' }, days: 65 },
        { name: 'adult', label: { zh: '成鱼', en: 'Adult', ja: '成魚' }, days: 100 },
      ]),
      color: '#DC143C', isDefault: true,
    },
    {
      nameI18n: JSON.stringify({ zh: '鼠鱼', en: 'Corydoras', ja: 'コリドラス' }),
      descI18n: JSON.stringify({
        zh: '底栖小型鱼，性格温和，喜欢群居。',
        en: 'Bottom-dwelling small fish, gentle and social.',
        ja: '底生の小型魚で、穏やかで群れるのを好みます。',
      }),
      tempMin: 20, tempMax: 26, phMin: 6.0, phMax: 7.5,
      growthDays: 80, feedFreq: 'daily',
      stages: JSON.stringify([
        { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 7 },
        { name: 'juvenile', label: { zh: '幼鱼', en: 'Juvenile', ja: '幼魚' }, days: 30 },
        { name: 'subadult', label: { zh: '亚成鱼', en: 'Subadult', ja: '亜成魚' }, days: 55 },
        { name: 'adult', label: { zh: '成鱼', en: 'Adult', ja: '成魚' }, days: 80 },
      ]),
      color: '#8B4513', isDefault: true,
    },
    {
      nameI18n: JSON.stringify({ zh: '异形', en: 'Pleco', ja: 'プレコ' }),
      descI18n: JSON.stringify({
        zh: '吸盘嘴部，善于清洁缸壁藻类。',
        en: 'Sucker mouth, excellent at cleaning algae from tank walls.',
        ja: '吸盤状の口で、水槽の藻を掃除するのが得意です。',
      }),
      tempMin: 22, tempMax: 28, phMin: 6.5, phMax: 7.8,
      growthDays: 150, feedFreq: 'daily',
      stages: JSON.stringify([
        { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 12 },
        { name: 'juvenile', label: { zh: '幼鱼', en: 'Juvenile', ja: '幼魚' }, days: 50 },
        { name: 'subadult', label: { zh: '亚成鱼', en: 'Subadult', ja: '亜成魚' }, days: 100 },
        { name: 'adult', label: { zh: '成鱼', en: 'Adult', ja: '成魚' }, days: 150 },
      ]),
      color: '#2F4F4F', isDefault: true,
    },
    {
      nameI18n: JSON.stringify({ zh: '清道夫', en: 'Cleaner Fish', ja: 'クリーナーフィッシュ' }),
      descI18n: JSON.stringify({
        zh: '勤劳的清洁工，帮助维持鱼缸清洁。',
        en: 'Hardworking cleaner, helps maintain tank cleanliness.',
        ja: '勤勉な清掃員で、水槽の清潔を保つのを手伝います。',
      }),
      tempMin: 20, tempMax: 28, phMin: 6.5, phMax: 8.0,
      growthDays: 110, feedFreq: 'daily',
      stages: JSON.stringify([
        { name: 'fry', label: { zh: '鱼苗', en: 'Fry', ja: '稚魚' }, days: 9 },
        { name: 'juvenile', label: { zh: '幼鱼', en: 'Juvenile', ja: '幼魚' }, days: 40 },
        { name: 'subadult', label: { zh: '亚成鱼', en: 'Subadult', ja: '亜成魚' }, days: 75 },
        { name: 'adult', label: { zh: '成鱼', en: 'Adult', ja: '成魚' }, days: 110 },
      ]),
      color: '#556B2F', isDefault: true,
    },
  ];

  // 清掉旧的默认鱼种和所有演示鱼（多次运行 seed 保持幂等）
  // 1) 清掉所有 fish（因为 FK 指向 species，清不掉 species 会失败）
  // 2) 清掉所有默认鱼种
  // 3) 重新插入 10 种默认鱼种
  // 用户自定义的 fish/species 因为不是 isDefault=true 不受影响（其实 fish 都是 demo 的，全清即可）
  await prisma.feedRecord.deleteMany({}); // 先清 feedRecord（它引用 fish）
  await prisma.fish.deleteMany({});
  await prisma.fishSpecies.deleteMany({ where: { isDefault: true } });
  await prisma.fishSpecies.createMany({ data: species });

  // 创建默认用户和鱼缸
  // 使用固定 id 'demo-user' 以便前端无需登录即可直接绑定
  const user = await prisma.user.upsert({
    where: { id: 'demo-user' },
    update: { name: '鱼友', locale: 'zh' },
    create: {
      id: 'demo-user',
      name: '鱼友',
      locale: 'zh',
      tanks: {
        create: {
          name: '我的鱼缸',
          size: 'medium',
          temp: 24,
          cleanliness: 100,
          oxygen: 100,
          ph: 7.0,
        },
      },
    },
    include: { tanks: true },
  });

  // 给默认鱼缸加一条金鱼
  const goldfish = await prisma.fishSpecies.findFirst({ where: { color: '#FFD700' } });
  if (goldfish && user.tanks[0]) {
    await prisma.fish.create({
      data: {
        tankId: user.tanks[0].id,
        speciesId: goldfish.id,
        name: '小金',
        stage: 'juvenile',
        growth: 25,
        health: 95,
        nutrition: 80,
      },
    });
  }

  console.log('Seed completed. Default user + tank + goldfish created.');
}

// Only auto-run when this file is the entry point (node dist/prisma/seed.js),
// not when it's imported by a test or other module. This prevents the IIFE
// from re-seeding the dev database every time seed.ts is imported.
const isMainModule = (() => {
  try {
    return require.main === module;
  } catch {
    return false;
  }
})();

if (isMainModule) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await defaultPrisma.$disconnect();
    });
}
