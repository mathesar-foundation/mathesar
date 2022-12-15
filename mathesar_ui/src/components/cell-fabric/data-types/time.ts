import { isDefinedNonNullable } from '@mathesar-component-library';
import type { TimeDisplayOptions } from '@mathesar/api/types/tables/columns';
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

export interface TimeLikeColumn extends CellColumnLike {
  display_options: Partial<TimeDisplayOptions> | null;
}

function getProps(
  column: TimeLikeColumn,
  supportTimeZone: boolean,
): DateTimeCellExternalProps {
  const displayOptions = column.display_options ?? {};
  const format = displayOptions.format ?? '24hr';
  const specification = new DateTimeSpecification({
    type: supportTimeZone ? 'timeWithTZ' : 'time',
    timeFormat: format,
  });
  const formatter = new DateTimeFormatter(specification);
  return {
    type: 'time',
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

const timeType: CellComponentFactory = {
  get: (
    column: TimeLikeColumn,
    config?: { supportTimeZone?: boolean },
  ): ComponentAndProps<DateTimeCellExternalProps> => ({
    component: DateTimeCell,
    props: getProps(column, config?.supportTimeZone ?? false),
  }),
  getInput: (
    column: TimeLikeColumn,
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
    column: TimeLikeColumn,
    config?: { supportTimeZone?: boolean },
  ): CellValueFormatter<string> {
    return getProps(column, config?.supportTimeZone ?? false).formatForDisplay;
  },
};

export default timeType;
