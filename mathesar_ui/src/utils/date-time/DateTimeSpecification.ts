import { dayjs } from '@mathesar-component-library';
import type { DateFormat, TimeFormat } from '@mathesar/api/tables/columns';

interface DateConfig {
  type: 'date';
  dateFormat?: DateFormat;
  timeFormat?: never;
}

interface TimeConfig {
  type: 'time' | 'timeWithTZ';
  timeFormat?: TimeFormat;
  dateFormat?: never;
}

interface TimeStampConfig {
  type: 'timestamp' | 'timestampWithTZ';
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

const timeFormattingStringMap: Record<TimeFormat, string> = {
  '24hr': 'HH:mm',
  '24hrLong': 'HH:mm:ss',
  '12hr': 'hh:mm a',
  '12hrLong': 'hh:mm:ss a',
};

const commonTimeFormattingStrings = [
  'hh:mm:ss a',
  'HH:mm:ss',
  'hh:mm a',
  'HH:mm',
];
const commonTimeWithTZFormattingStrings = [
  ...commonTimeFormattingStrings.map((entry) => `${entry}.Z`),
  ...commonTimeFormattingStrings.map((entry) => `${entry} Z`),
  ...commonTimeFormattingStrings.map((entry) => `${entry}Z`),
];

export default class DateTimeSpecification {
  readonly type:
    | DateConfig['type']
    | TimeConfig['type']
    | TimeStampConfig['type'];

  readonly isTimeZoneType: boolean;

  readonly dateFormat: DateFormat;

  readonly timeFormat: TimeFormat;

  constructor(config?: DateTimeConfig) {
    this.type = config?.type ?? 'timestamp';
    this.dateFormat = config?.dateFormat ?? 'none';
    this.timeFormat = config?.timeFormat ?? '24hr';
    this.isTimeZoneType =
      this.type === 'timeWithTZ' || this.type === 'timestampWithTZ';
  }

  getFormattingString(): string {
    if (this.type === 'date') {
      return dateFormattingStringMap[this.dateFormat];
    }
    if (this.type === 'time' || this.type === 'timeWithTZ') {
      return timeFormattingStringMap[this.timeFormat];
    }
    return '';
  }

  getCommonFormattingStrings(): string[] {
    if (this.type === 'date') {
      return commonDateFormattingStringsMap.get(this.dateFormat) ?? [];
    }
    if (this.type === 'time') {
      return commonTimeFormattingStrings;
    }
    if (this.type === 'timeWithTZ') {
      return commonTimeWithTZFormattingStrings;
    }
    return [];
  }

  getCanonicalFormattingStrings(): string[] {
    if (this.type === 'date') {
      return ['YYYY-MM-DD', 'YYYY-MM-DD [AD]', 'YYYY-MM-DD [BC]'];
    }
    if (this.type === 'time') {
      return ['HH:mm:ss', 'HH:mm:ss.S'];
    }
    if (this.type === 'timeWithTZ') {
      return ['HH:mm:ss.Z', 'HH:mm:ss Z', 'HH:mm:ss.ZZ', 'HH:mm:ss ZZ'];
    }
    return [];
  }

  getCanonicalString(dateObject: Date): string {
    if (this.type === 'date') {
      return dayjs(dateObject).format('YYYY-MM-DD');
    }
    if (this.type === 'time') {
      return dayjs(dateObject).format('HH:mm:ss');
    }
    if (this.type === 'timeWithTZ') {
      return dayjs(dateObject).format('HH:mm:ss Z');
    }
    return dateObject.toISOString();
  }

  static getDateFormattingStringMap(): Record<DateFormat, string> {
    return dateFormattingStringMap;
  }

  static getTimeFormattingStringMap(): Record<TimeFormat, string> {
    return timeFormattingStringMap;
  }
}
