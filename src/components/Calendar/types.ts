import type { DailySchedule, TodoRange } from '../../types';

export interface CalendarProps {
  todos: TodoRange[];
  schedules: DailySchedule[];
  onEditTodo: (t: TodoRange) => void;
  onEditSchedule: (s: DailySchedule, date: string) => void;
  /** 从选中详情面板发起新增待办（默认范围为选中日） */
  onAddTodo: (date: string) => void;
  /** 从选中详情面板发起新增日程（默认为选中日） */
  onAddSchedule: (date: string) => void;
  /** 是否预览模式 */
  isPreview?: boolean;
}

/** 待办横条段（按周行分段渲染） */
export interface TodoSeg {
  todo: TodoRange;
  weekRow: number;
  startCol: number;
  endCol: number;
  /** 横条左缘（天为单位的周 0-7 刻度，含当天 startTime 比例偏移） */
  leftEdge: number;
  /** 横条右缘（天为单位的周 0-7 刻度，至当天 endTime 为止） */
  rightEdge: number;
  lane: number;
  /** 是否显示待办名称（仅包含范围起始日的段显示） */
  showLabel: boolean;
  /** 段左端是否为范围真实起始日（否则续接不圆角） */
  roundLeft: boolean;
  /** 段右端是否为范围真实结束日（否则续接不圆角） */
  roundRight: boolean;
}

/** 视图模式：items=仅待办和日程，all=全部日期 */
export type ViewMode = 'items' | 'all';

/** 有内容的周行范围（首~尾行号） */
export interface VisibilityRange {
  min: number;
  max: number;
}
