import type { LabelController } from '@mathesar-component-library-dir/label/LabelController';

export interface BaseInputProps {
  id?: string;
  labelController?: LabelController;
  disabled?: boolean;
  focusOnMount?: boolean;
}
