import { Calendar } from './components/Calendar';
import type { DailySchedule, TodoRange } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { ReactNode } from 'react';

interface IProps {
  isPreview?: boolean; // 预览模式下不支持编辑日程
}

const DEFAULT_ICONS: Record<string, ReactNode> = {
  'ln-icon-duihao': '\ud83d\udcc5',   // \ud83d\udcc5 日历（作为日历/默认）
  'ln-icon-jian': '\ud83d\udcfe',  // \ud83d\udcfe
  'ln-icon-yuantan': '\ud83d\udc68\ude3c',  // \ud83d\udc68\ude3c
  'ln-icon-renshenqing': '\ud83d\ude91',  // \ud83d\ude91
  'ln-icon-shengyu': '\ud83c\udf72',   // \ud83c\udf72
  'ln-icon-ruidu': '\UD83D\uDD4A',
  'ln-icon-hongdapengzhang': '\U0001F381',  // \U0001F381
  'ln-icon-dianchi': '\ud87d\udd51',
};

export default function App({ isPreview }: IProps) {
  const [todos, setTodos] = useLocalStorage<TodoRange[]>('calendar_todos', []);
  const [schedules, setSchedules] = useLocalStorage<DailySchedule[]>('calendar_schedules', []);

  const saveTodo = (t: TodoRange) =>
    setTodos((prev) => {
      const exists = prev.some((x) => x.id === t.id);
      return exists ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t];
    });
  const deleteTodo = (id: string) => setTodos((prev) => prev.filter((x) => x.id !== id));

  const saveSchedule = (s: DailySchedule) =>
    setSchedules((prev) => {
      const exists = prev.some((x) => x.id === s.id);
      return exists ? prev.map((x) => (x.id === s.id ? s : x)) : [...prev, s];
    });
  const deleteSchedule = (id: string) => setSchedules((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="app">
      <Calendar
        icons={DEFAULT_ICONS}
        isPreview={isPreview}
        todos={todos}
        schedules={schedules}
        onSaveTodo={saveTodo}
        onDeleteTodo={deleteTodo}
        onSaveSchedule={saveSchedule}
        onDeleteSchedule={deleteSchedule}
      />
    </div>
  );
}