import { Tooltip } from 'antd';
import type { TodoRange } from '../../types';
import { formatTimeRange } from '../../utils/date';
import type { TodoSeg } from './types';
import './styles/todo-bar.less';

interface TodoLanesProps {
  /** 该周行的待办横条段 */
  segs: TodoSeg[];
  onEditTodo: (t: TodoRange) => void;
}

/** 单周行内的待办横条覆盖层 */
export function TodoLanes({ segs, onEditTodo }: TodoLanesProps) {
  return (
    <div className="todo-lanes">
      {segs.map((s, i) => {
        const t = s.todo;
        const rangeTip = `${t.start}${t.startTime ? ` ${t.startTime}` : ''} ~ ${t.end}${t.endTime ? ` ${t.endTime}` : ''}`;
        // 单日且设置了时间的待办，标签附带时间：如 "名称 09:00-10:30"
        const labelTime = t.start === t.end ? formatTimeRange(t) : '';
        return (
        <Tooltip
          key={`${t.id}-${i}`}
          title={`${t.name}（${rangeTip}）`}
        >
          <span
            className={`todo-bar${s.roundLeft ? ' round-left' : ''}${s.roundRight ? ' round-right' : ''}`}
            style={{
              top: 50 + s.lane * 22,
              left: `${(s.leftEdge / 7) * 100}%`,
              width: `${((Math.max(s.rightEdge, s.leftEdge) - s.leftEdge) / 7) * 100}%`,
              background: t.color,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEditTodo(t);
            }}
          >
            {s.showLabel && (
              <span className="todo-bar-label">{labelTime ? `${t.name} ${labelTime}` : t.name}</span>
            )}
          </span>
        </Tooltip>
        );
      })}
    </div>
  );
}
