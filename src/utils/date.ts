import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

/** 格式化 YYYY-MM-DD */
export const fmt = (d: Dayjs) => d.format('YYYY-MM-DD');

/** 取开始时间，缺省视为 00:00（整天起点） */
export const startTimeOf = (item: { startTime?: string }): string => item.startTime ?? '00:00';

/** 取结束时间，缺省视为 24:00（整天终点） */
export const endTimeOf = (item: { endTime?: string }): string => item.endTime ?? '24:00';

/** 时间展示：如 "09:00-18:00"、"09:00"；未设置任何时间返回空串（表示整天） */
export function formatTimeRange(item: { startTime?: string; endTime?: string }): string {
  if (item.startTime && item.endTime) return `${item.startTime}-${item.endTime}`;
  return item.startTime ?? item.endTime ?? '';
}

export interface DayItem {
  date: Dayjs;
  /** 是否属于当前展示的月份 */
  inMonth: boolean;
}

/** 生成 6x7（42 格）月视图网格，周日为一行开始 */
export function getMonthGrid(year: number, month: number): DayItem[] {
  const first = dayjs(`${year}-${month + 1}-01`);
  const start = first.startOf('week'); // 周日
  return Array.from({ length: 42 }, (_, i) => {
    const date = start.add(i, 'day');
    return { date, inMonth: date.month() === month };
  });
}
