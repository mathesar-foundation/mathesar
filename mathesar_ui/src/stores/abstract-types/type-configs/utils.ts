import { dayjs } from '@mathesar-component-library';
import type { DateFormat, TimeFormat } from '@mathesar/api/tables/columns';
import { DateTimeSpecification } from '@mathesar/utils/date-time';

export function getDateFormatOptions(): Record<DateFormat, { label: string }> {
  const day = dayjs();
  const dateFormattingStringMap =
    DateTimeSpecification.getDateFormattingStringMap();

  return {
    none: {
      label: `Infer from browser (${day.format(dateFormattingStringMap.none)})`,
    },
    us: { label: `US (${day.format(dateFormattingStringMap.us)})` },
    eu: { label: `European (${day.format(dateFormattingStringMap.eu)})` },
    friendly: {
      label: `Friendly (${day.format(dateFormattingStringMap.friendly)})`,
    },
    iso: { label: `Standard (${day.format(dateFormattingStringMap.iso)})` },
  };
}

export function getTimeFormatOptions(): Record<TimeFormat, { label: string }> {
  const day = dayjs();
  const timeFormattingStringMap =
    DateTimeSpecification.getTimeFormattingStringMap();

  return {
    '24hr': {
      label: `Short time 24 hr (${day.format(
        timeFormattingStringMap['24hr'],
      )})`,
    },
    '24hrLong': {
      label: `Long time 24 hr (${day.format(
        timeFormattingStringMap['24hrLong'],
      )})`,
    },
    '12hr': {
      label: `Short time 12 hr (${day.format(
        timeFormattingStringMap['12hr'],
      )})`,
    },
    '12hrLong': {
      label: `Long time 12 hr (${day.format(
        timeFormattingStringMap['12hrLong'],
      )})`,
    },
  };
}
