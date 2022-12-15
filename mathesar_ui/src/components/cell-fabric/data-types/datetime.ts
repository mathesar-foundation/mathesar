import { isDefinedNonNullable } from '@mathesar-component-library';
import type { TimeStampDisplayOptions } from '@mathesar/api/types/tables/columns';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import {
  DateTimeFormatter,
  DateTimeSpecification,
} from '@mathesar/utils/date-time';
import type {
  DateTimeCellExternalProps,
  CellValueFormatter,
} from './components/typeDefinitions';
import type { CellComponentFactory, CellColumnLike } from './typeDefinitions';
import DateTimeCell from './components/date-time/DateTimeCell.svelte';
import DateTimeInput from './components/date-time/DateTimeInput.svelte';

export interface DateLikeColumn extends CellColumnLike {
  display_options: Partial<TimeStampDisplayOptions> | null;
}

function getProps(
  column: DateLikeColumn,
  supportTimeZone: boolean,
): DateTimeCellExternalProps {
  const displayOptions = column.display_options ?? {};
  const dateFormat = displayOptions.date_format ?? 'none';
  const timeFormat = displayOptions.time_format ?? '24hr';
  const specification = new DateTimeSpecification({
    type: supportTimeZone ? 'timestampWithTZ' : 'timestamp',
    dateFormat,
    timeFormat,
  });
  const formatter = new DateTimeFormatter(specification);
  return {
    type: 'datetime',
    formattingString: specification.getFormattingString(),
    formatter,
    timeEnableSeconds: specification.hasSecondsInTime(),
    timeShow24Hr: specification.isTime24Hr(),
    formatForDisplay: (
      v: string | null | undefined,
    ): string | null | undefined => {
      if (!isDefinedNonNullable(v)) {
        return v;
      }
      return formatter.parseAndFormat(v);
    },
  };
}

const stringType: CellComponentFactory = {
  get: (
    column: DateLikeColumn,
    config?: { supportTimeZone?: boolean },
  ): ComponentAndProps<DateTimeCellExternalProps> => ({
    component: DateTimeCell,
    props: getProps(column, config?.supportTimeZone ?? false),
  }),
  getInput: (
    column: DateLikeColumn,
    config?: { supportTimeZone?: boolean },
  ): ComponentAndProps<
    Omit<DateTimeCellExternalProps, 'formatForDisplay'>
  > => ({
    component: DateTimeInput,
    props: {
      ...getProps(column, config?.supportTimeZone ?? false),
      allowRelativePresets: true,
    },
  }),
  getDisplayFormatter(
    column: DateLikeColumn,
    config?: { supportTimeZone?: boolean },
  ): CellValueFormatter<string> {
    return getProps(column, config?.supportTimeZone ?? false).formatForDisplay;
  },
};

export default stringType;
