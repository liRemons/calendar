declare module 'lunar-javascript' {
  export class Base {
    getYearInGanZhi(): string;
    getYearInChinese(): string;
    getYearInEn(): string;
    getYearShengXiao(lunar?: boolean): string;
    getYearGan(): string;
    getYearZhi(): string;
  }

  export class Lunar extends Base {
    static fromYmd(y: number, m: number, d: number): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    isLeap(): boolean;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getFestivals(): string[];
    getJieQi(): string;
  }

  export class Solar extends Base {
    static fromYmd(y: number, m: number, d: number): Solar;
    static fromYmdHms(y: number, m: number, d: number, hour: number, minute: number, second: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
  }
}
