import { Button, Segmented, Spin, Space } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { ViewMode } from './types';

interface CalendarHeaderProps {
  year: number;
  month: number;
  viewMode: ViewMode;
  loading: boolean;
  onViewModeChange: (m: ViewMode) => void;
  onToday: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isPreview?: boolean; // 是否是预览模式
}

/** 日历头部：月份标题、视图模式切换、今日/翻月按钮 */
export function CalendarHeader({
  year,
  month,
  viewMode,
  loading,
  onViewModeChange,
  onToday,
  onPrevMonth,
  onNextMonth,
  isPreview,
}: CalendarHeaderProps) {
  return (
    <div className="calendar-header">
      <span className="calendar-title">
        {year}年{month + 1}月
      </span>
      <Segmented
        size="small"
        options={[
          { label: '日历', value: 'all' },
          { label: '事项', value: 'items' },
        ]}
        value={viewMode}
        onChange={(v) => onViewModeChange(v as ViewMode)}
      />
      {
        !isPreview && <Space>
          <Button shape="circle" size="small" onClick={onToday}>
            今
          </Button>
          <Button shape="circle" size="small" onClick={onPrevMonth}>
            <LeftOutlined />
          </Button>
          <Button shape="circle" size="small" onClick={onNextMonth}>
            <RightOutlined />
          </Button>
          {loading && <Spin size="small" />}
        </Space>
      }
    </div>
  );
}
