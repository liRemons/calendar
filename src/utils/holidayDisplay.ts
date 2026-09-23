import type { HolidayInfo } from '../types';

export interface HolidayDisplay {
  /** 节日名称（如"中秋节"）。仅假期首日有值，其余为空字符串 */
  name: string;
  /** true=休息，false=补班 */
  off: boolean;
}

/** YYYY-MM-DD 日期加减天数（本地时间，跨月/跨年安全） */
function addDays(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 根据整年节假日数据计算每天的展示数据：
 * - 补班日（holiday:false）→ { name: '', off: false }
 * - 假期首日（前一天不是休息日，或同 target 下日期最早）→ { name: 节日名, off: true }
 * - 假期其余天 → { name: '', off: true }
 *
 * 注意：2026 年实测接口无 target 字段，故首日用"前一天是否休息"判断，
 * target 仅作为辅助（前一天无数据时才用），不单独依赖。
 */
export function getHolidayDisplay(
  holidays: Record<string, HolidayInfo>
): Record<string, HolidayDisplay> {
  const dates = Object.keys(holidays).sort();
  const infoOf = (d: string) => holidays[d];

  const isHolidayStart = (d: string): boolean => {
    const prev = addDays(d, -1);
    const prevInfo = infoOf(prev);
    // 前一天有数据：不是休息日则不是首日；是休息日则视为连续假期（非首日）
    if (prevInfo) {
      return !prevInfo.holiday;
    }
    // 前一天无数据：target 为空/缺失（2026 年实测如此）时视为首日，
    // （普通工作日不进该接口数据，故首日才会断开相邻）；
    // target 存在时辅助判断——存在更早的同 target 休息日则不是首日
    const target = holidays[d].target ?? '';
    if (!target) return true;
    return !dates.some((p) => {
      if (p >= d) return false;
      const pi = infoOf(p);
      return !!pi && pi.holiday && (pi.target ?? '') === target;
    });
  };

  const result: Record<string, HolidayDisplay> = {};
  dates.forEach((d) => {
    const info = holidays[d];
    if (!info) return;

    if (!info.holiday) {
      result[d] = { name: '', off: false };
      return;
    }

    result[d] = {
      name: isHolidayStart(d) ? info.name : '',
      off: true,
    };
  });

  return result;
}
