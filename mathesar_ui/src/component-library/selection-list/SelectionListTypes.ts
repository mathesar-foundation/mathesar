import type { BaseInputProps } from '@mathesar-component-library-dir/common/base-components/BaseInputTypes';
import type { LabelGetter } from '@mathesar-component-library-dir/common/utils/formatUtils';
import type { ListBoxProps } from '@mathesar-component-library-dir/list-box/ListBoxTypes';

export interface SelectionListProps<Option> extends BaseInputProps {
  options: Option[];
  value?: Option;
  labelKey?: string;
  getLabel?: LabelGetter<Option | undefined>;
  class?: string;
  valuesAreEqual?: ListBoxProps<Option | undefined>['checkEquality'];
  /**
   * When options change and the selected value is either undefined or
   * not present in the options array, autoSelect determines how to
   * choose the selected option.
   *
   * first: Selects the first option from the options array.
   * clear: Sets selected value to undefined.
   * none: Disables auto select. Current value stays as it is.
   */
  autoSelect?: 'first' | 'clear' | 'none';
  offsetOnFocus?: number;
}
