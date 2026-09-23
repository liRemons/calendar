import type { ReactNode } from 'react';
import type { DailySchedule, TodoRange } from '../../types';

/** 日程图标项：key 为唯一标识，icon 为渲染节点，tip 为提示文案 */
export interface IconItem {
  /** 图标标识（唯一 key，存储到日程 icon 字段） */
  key: string;
  /** 图标节点（ReactNode：emoji 字符串 / React 元素 / DOM） */
  icon: ReactNode;
  /** 图标名称/提示（hover tooltip、图标选择器展示） */
  tip: string;
}

export interface CalendarProps {
  /** 初始的待办列表（仅初始化时生效，后续由组件内部状态维护） */
  todos?: TodoRange[];
  /** 初始的日程列表（仅初始化时生效，后续由组件内部状态维护） */
  schedules?: DailySchedule[];
  /** 数据变更回调：每次内部 todos/schedules 修改后调用，参数为最新值 */
  onChange?: (todos: TodoRange[], schedules: DailySchedule[]) => void;
  /** 兼容：保存（新增或编辑）待办 */
  onSaveTodo?: (t: TodoRange) => void;
  /** 兼容：删除待办 */
  onDeleteTodo?: (id: string) => void;
  /** 兼容：保存（新增或编辑）日程 */
  onSaveSchedule?: (s: DailySchedule) => void;
  /** 兼容：删除日程 */
  onDeleteSchedule?: (id: string) => void;
  /** 是否预览模式（禁用新增/编辑操作） */
  isPreview?: boolean;
  /** 日程可用图标列表 */
  icons?: IconItem[];
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
