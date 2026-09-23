import type { HolidayInfo } from '../types';

const CACHE_PREFIX = 'holiday_cache_v2_';

const cacheKey = (year: number) => `${CACHE_PREFIX}${year}`;

interface RawHolidayItem {
  holiday?: boolean;
  name?: string;
  /** 所属假期名称，同一假期的各天相同，如"国庆" */
  target?: string;
  [key: string]: unknown;
}

/**
 * 获取指定年份的节假日数据（https://timor.tech/api/holiday/year/{year}）。
 * 按年永久缓存到 localStorage，命中缓存则不再请求。
 * 返回 { 'YYYY-MM-DD': HolidayInfo }
 */
export async function getHolidays(year: number): Promise<Record<string, HolidayInfo>> {
  const key = cacheKey(year);
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      return JSON.parse(cached) as Record<string, HolidayInfo>;
    } catch {
      localStorage.removeItem(key);
    }
  }
  // 清理 v1 旧缓存（旧结构缺 target 等字段，会导致展示错误）
  localStorage.removeItem(`holiday_cache_${year}`);

  const res = await fetch(`https://timor.tech/api/holiday/year/${year}`);
  if (!res.ok) {
    throw new Error(`节假日接口请求失败: ${res.status}`);
  }
  const json: { holiday?: Record<string, RawHolidayItem>; data?: Record<string, RawHolidayItem> } =
    await res.json();
  const raw = json?.holiday ?? json?.data ?? {};

  const result: Record<string, HolidayInfo> = {};
  Object.entries(raw).forEach(([mmdd, info]) => {
    if (!info || typeof info !== 'object') return;
    // 防止键未补零（如 "1-1"）
    const [rawMm, rawDd] = mmdd.split('-');
    const mm = rawMm?.padStart(2, '0');
    const dd = rawDd?.padStart(2, '0');
    if (!mm || !dd || mm.length !== 2 || dd.length !== 2) return;
    result[`${year}-${mm}-${dd}`] = {
      holiday: !!info.holiday,
      name: String(info.name ?? ''),
      target: info.target != null ? String(info.target) : undefined,
    };
  });

  // 按年永久缓存（空数据不写入缓存，并清理已存在的脏缓存，让下次重新请求）
  if (Object.keys(result).length > 0) {
    localStorage.setItem(key, JSON.stringify(result));
  } else {
    localStorage.removeItem(key);
  }
  return result;
}
