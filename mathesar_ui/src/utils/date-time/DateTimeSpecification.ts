import { dayjs } from '@mathesar-component-library';
import type { DateFormat, TimeFormat } from '@mathesar/api/tables/columns';

interface DateConfig {
  type: 'date';
  dateFormat?: DateFormat;
  timeFormat?: never;
}

interface TimeConfig {
  type: 'time';
  timeFormat?: TimeFormat;
  dateFormat?: never;
}

interface TimeStampConfig {
  type: 'timestamp';
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
}

export type DateTimeConfig = DateConfig | TimeConfig | TimeStampConfig;

function getDateFormattingStringMap(): Record<DateFormat, string> {
  // Galaxy Quest was released on this day
  const constDate = new Date('1999-12-25');
  const localeString = constDate.toLocaleDateString();
  const localeFormat = localeString
    .replace('25', 'DD')
    .replace('12', 'MM')
    .replace('1999', 'YYYY');

  return {
    none: localeFormat,
    us: 'MM/DD/YYYY',
    eu: 'DD/MM/YYYY',
    friendly: 'D MMM YYYY',
    iso: 'YYYY-MM-DD',
  };
}

const dateFormattingStringMap = getDateFormattingStringMap();
const commonDateFormattingStringsMap: Map<DateFormat, string[]> = new Map([
  ['us', ['M/D/YYYY', 'M/D/YY']],
  ['eu', ['D/M/YYYY', 'D/M/YY']],
  ['friendly', ['D MMM YY']],
]);

export default class DateTimeSpecification {
  readonly type: 'date' | 'time' | 'timestamp';

  readonly dateFormat: DateFormat;

  readonly timeFormat: TimeFormat;

  constructor(config?: DateTimeConfig) {
    this.type = config?.type ?? 'timestamp';
    this.dateFormat = config?.dateFormat ?? 'none';
    this.timeFormat = config?.timeFormat ?? 'none';
  }

  getFormattingString(): string {
    if (this.type === 'date') {
      return dateFormattingStringMap[this.dateFormat];
    }
    return '';
  }

  getCommonFormattingStrings(): string[] {
    if (this.type === 'date') {
      return commonDateFormattingStringsMap.get(this.dateFormat) ?? [];
    }
    return [];
  }

  getCanonicalFormattingStrings(): string[] {
    if (this.type === 'date') {
      return ['YYYY-MM-DD', 'YYYY-MM-DD [AD]', 'YYYY-MM-DD [BC]'];
    }
    return [];
  }

  getCanonicalString(date: Date): string {
    if (this.type === 'date') {
      return dayjs(date).format('YYYY-MM-DD');
    }
    if (this.type === 'time') {
      return dayjs(date).format('HH:mm:ss');
    }
    return date.toISOString();
  }

  static getDateFormattingStringMap(): Record<DateFormat, string> {
    return dateFormattingStringMap;
  }
}
