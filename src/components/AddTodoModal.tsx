import { useEffect } from 'react';
import { Button, Col, DatePicker, Form, Input, Modal, Row, Space, TimePicker } from 'antd';
import type { RuleObject } from 'antd/es/form';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { TodoRange } from '../types';
import './pickers.less';

export const PRESET_COLORS = [
  '#f5222d',
  '#fa8c16',
  '#fadb14',
  '#52c41a',
  '#13c2c2',
  '#1677ff',
  '#722ed1',
  '#eb2f96',
];

interface ColorSwatchProps {
  value?: string;
  onChange?: (v: string) => void;
}

function ColorSwatchSelector({ value = PRESET_COLORS[5], onChange }: ColorSwatchProps) {
  return (
    <div className="color-swatches">
      {PRESET_COLORS.map((c) => (
        <span
          key={c}
          className={`swatch ${value === c ? 'active' : ''}`}
          style={{ background: c }}
          onClick={() => onChange?.(c)}
        />
      ))}
    </div>
  );
}

export interface AddTodoModalProps {
  open: boolean;
  editing: TodoRange | null;
  /** 新增时默认开始日期 */
  initialStart?: string;
  /** 新增时默认结束日期 */
  initialEnd?: string;
  onClose: () => void;
  onSave: (t: TodoRange) => void;
  onDelete: (id: string) => void;
}

export function AddTodoModal({ open, editing, initialStart, initialEnd, onClose, onSave, onDelete }: AddTodoModalProps) {
  const [form] = Form.useForm();
  const isEdit = !!editing;

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      if (editing) {
        form.setFieldsValue({
          name: editing.name,
          start: dayjs(editing.start),
          end: dayjs(editing.end),
          startTime: editing.startTime ? dayjs(editing.startTime, 'HH:mm') : null,
          endTime: editing.endTime ? dayjs(editing.endTime, 'HH:mm') : null,
          color: editing.color,
        });
      } else {
        form.setFieldsValue({
          color: PRESET_COLORS[5],
          start: initialStart ? dayjs(initialStart) : dayjs(),
          end: initialEnd ? dayjs(initialEnd) : dayjs().add(1, 'day'),
          startTime: null,
          endTime: null,
        });
        form.resetFields(['name']);
      }
    }, 100)
  }, [open, editing, initialStart, initialEnd, form]);

  const endRule: RuleObject = {
    validator: (_, value: Dayjs) => {
      const start = form.getFieldValue('start') as Dayjs | undefined;
      if (!value || !start || !value.isBefore(start, 'day')) return Promise.resolve();
      return Promise.reject(new Error('结束日期不能早于开始日期'));
    },
  };

  // 跨天校验：开始与结束日期不能为同一天（结束日期需晚于开始日期）；单日事件引导用户创建日程
  // 同时挂在 start/end 字段上，并通过 dependencies 在任一字段变更时互相触发校验
  const multiDayRule: RuleObject = {
    validator: () => {
      const start = form.getFieldValue('start') as Dayjs | undefined;
      const end = form.getFieldValue('end') as Dayjs | undefined;
      if (!start || !end) return Promise.resolve();
      if (end.isSame(start, 'day')) {
        return Promise.reject(new Error('待办必须跨天（结束日期需晚于开始日期）；单日事件请创建日程'));
      }
      return Promise.resolve();
    },
  };

  // 结束时间校验：与开始日期同天时，结束时间（缺省 24:00）不能早于开始时间（缺省 00:00）；时间最小粒度为 30 分钟（分钟只能为 00 或 30）
  // 注：multiDayRule 已禁止同天，该同天分支对新/编辑数据不会触发，保留作防御
  const endTimeRule: RuleObject = {
    validator: (_, value: Dayjs | null) => {
      const startDate = form.getFieldValue('start') as Dayjs | undefined;
      const endDate = form.getFieldValue('end') as Dayjs | undefined;
      if (!startDate || !endDate || !endDate.isSame(startDate, 'day')) return Promise.resolve();
      const startT = (form.getFieldValue('startTime') as Dayjs | undefined)?.format('HH:mm') ?? '00:00';
      const endT = (value as Dayjs | null)?.format('HH:mm') ?? '24:00';
      if (endT < startT) return Promise.reject(new Error('结束时间不能早于开始时间'));
      return Promise.resolve();
    },
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const startTime = values.startTime as Dayjs | null;
    const endTime = values.endTime as Dayjs | null;
    onSave({
      id: editing?.id ?? crypto.randomUUID(),
      name: (values.name as string).trim(),
      start: (values.start as Dayjs).format('YYYY-MM-DD'),
      end: (values.end as Dayjs).format('YYYY-MM-DD'),
      startTime: startTime ? startTime.format('HH:mm') : undefined,
      endTime: endTime ? endTime.format('HH:mm') : undefined,
      color: values.color as string,
    });
    onClose();
  };

  const handleDelete = () => {
    if (editing) onDelete(editing.id);
    onClose();
  };

  return (
    <Modal
      title={isEdit ? '编辑待办' : '添加待办'}
      open={open}
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
        <Form.Item label="事件名称" name="name" rules={[{ required: true, message: '请输入事件名称' }, { max: 30 }]}>
          <Input placeholder="如：年度项目冲刺" maxLength={30} />
        </Form.Item>
        <Row gutter={8}>
          <Col span={12}>
            <Form.Item
              label="开始日期"
              name="start"
              dependencies={['end']}
              rules={[{ required: true, message: '请选择开始日期' }, multiDayRule]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="开始时间" name="startTime">
              <TimePicker
                style={{ width: '100%' }}
                format="HH:mm"
                minuteStep={30}
                placeholder="首日开始时间，可选"
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={8}>
          <Col span={12}>
            <Form.Item
              label="结束日期"
              name="end"
              dependencies={['start']}
              rules={[{ required: true, message: '请选择结束日期' }, endRule, multiDayRule]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="结束时间" name="endTime" rules={[endTimeRule]}>
              <TimePicker
                style={{ width: '100%' }}
                format="HH:mm"
                minuteStep={30}
                placeholder="末日结束时间，可选"
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="颜色标记" name="color" initialValue={PRESET_COLORS[5]}>
          <ColorSwatchSelector />
        </Form.Item>
      </Form>
    </Modal>
  );
}
