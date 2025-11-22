import type { IconDefinition } from '@fortawesome/fontawesome-common-types';

/**
 * NOTE:
 * This interface represents all the props listed in `Icon.svelte`.
 *
 * After https://github.com/sveltejs/language-tools/issues/442 is fixed, we
 * should hopefully be able to clean up this code duplication a bit.
 */

interface IconPath {
  path: string;
  fillRule?: 'nonzero' | 'evenodd' | 'inherit' | undefined;
  clipRule?: string;
}

export type IconPathDefinition = string | IconPath;

export interface IconProps {
  data: {
    icon: [
      IconDefinition['icon'][0],
      IconDefinition['icon'][1],
      IconDefinition['icon'][2],
      IconDefinition['icon'][3],
      IconPathDefinition | IconPathDefinition[],
    ];
  };
  size?: string;
  spin?: boolean;
  pulse?: boolean;
  flip?: 'vertical' | 'horizontal' | 'both';
  rotate?: 90 | 180 | 270;
  label?: string;
}
