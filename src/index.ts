/**
 * 包入口：对外导出日历组件、两个弹窗组件、数据类型与工具 Hook
 * 消费方需同时引入样式：import 'remons-calendar/style.css';
 */
export { Calendar } from './components/Calendar';
export type { CalendarProps, TodoSeg, ViewMode, VisibilityRange } from './components/Calendar';

export { AddTodoModal } from './components/AddTodoModal';
export type { AddTodoModalProps } from './components/AddTodoModal';

export { AddScheduleModal } from './components/AddScheduleModal';
export type { AddScheduleModalProps } from './components/AddScheduleModal';

export type { TodoRange, DailySchedule, HolidayInfo } from './types';
export { useLocalStorage } from './hooks/useLocalStorage';