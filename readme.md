封装一个日历组件，需要支持以下功能

1. 支持基础展示
2. 头部为星期
3. 支持展示农历和节日
4. 支持显示休息和补班
5. 支持添加待办范围（line形式范围）
6. 支持添加单日日程

技术栈要求：
1. 采用React + ts，必要时采用 antd 表单组件
2. lunar-javascript / chinese-lunar-calendar 作为农历和节日的展示
3. 节假日采用 `https://timor.tech/api/holiday/year/2026` 接口，按年永久缓存数据
4. 待办范围支持的字段（开始日期、结束日期、事件名称、颜色标记）
5. 单日日程支持的额字段（icon、日期、名称）

## 构建与发布（npm 包）

- 构建组件包（ESM + CJS + 声明文件 + style.css）：`npm run build:lib`
- 发布前干跑校验：`npm run publish:dry`
- 正式发布：`npm publish --access public`（先 npmjs 登录）
- 仓库内 `index.html` + `src/App.tsx` 为本地 demo，不参与组件包构建
- 产物：`dist/index.js`(ESM)、`dist/index.cjs`(CJS)、`dist/index.d.ts`、`dist/style.css`

> 注意：未配置 `license` 字段时，npm 会将其标记为 UNLICENSED，发布前请按需添加。

## 作为 npm 组件使用

```bash
npm install remons-calendar antd dayjs
```

```tsx
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import {
  Calendar,
  AddTodoModal,
  AddScheduleModal,
} from 'remons-calendar';
import type { TodoRange, DailySchedule } from 'remons-calendar';
import 'remons-calendar/style.css';

// 用 State 或 useLocalStorage 管理 todos / schedules，
// 通过 onEditTodo / onAddTodo 等回调打开 AddTodoModal / AddScheduleModal（参考 src/App.tsx）
<ConfigProvider locale={zhCN}>
  <AntApp>
    <Calendar todos={todos} schedules={schedules} onEditTodo={...} onEditSchedule={...} onAddTodo={...} onAddSchedule={...} />
  </AntApp>
</ConfigProvider>
```

## 本地开发（demo）

```bash
npm run dev    # 启动本地 demo
npm run build  # 构建 demo 站点
```