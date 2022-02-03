import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import type {
  IconFlip,
  IconRotate,
} from '@mathesar-component-library-dir/types';

export interface IconDetails {
  data: IconDefinition;
  spin?: boolean;
  flip?: IconFlip;
  rotate?: IconRotate;
}

export interface ButtonDetails {
  label: string;
  icon: IconDetails;
}
