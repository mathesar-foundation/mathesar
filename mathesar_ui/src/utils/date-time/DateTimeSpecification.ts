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

// TODO: Find if there's a native or iter-tools option to do this
function combine<T>(
  array1: T[],
  array2: T[],
  combinationFn: (e: T, e2: T) => T,
): T[] {
  const newArray: T[] = [];
  array1.forEach((entry) => {
    array2.forEach((a2Entry) => {
      newArray.push(combinationFn(entry, a2Entry));
    });
  });
  return newArray;
}

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
  ...commonTimeFormattingStrings,
  ...combine(
    commonTimeFormattingStrings,
    [' Z', '.Z', 'Z'],
    (a, b) => `${a}${b}`,
  ),
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
    switch (this.type) {
      case 'date':
        return dateFormattingStringMap[this.dateFormat];
      case 'time':
      case 'timeWithTZ':
        return timeFormattingStringMap[this.timeFormat];
      case 'timestamp':
      case 'timestampWithTZ':
      default:
        return `${dateFormattingStringMap[this.dateFormat]} ${
          timeFormattingStringMap[this.timeFormat]
        }`;
    }
  }

  getCommonFormattingStrings(): string[] {
    const allDateFormattingStrings = [
      dateFormattingStringMap[this.dateFormat],
      ...(commonDateFormattingStringsMap.get(this.dateFormat) ?? []),
    ];
    if (this.type === 'date') {
      return commonDateFormattingStringsMap.get(this.dateFormat) ?? [];
    }
    if (this.type === 'time') {
      return commonTimeFormattingStrings;
    }
    if (this.type === 'timeWithTZ') {
      return commonTimeWithTZFormattingStrings;
    }
    if (this.type === 'timestamp') {
      return combine(
        allDateFormattingStrings,
        commonTimeFormattingStrings,
        (a, b) => `${a} ${b}`,
      );
    }
    if (this.type === 'timestampWithTZ') {
      return combine(
        allDateFormattingStrings,
        commonTimeWithTZFormattingStrings,
        (a, b) => `${a} ${b}`,
      );
    }
    return [];
  }

  getCanonicalFormattingStrings(): string[] {
    const date = ['YYYY-MM-DD'];
    const dateFull = [...date, 'YYYY-MM-DD [AD]', 'YYYY-MM-DD [BC]'];
    const time = ['HH:mm:ss'];
    const timeWithTZ = [
      'HH:mm:ss.Z',
      'HH:mm:ss Z',
      'HH:mm:ss.ZZ',
      'HH:mm:ss ZZ',
    ];
    const timestamp = combine(date, time, (a, b) => `${a} ${b}`);
    const timestampFull = [
      ...timestamp,
      ...combine(timestamp, ['[AD]', '[BC]'], (a, b) => `${a} ${b}`),
    ];
    const timestampWithTZ = combine(date, timeWithTZ, (a, b) => `${a} ${b}`);
    const timestampWithTZFull = [
      ...timestampWithTZ,
      ...combine(timestampWithTZ, ['[AD]', '[BC]'], (a, b) => `${a} ${b}`),
    ];

    switch (this.type) {
      case 'date':
        return dateFull;
      case 'time':
        return time;
      case 'timeWithTZ':
        return timeWithTZ;
      case 'timestamp':
        return timestampFull;
      case 'timestampWithTZ':
        return timestampWithTZFull;
      default:
        return [];
    }
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
    if (this.type === 'timestamp') {
      return dayjs(dateObject).format('YYYY-MM-DD HH:mm:ss');
    }
    if (this.type === 'timestampWithTZ') {
      return dayjs(dateObject).format('YYYY-MM-DD HH:mm:ss Z');
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
