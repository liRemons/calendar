/** 待办范围（line 形式范围） */
export interface TodoRange {
  id: string;
  /** 事件名称 */
  name: string;
  /** 开始日期 YYYY-MM-DD */
  start: string;
  /** 结束日期 YYYY-MM-DD */
  end: string;
  /** 开始时间 HH:mm（可选，分钟粒度 30；缺省视为 00:00，整天） */
  startTime?: string;
  /** 结束时间 HH:mm（可选，分钟粒度 30；缺省视为 24:00，整天） */
  endTime?: string;
  /** 颜色标记（十六进制，如 #1677ff） */
  color: string;
}

/** 单日日程 */
export interface DailySchedule {
  id: string;
  /** icon（emoji） */
  icon: string;
  /** 日期 YYYY-MM-DD */
  date: string;
  /** 名称 */
  name: string;
  /** 开始时间 HH:mm（可选，分钟粒度 30；缺省视为 00:00，整天） */
  startTime?: string;
  /** 结束时间 HH:mm（可选，分钟粒度 30；缺省视为 24:00，整天） */
  endTime?: string;
}

/** 节假日信息（来自 timor.tech） */
export interface HolidayInfo {
  /** true=休息（节假日），false=补班（调休上班） */
  holiday: boolean;
  /** 名称，如：元旦、国庆补班 */
  name: string;
  /** 所属假期名称（同一假期的各天 target 相同，如"国庆"），用于识别假期首日 */
  target?: string;
}
