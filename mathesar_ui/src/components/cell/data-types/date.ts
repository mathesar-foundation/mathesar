import type { DateDisplayOptions } from '@mathesar/api/tables/columns';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import {
  DateTimeFormatter,
  DateTimeSpecification,
} from '@mathesar/utils/date-time';
import type { DateCellExternalProps } from './components/typeDefinitions';
import type { CellComponentFactory, CellColumnLike } from './typeDefinitions';
import DateTimeCell from './components/date-time/DateTimeCell.svelte';
import DateTimeInput from './components/date-time/DateTimeInput.svelte';

export interface DateLikeColumn extends CellColumnLike {
  display_options: Partial<DateDisplayOptions> | null;
}

function getProps(column: DateLikeColumn): DateCellExternalProps {
  const displayOptions = column.display_options ?? {};
  const format = displayOptions.format ?? 'none';
  const specification = new DateTimeSpecification({
    type: 'date',
    dateFormat: format,
  });
  return {
    dateFormattingString: specification.getFormattingString(),
    formatter: new DateTimeFormatter(specification),
  };
}

const stringType: CellComponentFactory = {
  get: (column: DateLikeColumn): ComponentAndProps<DateCellExternalProps> => ({
    component: DateTimeCell,
    props: getProps(column),
  }),
  getInput: (
    column: DateLikeColumn,
  ): ComponentAndProps<DateCellExternalProps> => ({
    component: DateTimeInput,
    props: getProps(column),
  }),
};

export default stringType;
