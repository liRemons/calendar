import type { ReactNode } from 'react';
import type { DailySchedule, TodoRange } from '../../types';

export interface CalendarProps {
  /** 受控的待办列表数据源 */
  todos: TodoRange[];
  /** 受控的日程列表数据源 */
  schedules: DailySchedule[];
  /** 保存（新增或编辑）待办 */
  onSaveTodo?: (t: TodoRange) => void;
  /** 删除待办 */
  onDeleteTodo?: (id: string) => void;
  /** 保存（新增或编辑）日程 */
  onSaveSchedule?: (s: DailySchedule) => void;
  /** 删除日程 */
  onDeleteSchedule?: (id: string) => void;
  /** 是否预览模式（禁用新增/编辑操作） */
  isPreview?: boolean;
  /** 日程可用图标映射：key 为图标标识，value 为图片 DOM */
  icons?: Record<string, ReactNode>;
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
