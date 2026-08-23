/**
 * 文件名：common/i18n.spec.ts —— i18n helper 单元测试
 *
 * 覆盖率目标：≥95% 行（SPEC AC-1.1.3）
 *
 * 测试场景矩阵：
 *   - safeParse: 6 个场景（null / undefined / '' / 有效 JSON / 坏 JSON / 已是非字符串）
 *   - localeFallbackChain: 4 个场景（zh / en / ja / 不支持的 locale）
 *   - getLocalized: 8 个场景（已解析 string / object / DB JSON / mixed / missing locale / array / null）
 */

import { safeParse, getLocalized, localeFallbackChain } from './i18n';

describe('safeParse', () => {
  it('should return fallback for null', () => {
    expect(safeParse(null, [])).toEqual([]);
  });

  it('should return fallback for undefined', () => {
    expect(safeParse(undefined, { a: 1 })).toEqual({ a: 1 });
  });

  it('should return fallback for empty string', () => {
    expect(safeParse('', [])).toEqual([]);
  });

  it('should parse valid JSON object', () => {
    expect(safeParse<{ x: number }>('{"x":1}', { x: 0 })).toEqual({ x: 1 });
  });

  it('should parse valid JSON array', () => {
    expect(safeParse<string[]>('["a","b"]', [])).toEqual(['a', 'b']);
  });

  it('should return fallback and warn on malformed JSON', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(safeParse('{not json', [])).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should pass through non-string values (already-typed object/array)', () => {
    const arr = [1, 2, 3];
    expect(safeParse<number[]>(arr as any, [])).toBe(arr);  // same reference
  });
});

describe('localeFallbackChain', () => {
  it("should return ['zh','en','ja'] when locale='zh'", () => {
    expect(localeFallbackChain('zh')).toEqual(['zh', 'en', 'ja']);
  });

  it("should return ['en','zh','ja'] when locale='en'", () => {
    expect(localeFallbackChain('en')).toEqual(['en', 'zh', 'ja']);
  });

  it("should return ['ja','zh','en'] when locale='ja'", () => {
    expect(localeFallbackChain('ja')).toEqual(['ja', 'zh', 'en']);
  });

  it("should default to zh when locale is unsupported like 'fr'", () => {
    expect(localeFallbackChain('fr')).toEqual(['zh', 'en', 'ja']);
  });

  it('should default to zh when locale is undefined or empty', () => {
    expect(localeFallbackChain(undefined)).toEqual(['zh', 'en', 'ja']);
    expect(localeFallbackChain('')).toEqual(['zh', 'en', 'ja']);
    expect(localeFallbackChain(null)).toEqual(['zh', 'en', 'ja']);
  });

  it('should be case-insensitive', () => {
    expect(localeFallbackChain('ZH')).toEqual(['zh', 'en', 'ja']);
  });
});

describe('getLocalized', () => {
  it('should return plain string as-is', () => {
    expect(getLocalized('Hello', 'zh')).toBe('Hello');
  });

  it('should return value at requested locale from object', () => {
    expect(getLocalized({ zh: '金鱼', en: 'Goldfish' }, 'zh')).toBe('金鱼');
    expect(getLocalized({ zh: '金鱼', en: 'Goldfish' }, 'en')).toBe('Goldfish');
  });

  it('should fallback through chain when requested locale is missing', () => {
    // en missing → fall to zh
    expect(getLocalized({ zh: '金鱼', ja: '金魚' }, 'en')).toBe('金鱼');
  });

  it('should return first available string when all project locales missing', () => {
    // 没有任何 zh/en/ja key，但有 'fr' — 仍返回第一个非空 string
    expect(getLocalized({ fr: 'Poisson', de: 'Fisch' }, 'zh')).toBe('Poisson');
  });

  it('should return undefined when no string value available', () => {
    expect(getLocalized({}, 'zh')).toBeUndefined();
    expect(getLocalized({ zh: '' }, 'zh')).toBeUndefined();  // empty string skipped
    expect(getLocalized({ zh: 123 }, 'zh')).toBeUndefined();  // non-string skipped
  });

  it('should return undefined for null/undefined input', () => {
    expect(getLocalized(null, 'zh')).toBeUndefined();
    expect(getLocalized(undefined, 'zh')).toBeUndefined();
  });

  it('should parse JSON string from DB column', () => {
    // DB 列存的是 JSON.stringify({zh:'金鱼',en:'Goldfish'})
    const dbValue = JSON.stringify({ zh: '金鱼', en: 'Goldfish' });
    expect(getLocalized(dbValue, 'zh')).toBe('金鱼');
    expect(getLocalized(dbValue, 'en')).toBe('Goldfish');
  });

  it('should return undefined for array input', () => {
    expect(getLocalized(['zh', 'en'], 'zh')).toBeUndefined();
  });
});
