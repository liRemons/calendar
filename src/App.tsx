import { Calendar } from './components/Calendar';
import type { DailySchedule, TodoRange } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

interface IProps {
  isPreview?: boolean; // 预览模式下不支持编辑日程
}

const DEFAULT_ICONS = [
  { key: 'ln-icon-duihao', icon: '\ud83d\udcc5', tip: '日历' },
  { key: 'ln-icon-jian', icon: '\ud83d\udcfe', tip: '工作' },
  { key: 'ln-icon-yuantan', icon: '\ud83d\udc68\ude3c', tip: '医疗' },
  { key: 'ln-icon-renshenqing', icon: '\ud83d\ude91', tip: '出行' },
  { key: 'ln-icon-shengyu', icon: '\ud83c\udf72', tip: '饮食' },
  { key: 'ln-icon-ruidu', icon: '\ud83d\ude80', tip: '速度' },
  { key: 'ln-icon-hongdapengzhang', icon: '\U0001F381', tip: '礼物' },
  { key: 'ln-icon-dianchi', icon: '\ud87d\udd51', tip: '充电' },
];

export default function App({ isPreview }: IProps) {
  const [todos, setTodos] = useLocalStorage<TodoRange[]>('calendar_todos', []);
  const [schedules, setSchedules] = useLocalStorage<DailySchedule[]>('calendar_schedules', []);

  const handleChange = (nextTodos: TodoRange[], nextSchedules: DailySchedule[]) => {
    setTodos(nextTodos);
    setSchedules(nextSchedules);
  };

  return (
    <div className="app">
      <Calendar
        icons={DEFAULT_ICONS}
        isPreview={isPreview}
        todos={todos}
        schedules={schedules}
        onChange={handleChange}
      />
    </div>
  );
}