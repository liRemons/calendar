import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { DailySchedule, TodoRange } from '../../types';
import { fmt } from '../../utils/date';
import type { DayItem } from '../../utils/date';
import type { TodoSeg, VisibilityRange, ViewMode } from './types';

/** 月网格中的一行（7 天） */
export type WeekRow = DayItem[];

/** 实际渲染的周行（保留全量网格中的原始行号，用于待办横条定位） */
export interface VisibleWeek {
  week: WeekRow;
  rowIndex: number;
}

/** 'HH:mm' 转分钟（0-1440） */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** 待办在某一天的时间范围（分钟 0-1440，未设置时间视为整天）；跨天待办首日自 startTime 起、末日止于 endTime、中间整天 */
function todoRangeOnDate(t: TodoRange, date: Dayjs): [number, number] {
  const s = t.startTime ? toMinutes(t.startTime) : 0;
  const e = t.endTime ? toMinutes(t.endTime) : 1440;
  const d = fmt(date);
  if (t.start === t.end) return [s, e];
  if (d === t.start) return [s, 1440];
  if (d === t.end) return [0, e];
  return [0, 1440];
}

/** 待办横条布局：按周行分段 + 每周独立分配泳道（感知时间：仅时间区间冲突才视为冲突） */
export function layoutTodos(
  rawTodos: TodoRange[],
  grid: DayItem[],
): { todoSegs: TodoSeg[]; todoLanesByDate: Record<string, number> } {
  const dateIdx: Record<string, number> = {};
  grid.forEach((g, i) => {
    dateIdx[fmt(g.date)] = i;
  });
  const visStart = fmt(grid[0].date);
  const visEnd = fmt(grid[grid.length - 1].date);

  // 防御：todos 来自 localStorage，可能为 null/对象等非数组，展开失败会抛 "TypeError: n is not iterable"
  const todos: TodoRange[] = Array.isArray(rawTodos) ? rawTodos : [];
  // 全局泳道占用（用于撑开 DayCell 高度）
  const globalLanesAt = new Array<number>(grid.length).fill(0);
  const segs: TodoSeg[] = [];

  // 按开始日期、开始时间（缺省 00:00）、结束日期、结束时间排序，泳道装箱更稳定
  const sorted = [...todos].sort((a, b) => {
    if (a.start !== b.start) return a.start.localeCompare(b.start);
    const ta = a.startTime ?? '00:00';
    const tb = b.startTime ?? '00:00';
    if (ta !== tb) return ta.localeCompare(tb);
    if (a.end !== b.end) return a.end.localeCompare(b.end);
    return (a.endTime ?? '23:59').localeCompare(b.endTime ?? '23:59');
  });

  // 1. 筛选可见范围内的待办并裁剪起止时间
  const visibleTodos = sorted
    .filter((t) => !(t.end < visStart || t.start > visEnd))
    .map((t) => ({
      original: t,
      cs: t.start < visStart ? visStart : t.start,
      ce: t.end > visEnd ? visEnd : t.end,
    }))
    .filter((t) => {
      const i0 = dateIdx[t.cs];
      const i1 = dateIdx[t.ce];
      return i0 !== undefined && i1 !== undefined;
    });

  // 2. 按周行分组处理，每周独立分配泳道
  const totalWeeks = Math.ceil(grid.length / 7);
  for (let weekRow = 0; weekRow < totalWeeks; weekRow++) {
    const weekStartIdx = weekRow * 7;
    const weekEndIdx = Math.min(weekStartIdx + 6, grid.length - 1);

    // 本周内每列各泳道（0-2）占用的时间区间：busy[col][lane] = [{s, e}]（分钟 0-1440）
    const busy: { s: number; e: number }[][][] = Array.from({ length: 7 }, () => [[], [], []]);

    // 找出与本周有交集的待办
    const weekTodos = visibleTodos.filter((t) => {
      const i0 = dateIdx[t.cs];
      const i1 = dateIdx[t.ce];
      return i1 >= weekStartIdx && i0 <= weekEndIdx;
    });

    for (const { original: t, cs, ce } of weekTodos) {
      const i0 = dateIdx[cs];
      const i1 = dateIdx[ce];

      // 裁剪到本周范围内的列索引 (0-6)
      const colStart = Math.max(i0, weekStartIdx) - weekStartIdx;
      const colEnd = Math.min(i1, weekEndIdx) - weekStartIdx;

      // 该待办在每个覆盖列上的时间范围（分钟 0-1440）
      const ranges: [number, number][] = [];
      for (let c = colStart; c <= colEnd; c++) {
        ranges.push(todoRangeOnDate(t, grid[weekStartIdx + c].date));
      }

      // 从泳道 0 起寻找第一个在覆盖列上均无时间冲突的泳道
      let lane = -1;
      for (let l = 0; l < 3; l++) {
        let ok = true;
        for (let c = colStart; c <= colEnd && ok; c++) {
          const [s, e] = ranges[c - colStart];
          if (s >= e) continue; // 零长度（如末日 endTime=00:00）视为不占用当日
          ok = !busy[c][l].some((b) => b.s < e && s < b.e);
        }
        if (ok) {
          lane = l;
          break; // 取第一个无冲突的泳道即停，避免被更高泳道覆盖
        }
      }
      if (lane === -1) continue; // 单周显示层数上限

      // 判断是否为本段真实起点/终点（用于圆角和标签）
      const isRealStart = i0 >= weekStartIdx && cs === t.start;
      const isRealEnd = i1 <= weekEndIdx && ce === t.end;

      // 时间感知的横条边缘（天为单位）：真实起始日左缘自 startTime 起、真实结束日右缘止于 endTime；
      // 未设时间时 s0=0 / e1=1440，退化为整天宽度；末日 endTime=00:00（e1=0）表示不占末日
      const [s0] = ranges[0];
      const [, e1] = ranges[ranges.length - 1];
      const leftEdge = colStart + (isRealStart ? s0 / 1440 : 0);
      const rightEdge = isRealEnd ? colEnd + e1 / 1440 : colEnd + 1;

      segs.push({
        todo: t,
        weekRow,
        startCol: colStart,
        endCol: colEnd,
        leftEdge,
        rightEdge,
        lane, // ✅ 相对于本周的泳道号，每周从0开始
        showLabel: isRealStart,
        roundLeft: isRealStart,
        roundRight: isRealEnd,
      });

      // 记录本周泳道占用
      for (let c = colStart; c <= colEnd; c++) {
        const [s, e] = ranges[c - colStart];
        if (s < e) busy[c][lane].push({ s, e });
      }

      // 同步到全局 lanesAt（用于 DayCell 高度撑开），零长度当日不占用
      for (let c = colStart; c <= colEnd; c++) {
        const [s, e] = ranges[c - colStart];
        if (s < e) {
          const globalIdx = weekStartIdx + c;
          if (globalLanesAt[globalIdx] < lane + 1) {
            globalLanesAt[globalIdx] = lane + 1;
          }
        }
      }
    }
  }

  const lanesByDate: Record<string, number> = {};
  grid.forEach((g, i) => {
    if (globalLanesAt[i] > 0) lanesByDate[fmt(g.date)] = globalLanesAt[i];
  });

  return { todoSegs: segs, todoLanesByDate: lanesByDate };
}

