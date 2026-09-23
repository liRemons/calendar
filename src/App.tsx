import { useState } from 'react';
import { Calendar } from './components/Calendar';
import { AddTodoModal } from './components/AddTodoModal';
import { AddScheduleModal } from './components/AddScheduleModal';
import type { DailySchedule, TodoRange } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

interface IProps {
  isPreview?: boolean; // 预览模式下不支持编辑日程
}

export default function App({ isPreview }: IProps) {
  const [todos, setTodos] = useLocalStorage<TodoRange[]>('calendar_todos', []);
  const [schedules, setSchedules] = useLocalStorage<DailySchedule[]>('calendar_schedules', []);

  const [todoModal, setTodoModal] = useState<{
    open: boolean;
    editing: TodoRange | null;
    /** 从选中日面板新增时的默认开始/结束日期 */
    initialStart?: string;
    initialEnd?: string;
  }>({
    open: false,
    editing: null,
  });
  const [
    scheduleModal,
    setScheduleModal,
  ] = useState<{ open: boolean; editing: DailySchedule | null; initialDate?: string }>({
    open: false,
    editing: null,
  });

  const saveTodo = (t: TodoRange) => {
    setTodos((prev) => {
      const exists = prev.some((x) => x.id === t.id);
      return exists ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t];
    });
  };
  const deleteTodo = (id: string) => setTodos((prev) => prev.filter((x) => x.id !== id));

  const saveSchedule = (s: DailySchedule) => {
    setSchedules((prev) => {
      const exists = prev.some((x) => x.id === s.id);
      return exists ? prev.map((x) => (x.id === s.id ? s : x)) : [...prev, s];
    });
  };
  const deleteSchedule = (id: string) =>
    setSchedules((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="app">
      <Calendar
        isPreview={isPreview}
        todos={todos}
        schedules={schedules}
        onEditTodo={(t) => {
          if (isPreview) {
            return; // 预览模式下不支持编辑日程
          }
          setTodoModal({ open: true, editing: t })
        }}
        onEditSchedule={(s) => {
          if (isPreview) {
            return; // 预览模式下不支持编辑日程
          }
          setScheduleModal({ open: true, editing: s })
        }}
        onAddTodo={(date) =>
          setTodoModal({ open: true, editing: null, initialStart: date, initialEnd: date })
        }
        onAddSchedule={(date) => setScheduleModal({ open: true, editing: null, initialDate: date })}
      />
      <AddTodoModal
        open={todoModal.open}
        editing={todoModal.editing}
        initialStart={todoModal.initialStart}
        initialEnd={todoModal.initialEnd}
        onClose={() => setTodoModal({ open: false, editing: null })}
        onSave={saveTodo}
        onDelete={deleteTodo}
      />
      <AddScheduleModal
        open={scheduleModal.open}
        editing={scheduleModal.editing}
        initialDate={scheduleModal.initialDate}
        onClose={() => setScheduleModal({ open: false, editing: null })}
        onSave={saveSchedule}
        onDelete={deleteSchedule}
      />
    </div>
  );
}
