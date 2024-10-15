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

function getProps(column: Column): DateTimeCellExternalProps {
  const format = getColumnMetadataValue(column, 'date_format');
  const specification = new DateTimeSpecification({
    type: 'date',
    dateFormat: format,
  });
  const formatter = new DateTimeFormatter(specification);
  return {
    type: 'date',
    formattingString: specification.getFormattingString(),
    formatter,
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
  get: (column: Column): ComponentAndProps<DateTimeCellExternalProps> => ({
    component: DateTimeCell,
    props: getProps(column),
  }),
  getInput: (
    column: Column,
  ): ComponentAndProps<
    Omit<DateTimeCellExternalProps, 'formatForDisplay'>
  > => ({
    component: DateTimeInput,
    props: {
      ...getProps(column),
      allowRelativePresets: true,
    },
  }),
  getDisplayFormatter(column: Column) {
    return (v) => getProps(column).formatForDisplay(String(v));
  },
};

export default stringType;
