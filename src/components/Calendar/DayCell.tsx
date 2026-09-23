import { Tooltip } from 'antd';
import { Solar } from 'lunar-javascript';
import type { ReactNode } from 'react';
import type { DailySchedule } from '../../types';
import type { HolidayDisplay } from '../../utils/holidayDisplay';
import { formatTimeRange } from '../../utils/date';
import './styles/day-cell.less';

export interface DayCellProps {
  dateStr: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  holiday?: HolidayDisplay;
  /** 该日被待办横条占用的层数（用于格内预留高度） */
  todoLanes: number;
  schedules: DailySchedule[];
  onEditSchedule: (s: DailySchedule, date: string) => void;
  /** 是否被选中（下方展示当日详情） */
  selected?: boolean;
  /** 点击选中该日 */
  onSelect?: (dateStr: string) => void;
  /** 图标映射：key 为图标标识，value 为图片 DOM */
  icons?: Record<string, ReactNode>;
}

const MAX_SCHEDULES = 2;

/** 农历展示：节日 > 节气 > 当月月份名（初一）> 农历日 */
export function getLunarText(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const lunar = Solar.fromYmd(y, m, d).getLunar();
    const festivals = lunar.getFestivals();
    if (festivals.length > 0) return festivals[0];
    const jieqi = lunar.getJieQi();
    if (jieqi) return jieqi;
    return lunar.getDay() === 1 ? `${lunar.getMonthInChinese()}月初一` : lunar.getDayInChinese();
  } catch {
    return '';
  }
}

export function DayCell(props: DayCellProps) {
  const { dateStr, day, inMonth, isToday, isWeekend, holiday, todoLanes, schedules, onEditSchedule, selected, onSelect, icons } = props;

  const classList = ['day-cell'];
  if (!inMonth) classList.push('out');
  if (isToday) classList.push('today');
  if (isWeekend) classList.push('weekend');
  if (selected) classList.push('selected');

  if (holiday) {
    classList.push(holiday?.off ? 'holiday-off' : 'holiday-work')
  }

  const visible = schedules.slice(0, MAX_SCHEDULES);
  const rest = schedules.length - visible.length;

  return (
    <div
      className={classList.join(' ')}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(dateStr);
      }}
    >
      <div className="day-top">
        <span className="day-num">{day}</span>
        <span className="day-lunar">
          {holiday?.name || getLunarText(dateStr)}
          {holiday && (
            <div className={`day-holiday ${holiday.off ? 'off' : 'work'}`}>
              {holiday.off ? '休' : '班'}
            </div>
          )}
        </span>
      </div>
      {todoLanes > 0 && <div className="todo-spacer" style={{ height: todoLanes * 22 }} />}

      <div className="schedule-list">
        {visible.map((s) => (
          <Tooltip key={s.id} title={[s.name, formatTimeRange(s)].filter(Boolean).join(' ')}>
            <span
              className="schedule-item"
              onClick={(e) => {
                e.stopPropagation();
                onEditSchedule(s, dateStr);
              }}
            >
              <span className="schedule-icon">{icons?.[s.icon]}</span>
              <span className="schedule-name">{s.name}</span>
            </span>
          </Tooltip>
        ))}
        {rest > 0 && <span className="schedule-more">+{rest} 更多</span>}
      </div>
    </div>
  );
}