/** "仅待办和日程"模式：计算月网格（含上月/下月临近日期）范围内有内容的周行范围（首~尾，中间周照常展示），无内容返回 null */
export function computeVisibilityRange(
  rawTodos: TodoRange[],
  rawSchedules: DailySchedule[],
  dateIndexOf: Record<string, number>,
): VisibilityRange | null {
  // 防御：todos/schedules 来自 localStorage，可能为 null/对象等非数组，直接 forEach 会报 "read only" / "not iterable"
  const todos: TodoRange[] = Array.isArray(rawTodos) ? rawTodos : [];
  const schedules: DailySchedule[] = Array.isArray(rawSchedules) ? rawSchedules : [];

  // 以月网格实际范围（42 天，含上月/下月临近日期）为口径，与 layoutTodos / DayCell 的渲染范围保持一致
  const dates = Object.keys(dateIndexOf).sort();
  const visStart = dates[0];
  const visEnd = dates[dates.length - 1];
  if (!visStart || !visEnd) return null;
  const rows = new Set<number>();
  todos.forEach((t) => {
    const lo = t.start < visStart ? visStart : t.start;
    const hi = t.end > visEnd ? visEnd : t.end;
    if (hi < lo) return;
    let d = dayjs(lo);
    while (fmt(d) <= hi) {
      const i = dateIndexOf[fmt(d)];
      if (i !== undefined) rows.add(Math.floor(i / 7));
      d = d.add(1, 'day');
    }
  });
  schedules.forEach((s) => {
    if (s.date >= visStart && s.date <= visEnd) {
      const i = dateIndexOf[s.date];
      if (i !== undefined) rows.add(Math.floor(i / 7));
    }
  });
  if (rows.size === 0) return null;
  return { min: Math.min(...rows), max: Math.max(...rows) };
}

/** 实际渲染的周行：'all' 模式返回全部，'items' 模式按可见范围裁剪 */
export function getVisibleWeeks(
  weeks: WeekRow[],
  viewMode: ViewMode,
  visibilityRange: VisibilityRange | null,
): VisibleWeek[] {
  if (viewMode === 'all') {
    return weeks.map((week, rowIndex) => ({ week, rowIndex }));
  }
  if (!visibilityRange) return [];
  const out: VisibleWeek[] = [];
  for (let i = visibilityRange.min; i <= visibilityRange.max; i++) {
    out.push({ week: weeks[i], rowIndex: i });
  }
  return out;
}
