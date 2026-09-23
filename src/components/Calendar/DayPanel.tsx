import { Button, Empty } from 'antd';
import dayjs from 'dayjs';
import type { DailySchedule, TodoRange } from '../../types';
import type { HolidayDisplay } from '../../utils/holidayDisplay';
import { getLunarText } from './DayCell';
import { formatTimeRange } from '../../utils/date';
import './styles/day-panel.less';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 短日期格式：与选中日同年显示"M月D日"，否则显示"Y年M月D日" */
function shortDate(dateStr: string, refYear: number): string {
  const d = dayjs(dateStr);
  return d.year() === refYear
    ? `${d.month() + 1}月${d.date()}日`
    : `${d.year()}年${d.month() + 1}月${d.date()}日`;
}

interface DayPanelProps {
  /** 选中日期 YYYY-MM-DD */
  dateStr: string;
  holiday?: HolidayDisplay;
  /** 覆盖选中日的待办列表 */
  todos: TodoRange[];
  /** 选中日的日程列表 */
  schedules: DailySchedule[];
  onEditTodo: (t: TodoRange) => void;
  onEditSchedule: (s: DailySchedule) => void;
  onAddTodo: () => void;
  onAddSchedule: () => void;
}

/** 日历下方的选中日详情面板（完整展示当日待办与日程） */
export function DayPanel({
  dateStr,
  holiday,
  todos,
  schedules,
  onEditTodo,
  onEditSchedule,
  onAddTodo,
  onAddSchedule,
}: DayPanelProps) {
  const d = dayjs(dateStr);
  const refYear = d.year();

  return (
    <div className="day-panel">
      <div className="day-panel-header">
        <div className="day-panel-title">
          {d.year()}年{d.month() + 1}月{d.date()}日 {WEEKDAYS[d.day()]}
          <div className="day-panel-actions">
            <Button size="small" onClick={onAddTodo}>
              添加待办
            </Button>
            <Button size="small" onClick={onAddSchedule}>
              添加日程
            </Button>
          </div>
        </div>

        <span className="day-panel-sub">
          {holiday?.name ? (
            holiday.name
          ) : (
            (getLunarText(dateStr) || '\u00A0')
          )}
          {holiday && (
            <span className={`day-panel-holiday ${holiday.off ? 'off' : 'work'}`}>
              {holiday.off ? '休' : '班'}
            </span>
          )}
        </span>
      </div>

      {
        !!todos.length && <div className="day-panel-section">
          <div className="day-panel-subtitle">待办（{todos.length}）</div>
          {(
            todos.map((t) => (
              <div
                key={t.id}
                className="day-panel-todo"
                onClick={() => onEditTodo(t)}
                title="点击编辑"
              >
                <span className="day-panel-todo-dot" style={{ background: t.color }} />
                <span className="day-panel-todo-name">{t.name}</span>
                <span className="day-panel-todo-range">
                  {shortDate(t.start, refYear)}
                  {t.startTime ? ` ${t.startTime}` : ''} ~ {shortDate(t.end, refYear)}
                  {t.endTime ? ` ${t.endTime}` : ''}
                </span>
              </div>
            ))
          )}
        </div>
      }

      {
        !!schedules.length && <div className="day-panel-section">
          <div className="day-panel-subtitle">日程（{schedules.length}）</div>
          {(
            schedules.map((s) => (
              <div
                key={s.id}
                className="day-panel-schedule"
                onClick={() => onEditSchedule(s)}
                title="点击编辑"
              >
                <span className="day-panel-schedule-icon">{s.icon}</span>
                <span className="day-panel-schedule-name">{s.name}</span>
                {formatTimeRange(s) && <span className="day-panel-schedule-time">{formatTimeRange(s)}</span>}
              </div>
            ))
          )}
        </div>
      }

      {
        schedules.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="本月暂无待办和日程" />
      }

    </div>
  );
}