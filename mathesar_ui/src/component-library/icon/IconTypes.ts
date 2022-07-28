import type { IconDefinition } from '@fortawesome/fontawesome-common-types';

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
  flip?: 'vertical' | 'horizontal' | 'both';
  rotate?: 90 | 180 | 270;
  label?: string;
}
