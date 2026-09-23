/* 模拟 src/services/holiday.ts 的解析 + src/utils/holidayDisplay.ts 的展示逻辑（对 2026 真实数据） */
const YEAR = 2026;

// —— 对应 holiday.ts 的解析逻辑 ——
function parseHolidays(json) {
  const raw = json?.holiday ?? json?.data ?? {};
  const result = {};
  Object.entries(raw).forEach(([mmdd, info]) => {
    if (!info || typeof info !== 'object') return;
    const [rawMm, rawDd] = mmdd.split('-');
    const mm = rawMm?.padStart(2, '0');
    const dd = rawDd?.padStart(2, '0');
    if (!mm || !dd || mm.length !== 2 || dd.length !== 2) return;
    result[`${YEAR}-${mm}-${dd}`] = {
      holiday: !!info.holiday,
      name: String(info.name ?? ''),
      target: info.target != null ? String(info.target) : undefined,
    };
  });
  return result;
}

// —— 对应 holidayDisplay.ts 的逻辑 ——
function addDays(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getHolidayDisplay(holidays) {
  const dates = Object.keys(holidays).sort();
  const infoOf = (d) => holidays[d];
  const isHolidayStart = (d) => {
    const prev = addDays(d, -1);
    const prevInfo = infoOf(prev);
    if (prevInfo) return !prevInfo.holiday;
    const target = (infoOf(d).target ?? '');
    if (!target) return true;
    return !dates.some((p) => {
      if (p >= d) return false;
      const pi = infoOf(p);
      return !!pi && pi.holiday && (pi.target ?? '') === target;
    });
  };
  const result = {};
  dates.forEach((d) => {
    const info = holidays[d];
    if (!info) return;
    if (!info.holiday) {
      result[d] = { text: '班', off: false };
      return;
    }
    result[d] = { text: isHolidayStart(d) ? info.name : '休', off: true };
  });
  return result;
}

(async () => {
  const res = await fetch(`https://timor.tech/api/holiday/year/${YEAR}`);
  const json = await res.json();
  console.log('顶层 key:', Object.keys(json).join(','), '共', Object.keys(json.holiday ?? json.data ?? {}).length, '条');
  const holidays = parseHolidays(json);
  const display = getHolidayDisplay(holidays);

  const print = (d) => {
    const info = holidays[d];
    if (!info) return console.log(`${d}: (无数据)`);
    const disp = display[d];
    console.log(`${d}: holiday=${info.holiday} name="${info.name}" -> 展示「${disp.text}」(${disp.off ? '红' : '绿'})`);
  };

  console.log('\n== 元旦 ==');
  ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'].forEach(print);

  console.log('\n== 春节（02-17 为初一）==');
  ['2026-02-14', '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21'].forEach(print);

  console.log('\n== 中秋/国庆 ==');
  ['2026-09-25', '2026-09-26', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'].forEach(print);

  console.log('\n== 全部 holiday:false（补班）条目 ==');
  Object.keys(holidays)
    .filter((d) => !holidays[d].holiday)
    .forEach((d) => print(d));

  console.log('\n== 首日语义检查（首日=节日名 / 后续=休 / 补班=班）==');
  // 找所有展示为节日名（即首日）的日期
  const starts = Object.keys(holidays).filter((d) => holidays[d].holiday && display[d].text === holidays[d].name);
  const offCount = Object.keys(holidays).filter((d) => holidays[d].holiday && display[d].text === '休').length;
  const workCount = Object.keys(holidays).filter((d) => !holidays[d].holiday).length;
  console.log('节日首日(显示节日名):', starts.join('  '));
  console.log('"休"天数:', offCount, '| "班"天数:', workCount);
})().catch((e) => console.error('ERR', e.message));
