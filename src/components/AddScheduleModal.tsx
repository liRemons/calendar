import { useEffect } from 'react';
import { Button, DatePicker, Form, Input, Modal, Space, TimePicker } from 'antd';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { DailySchedule } from '../types';
import './pickers.less';

interface IconSelectorProps {
  icons: Record<string, ReactNode>;
  value?: string;
  onChange?: (v: string) => void;
}

function IconSelector({ icons, onChange }: IconSelectorProps) {
  return (
    <div className="emoji-grid">
      {Object.entries(icons).map(([key, node]) => (
        <span key={key} className="emoji-item" onClick={() => onChange?.(key)}>
          {node}
        </span>
      ))}
    </div>
  );
}

export interface AddScheduleModalProps {
  open: boolean;
  editing: DailySchedule | null;
  /** 新增时默认日期 */
  initialDate?: string;
  /** 外部传入的图标映射：key 为图标标识，value 为图片 DOM */
  icons: Record<string, ReactNode>;
  onClose: () => void;
  onSave: (s: DailySchedule) => void;
  onDelete: (id: string) => void;
}

export function AddScheduleModal({
  open,
  editing,
  initialDate,
  icons,
  onClose,
  onSave,
  onDelete,
}: AddScheduleModalProps) {
  const [form] = Form.useForm();
  const isEdit = !!editing;
  const iconKeys = Object.keys(icons);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      if (editing) {
        form.setFieldsValue({
          icon: editing.icon,
          date: dayjs(editing.date),
          name: editing.name,
          timeRange:
            editing.startTime && editing.endTime
              ? [dayjs(editing.startTime, 'HH:mm'), dayjs(editing.endTime, 'HH:mm')]
              : null,
        });
      } else {
        form.setFieldsValue({
          icon: iconKeys[0],
          date: initialDate ? dayjs(initialDate) : dayjs(),
          timeRange: null,
        });
        form.resetFields(['name']);
      }
    }, 100)
  }, [open, editing, initialDate, form, icons]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const timeRange = values.timeRange as [Dayjs, Dayjs] | null;
    onSave({
      id: editing?.id ?? crypto.randomUUID(),
      icon: values.icon as string,
      date: (values.date as Dayjs).format('YYYY-MM-DD'),
      name: (values.name as string).trim(),
      startTime: timeRange?.[0] ? timeRange[0].format('HH:mm') : undefined,
      endTime: timeRange?.[1] ? timeRange[1].format('HH:mm') : undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (editing) onDelete(editing.id);
    onClose();
  };

  return (
    <Modal
      title={isEdit ? '编辑日程' : '添加日程'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="保存"
      cancelText="取消"
      destroyOnClose
      footer={
        <Space>
          {isEdit && (
            <Button danger onClick={handleDelete}>
              删除
            </Button>
          )}
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleOk}>
            保存
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item label="图标" name="icon" initialValue={iconKeys[0]} rules={[{ required: true }]}>
          <IconSelector icons={icons} />
        </Form.Item>
        <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item label="时间范围" name="timeRange">
          <TimePicker.RangePicker
            style={{ width: '100%' }}
            format="HH:mm"
            minuteStep={30}
            placeholder={['开始时间', '结束时间']}
            allowClear
          />
        </Form.Item>
        <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }, { max: 30 }]}>
          <Input placeholder="如：牙医复诊" maxLength={30} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
