import type { BaseInputProps } from '@mathesar-component-library-dir/common/base-components/BaseInputTypes';
import type { LabelGetter } from '@mathesar-component-library-dir/common/utils/formatUtils';
import type { Appearance } from '@mathesar-component-library-dir/commonTypes';
import type { ListBoxProps } from '@mathesar-component-library-dir/list-box/ListBoxTypes';

export interface SelectProps<Option> extends BaseInputProps {
  options: Option[];
  value?: Option;
  labelKey?: string;
  getLabel?: LabelGetter<Option | undefined>;
  contentClass?: string;
  triggerClass?: string;
  class?: string;
  triggerAppearance?: Appearance;
  ariaLabel?: string;
  valuesAreEqual?: ListBoxProps<Option | undefined>['checkEquality'];
  initialSelectionType?: 'first' | 'empty';
}
