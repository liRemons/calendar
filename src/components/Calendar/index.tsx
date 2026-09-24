import { useEffect, useMemo, useState } from 'react';
import { Empty } from 'antd';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { DailySchedule, HolidayInfo, TodoRange } from '../../types';
import { getHolidays } from '../../services/holiday';
import { fmt, getMonthGrid, startTimeOf } from '../../utils/date';
import { getHolidayDisplay } from '../../utils/holidayDisplay';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AddTodoModal } from '../AddTodoModal';
import { AddScheduleModal } from '../AddScheduleModal';
import { DayCell } from './DayCell';
import { CalendarHeader } from './CalendarHeader';
import { TodoLanes } from './TodoLanes';
import { DayPanel } from './DayPanel';
import { computeVisibilityRange, getVisibleWeeks, layoutTodos } from './layout';
import type { CalendarProps, ViewMode } from './types';
import './styles/calendar.less';

export type { CalendarProps, IconItem, TodoSeg, ViewMode, VisibilityRange } from './types';

const WEEK_HEADERS = ['日', '一', '二', '三', '四', '五', '六'];

export function Calendar({
  todos: initialTodos,
  schedules: initialSchedules,
  onChange,
  onSaveTodo,
  onDeleteTodo,
  onSaveSchedule,
  onDeleteSchedule,
  isPreview,
  icons,
}: CalendarProps) {
  const [cursor, setCursor] = useState<Dayjs>(dayjs());
  const [holidays, setHolidays] = useState<Record<string, HolidayInfo>>({});
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(isPreview ? 'calendar_view_preview_mode' : 'calendar_view_mode', isPreview ? 'items' : 'all');
  /** 选中日期（YYYY-MM-DD），默认今天；null 表示未选中（不展示详情面板） */
  const [selectedDate, setSelectedDate] = useState<string | null>(fmt(dayjs()));

  /** 内部自维护的待办/日程（外部传入的 todos/schedules 仅作为初始化值） */
  const [todos, setTodos] = useState<TodoRange[]>(initialTodos ?? []);
  const [schedules, setSchedules] = useState<DailySchedule[]>(initialSchedules ?? []);

  const [todoModal, setTodoModal] = useState<{
    open: boolean;
    editing: TodoRange | null;
    initialStart?: string;
    initialEnd?: string;
  }>({ open: false, editing: null });
  const [scheduleModal, setScheduleModal] = useState<{
    open: boolean;
    editing: DailySchedule | null;
    initialDate?: string;
  }>({ open: false, editing: null });

  // 事件处理器：包裹 isPreview 拦截 + 打开内部 Modal
  const handleEditTodo = (t: TodoRange) => {
    if (isPreview) return;
    setTodoModal({ open: true, editing: t });
  };
  const handleEditSchedule = (s: DailySchedule, _date: string) => {
    if (isPreview) return;
    setScheduleModal({ open: true, editing: s });
  };
  const handleAddTodo = (date: string) => {
    if (isPreview) return;
    setTodoModal({ open: true, editing: null, initialStart: date, initialEnd: dayjs(date).add(1, 'day').format('YYYY-MM-DD') });
  };
  const handleAddSchedule = (date: string) => {
    if (isPreview) return;
    setScheduleModal({ open: true, editing: null, initialDate: date });
  };

  /** 统一的修改提交点：更新内部todos/schedules并通知外部 */
  const commit = (nextTodos: TodoRange[], nextSchedules: DailySchedule[]) => {
    setTodos(nextTodos);
    setSchedules(nextSchedules);
    onChange?.(nextTodos, nextSchedules);
  };

  /** 保存（新增或编辑）待办：按 id 是否存在决定 upsert */
  const commitSaveTodo = (t: TodoRange) => {
    const next = todos.some((x) => x.id === t.id)
      ? todos.map((x) => (x.id === t.id ? t : x))
      : [...todos, t];
    commit(next, schedules);
    onSaveTodo?.(t);
  };

  const commitDeleteTodo = (id: string) => {
    const next = todos.filter((x) => x.id !== id);
    commit(next, schedules);
    onDeleteTodo?.(id);
  };

  /** 保存（新增或编辑）日程：按 id 是否存在决定 upsert */
  const commitSaveSchedule = (s: DailySchedule) => {
    const next = schedules.some((x) => x.id === s.id)
      ? schedules.map((x) => (x.id === s.id ? s : x))
      : [...schedules, s];
    commit(todos, next);
    onSaveSchedule?.(s);
  };

  const commitDeleteSchedule = (id: string) => {
    const next = schedules.filter((x) => x.id !== id);
    commit(todos, next);
    onDeleteSchedule?.(id);
  };

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
    schedules?.forEach((s) => {
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
    setSelectedDate(d);
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

  return (
    <div className="calendar-container">
      <div className="calendar">
        <CalendarHeader
          isPreview={isPreview}
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
                      onEditSchedule={handleEditSchedule}
                      icons={icons}
                      selected={selectedDate === dateStr}
                      onSelect={toggleSelect}
                    />
                  );
                })}
                <TodoLanes segs={todoSegs.filter((s) => s.weekRow === weekRow)} onEditTodo={handleEditTodo} />
              </div>
            ))
          )}
        </div>
      </div>
      {selectedDate && (
        <DayPanel
          dateStr={selectedDate}
          holiday={holidayDisplay[selectedDate]}
          todos={todos?.filter((t) => t.start <= selectedDate && selectedDate <= t.end)}
          schedules={schedulesByDate[selectedDate] ?? []}
          onEditTodo={handleEditTodo}
          onEditSchedule={(s) => handleEditSchedule(s, selectedDate)}
          onAddTodo={() => handleAddTodo(selectedDate)}
          onAddSchedule={() => handleAddSchedule(selectedDate)}
          isPreview={isPreview}
          icons={icons}
        />
      )}
      <AddTodoModal
        open={todoModal.open}
        editing={todoModal.editing}
        initialStart={todoModal.initialStart}
        initialEnd={todoModal.initialEnd}
        onClose={() => setTodoModal({ open: false, editing: null })}
        onSave={commitSaveTodo}
        onDelete={commitDeleteTodo}
      />
      <AddScheduleModal
        open={scheduleModal.open}
        editing={scheduleModal.editing}
        initialDate={scheduleModal.initialDate}
        icons={icons || []}
        onClose={() => setScheduleModal({ open: false, editing: null })}
        onSave={commitSaveSchedule}
        onDelete={commitDeleteSchedule}
      />
    </div>
  );
}
