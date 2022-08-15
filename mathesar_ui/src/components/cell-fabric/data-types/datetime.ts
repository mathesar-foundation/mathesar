import type { TimeStampDisplayOptions } from '@mathesar/api/tables/columns';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import {
  DateTimeFormatter,
  DateTimeSpecification,
} from '@mathesar/utils/date-time';
import type { DateTimeCellExternalProps } from './components/typeDefinitions';
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
  return {
    type: 'datetime',
    formattingString: specification.getFormattingString(),
    formatter: new DateTimeFormatter(specification),
    timeEnableSeconds: specification.hasSecondsInTime(),
    timeShow24Hr: specification.isTime24Hr(),
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
  ): ComponentAndProps<DateTimeCellExternalProps> => ({
    component: DateTimeInput,
    props: getProps(column, config?.supportTimeZone ?? false),
  }),
};

export default stringType;
