import { useEffect, useMemo, useState } from 'react';
import { Empty } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { DailySchedule, HolidayInfo } from '../../types';
import { getHolidays } from '../../services/holiday';
import { fmt, getMonthGrid, startTimeOf } from '../../utils/date';
import { getHolidayDisplay } from '../../utils/holidayDisplay';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { DayCell } from './DayCell';
import { CalendarHeader } from './CalendarHeader';
import { TodoLanes } from './TodoLanes';
import { DayPanel } from './DayPanel';
import { computeVisibilityRange, getVisibleWeeks, layoutTodos } from './layout';
import type { CalendarProps, ViewMode } from './types';
import './styles/calendar.less';

export type { CalendarProps, TodoSeg, ViewMode, VisibilityRange } from './types';

const WEEK_HEADERS = ['日', '一', '二', '三', '四', '五', '六'];

export function Calendar({
  todos,
  schedules,
  onEditTodo,
  onEditSchedule,
  onAddTodo,
  onAddSchedule,
}: CalendarProps) {
  const [cursor, setCursor] = useState<Dayjs>(dayjs());
  const [holidays, setHolidays] = useState<Record<string, HolidayInfo>>({});
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('calendar_view_mode', 'items');
  /** 选中日期（YYYY-MM-DD），默认今天；null 表示未选中（不展示详情面板） */
  const [selectedDate, setSelectedDate] = useState<string | null>(fmt(dayjs()));

  const year = cursor.year();
  const month = cursor.month();

  // 切换展示的年份时重新加载节假日（服务内部按年永久缓存）
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHolidays(year)
      .then((data) => {
        if (!cancelled) setHolidays(data);
      })
      .catch(() => {
        if (!cancelled) setHolidays({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  // 计算每日节假日展示数据（"节日名/休/班"文案在 DayCell 渲染层推导）
  const holidayDisplay = useMemo(() => getHolidayDisplay(holidays), [holidays]);

  const schedulesByDate = useMemo(() => {
    const map: Record<string, DailySchedule[]> = {};
    schedules.forEach((s) => {
      (map[s.date] ??= []).push(s);
    });
    // 同一天内按开始时间升序（缺省时间为 00:00，排在最前）
    Object.values(map).forEach((list) =>
      list.sort((a, b) => startTimeOf(a).localeCompare(startTimeOf(b))),
    );
    return map;
  }, [schedules]);

  const weeks = useMemo(() => {
    const rows: (typeof grid)[] = [];
    for (let i = 0; i < grid.length; i += 7) rows.push(grid.slice(i, i + 7));
    return rows;
  }, [grid]);

  // ✅ 修复：按周独立分配泳道，确保每周 lane 从 0 开始
  const { todoSegs, todoLanesByDate } = useMemo(() => layoutTodos(todos, grid), [todos, grid]);

  const todayStr = fmt(dayjs());

  // 日期字符串 -> 月网格内索引（用于定位待办/日程所在周行）
  const dateIndexOf = useMemo(() => {
    const map: Record<string, number> = {};
    grid.forEach((g, i) => {
      map[fmt(g.date)] = i;
    });
    return map;
  }, [grid]);

  // 切换月份后，若选中日已不在展示的网格中，自动重置为今天在该月（否则该月 1 号）
  const monthFirst = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  useEffect(() => {
    if (!selectedDate || dateIndexOf[selectedDate] !== undefined) return;
    const t = todayStr;
    setSelectedDate(dateIndexOf[t] !== undefined && t.startsWith(monthFirst.slice(0, 8)) ? t : monthFirst);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const toggleSelect = (d: string) => {
    setSelectedDate((prev) => (prev === d ? null : d));
  };

  // "仅待办和日程"模式：计算有内容的周行范围（首~尾，中间周照常展示）
  const visibilityRange = useMemo(
    () => computeVisibilityRange(todos, schedules, dateIndexOf, year, month),
    [todos, schedules, year, month, dateIndexOf],
  );

  // "仅待办和日程"模式下实际渲染的周行（保留全量网格中的原始行号，用于待办横条定位）
  const visibleWeeks = useMemo(
    () => getVisibleWeeks(weeks, viewMode, visibilityRange),
    [weeks, viewMode, visibilityRange],
  );

  console.log(todos, 'todoLanesByDate', todoLanesByDate); // 用于调试

  return (
    <>
      <div className="calendar">
        <CalendarHeader
          year={year}
          month={month}
          viewMode={viewMode}
          loading={loading}
          onViewModeChange={setViewMode}
          onToday={() => setCursor(dayjs())}
          onPrevMonth={() => setCursor(cursor.subtract(1, 'month'))}
          onNextMonth={() => setCursor(cursor.add(1, 'month'))}
        />
        <div className="week-row">
          {WEEK_HEADERS.map((w) => (
            <div key={w} className="week-cell">
              {w}
            </div>
          ))}
        </div>
        <div className="day-grid">
          {visibleWeeks.length === 0 ? (
            <div className="calendar-empty">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="本月暂无待办和日程" />
            </div>
          ) : (
            visibleWeeks.map(({ week, rowIndex: weekRow }) => (
              <div key={weekRow} className="day-week">
                {week.map(({ date, inMonth }) => {
                  const dateStr = fmt(date);
                  const dow = date.day();
                  const isWeekend = dow === 0 || dow === 6;
                  return (
                    <DayCell
                      key={dateStr}
                      dateStr={dateStr}
                      day={date.date()}
                      inMonth={inMonth}
                      isToday={dateStr === todayStr}
                      isWeekend={isWeekend}
                      holiday={holidayDisplay[dateStr]}
                      todoLanes={todoLanesByDate[dateStr] ?? 0}
                      schedules={schedulesByDate[dateStr] ?? []}
                      onEditSchedule={onEditSchedule}
                      selected={selectedDate === dateStr}
                      onSelect={toggleSelect}
                    />
                  );
                })}
                <TodoLanes segs={todoSegs.filter((s) => s.weekRow === weekRow)} onEditTodo={onEditTodo} />
              </div>
            ))
          )}
        </div>
      </div>
      {selectedDate && (
        <DayPanel
          dateStr={selectedDate}
          holiday={holidayDisplay[selectedDate]}
          todos={todos.filter((t) => t.start <= selectedDate && selectedDate <= t.end)}
          schedules={schedulesByDate[selectedDate] ?? []}
          onEditTodo={onEditTodo}
          onEditSchedule={(s) => onEditSchedule(s, selectedDate)}
          onAddTodo={() => onAddTodo(selectedDate)}
          onAddSchedule={() => onAddSchedule(selectedDate)}
        />
      )}
    </>
  );
}
