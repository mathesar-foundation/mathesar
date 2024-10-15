import { type Column, getColumnMetadataValue } from '@mathesar/api/rpc/columns';
import {
  DateTimeFormatter,
  DateTimeSpecification,
} from '@mathesar/utils/date-time';
import { isDefinedNonNullable } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import DateTimeCell from './components/date-time/DateTimeCell.svelte';
import DateTimeInput from './components/date-time/DateTimeInput.svelte';
import type { DateTimeCellExternalProps } from './components/typeDefinitions';
import type { CellComponentFactory } from './typeDefinitions';

function getProps(
  column: Column,
  supportTimeZone: boolean,
): DateTimeCellExternalProps {
  const format = getColumnMetadataValue(column, 'time_format');
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
    column: Column,
    config?: { supportTimeZone?: boolean },
  ): ComponentAndProps<DateTimeCellExternalProps> => ({
    component: DateTimeCell,
    props: getProps(column, config?.supportTimeZone ?? false),
  }),
  getInput: (
    column: Column,
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
  getDisplayFormatter(column: Column, config?: { supportTimeZone?: boolean }) {
    const supportTimeZone = config?.supportTimeZone ?? false;
    return (v) => getProps(column, supportTimeZone).formatForDisplay(String(v));
  },
};

export default timeType;
