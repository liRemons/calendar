/**
 * 包入口：对外导出日历组件、数据类型与工具 Hook
 * 弹窗等交互逻辑已内聚到 Calendar 组件内部，外部无需感知。
 * 消费方需同时引入样式：import 'remons-calendar/style.css';
 */
export { Calendar } from './components/Calendar';
export type { CalendarProps, IconItem } from './components/Calendar';