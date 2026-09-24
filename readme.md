# remons-calendar

React 日历组件：农历/节日展示、节假日与补班、待办范围（line 形式）、单日日程。

## 功能

1. 支持基础展示
2. 头部为星期
3. 支持展示农历和节日
4. 支持显示休息和补班
5. 支持添加待办范围（line形式范围）
6. 支持添加单日日程

技术栈：

1. 采用 React + ts，必要时采用 antd 表单组件（peer 依赖：`antd`、`dayjs`）
2. `lunar-javascript` 作为农历和节日的展示
3. 节假日采用 `https://timor.tech/api/holiday/year/{year}` 接口，按年永久缓存（组件切换展示年份时自动加载）
4. 待办范围支持的字段：事件名称、开始日期、结束日期、颜色标记、开始/结束时间（可选）
5. 单日日程支持的字段：icon、日期、名称、开始/结束时间（可选）

## 作为 npm 组件使用

```bash
npm install remons-calendar antd dayjs
```

```tsx
import { useState } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Calendar } from 'remons-calendar';
import type { CalendarProps, IconItem } from 'remons-calendar';
import 'remons-calendar/style.css';

export function Demo() {
  // todos / schedules 仅作初始值，后续由组件内部维护状态；
  // 内部数据每次变更都会调用 onChange 传出最新值，可持久化到 localStorage / 后端。
  const [todos, setTodos] = useState<NonNullable<CalendarProps['todos']>>([]);
  const [schedules, setSchedules] = useState<NonNullable<CalendarProps['schedules']>>([]);
  const icons: IconItem[] = [
    { key: 'hotel', icon: '🏨', tip: '酒店' },
  ];

  return (
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <Calendar
          todos={todos}
          schedules={schedules}
          onChange={(nextTodos, nextSchedules) => {
            setTodos(nextTodos);
            setSchedules(nextSchedules);
          }}
          icons={icons}
        />
      </AntApp>
    </ConfigProvider>
  );
}
```

> 弹窗 / 编辑等交互逻辑已内聚到 `Calendar` 内部，消费方无需感知。
> `onSaveTodo` / `onDeleteTodo` / `onSaveSchedule` / `onDeleteSchedule` 为兼容回调，在单条待办 / 日程保存或删除成功后触发。

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| todos | TodoRange[] | - | 初始待办列表，仅首次渲染时生效，后续由组件内部维护 |
| schedules | DailySchedule[] | - | 初始日程列表，同上 |
| onChange | (todos: TodoRange[], schedules: DailySchedule[]) => void | - | 内部待办/日程每次变更后调用，参数为最新值 |
| isPreview | boolean | false | 预览模式：禁用新增/编辑/删除操作 |
| icons | IconItem[] | - | 日程可用图标列表，见下表 |
| onSaveTodo | (t: TodoRange) => void | - | 兼容回调：保存（新增/编辑）待办成功后触发 |
| onDeleteTodo | (id: string) => void | - | 兼容回调：删除待办后触发 |
| onSaveSchedule | (s: DailySchedule) => void | - | 兼容回调：保存（新增/编辑）日程成功后触发 |
| onDeleteSchedule | (id: string) => void | - | 兼容回调：删除日程后触发 |

### IconItem

| 字段 | 类型 | 说明 |
|------|------|------|
| key | string | 图标标识（唯一 key，存储到日程的 icon 字段） |
| icon | React.ReactNode | 图标节点（emoji 字符串 / React 元素） |
| tip | string | 图标名称/提示（hover tooltip、图标选择器展示） |

### TodoRange（待办范围）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| name | string | 事件名称 |
| start | string | 开始日期 YYYY-MM-DD |
| end | string | 结束日期 YYYY-MM-DD |
| startTime? | string | 开始时间 HH:mm（分钟粒度 30；缺省视为 00:00，整天） |
| endTime? | string | 结束时间 HH:mm（分钟粒度 30；缺省视为 24:00，整天） |
| color | string | 颜色标记（十六进制，如 #1677ff） |

### DailySchedule（单日日程）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| icon | string | 图标标识（按 key 从 icons 列表中匹配渲染对应图标节点） |
| date | string | 日期 YYYY-MM-DD |
| name | string | 名称 |
| startTime? | string | 开始时间 HH:mm（分钟粒度 30；缺省视为 00:00，整天） |
| endTime? | string | 结束时间 HH:mm（分钟粒度 30；缺省视为 24:00，整天） |

> 注：包入口导出 `Calendar`、`CalendarProps`、`IconItem`；`TodoRange` / `DailySchedule` 未从包入口导出，TS 消费方可通过 `CalendarProps['todos']` / `CalendarProps['schedules']` 引用其类型。

## 构建与发布（npm 包）

- 构建组件包（ESM + CJS + 声明文件 + style.css）：`npm run build:lib`
- 发布前干跑校验：`npm run publish:dry`
- 正式发布：`npm publish --access public`（先 npmjs 登录）
- 仓库内 `index.html` + `src/App.tsx` 为本地 demo，不参与组件包构建
- 产物：`dist/index.js`(ESM)、`dist/index.cjs`(CJS)、`dist/index.d.ts`、`dist/style.css`

> 注意：未配置 `license` 字段时，npm 会将其标记为 UNLICENSED，发布前请按需添加。

## 本地开发（demo）

```bash
npm run dev    # 启动本地 demo
npm run build  # 构建 demo 站点
```