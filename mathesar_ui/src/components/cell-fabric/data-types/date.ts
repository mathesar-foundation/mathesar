import { isDefinedNonNullable } from '@mathesar-component-library';
import type { DateDisplayOptions } from '@mathesar/api/types/tables/columns';
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
  display_options: Partial<DateDisplayOptions> | null;
}

function getProps(column: DateLikeColumn): DateTimeCellExternalProps {
  const displayOptions = column.display_options ?? {};
  const format = displayOptions.format ?? 'none';
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
  get: (
    column: DateLikeColumn,
  ): ComponentAndProps<DateTimeCellExternalProps> => ({
    component: DateTimeCell,
    props: getProps(column),
  }),
  getInput: (
    column: DateLikeColumn,
  ): ComponentAndProps<
    Omit<DateTimeCellExternalProps, 'formatForDisplay'>
  > => ({
    component: DateTimeInput,
    props: {
      ...getProps(column),
      allowRelativePresets: true,
    },
  }),
  getDisplayFormatter(column: DateLikeColumn): CellValueFormatter<string> {
    return getProps(column).formatForDisplay;
  },
};

export default stringType;
