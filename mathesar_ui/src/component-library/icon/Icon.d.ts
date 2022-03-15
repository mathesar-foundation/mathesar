import type { IconDefinition } from '@fortawesome/fontawesome-common-types';

export enum IconFlip {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
  BOTH = 'both',
}

export enum IconRotate {
  NINETY = '90',
  ONE_EIGHTY = '180',
  TWO_SEVENTY = '270',
}

/**
 * NOTE:
 * This interface represents all the props listed in `Icon.svelte`.
 *
 * After https://github.com/sveltejs/language-tools/issues/442 is fixed, we
 * should hopefully be able to clean up this code duplication a bit.
 */
export interface IconProps {
  data: IconDefinition;
  size?: string;
  spin?: boolean;
  pulse?: boolean;
  flip?: IconFlip;
  rotate?: IconRotate;
  label?: string;
}
