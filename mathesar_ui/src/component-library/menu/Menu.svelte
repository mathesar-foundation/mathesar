<script lang="ts">
  import {
    makeStyleStringFromCssVariables,
    mergeStyleStrings,
  } from '@mathesar-component-library-dir/common/utils/styleUtils';
  import type { CssVariablesObj } from '@mathesar-component-library-dir/types';
  import { setMenuAlignmentStoresInContext } from './utils';

  export let style: string | undefined = undefined;
  export let iconWidth = '1em';
  export let controlWidth = '1em';
  export let cssVariables: CssVariablesObj | undefined = undefined;

  $: styleStringFromCssVariables = cssVariables
    ? makeStyleStringFromCssVariables(cssVariables)
    : '';
  $: styleString = mergeStyleStrings(
    makeStyleStringFromCssVariables({
      '--Menu__icon-width': iconWidth,
      '--Menu__control-width': controlWidth,
    }),
    styleStringFromCssVariables,
    style,
  );

  const menuAlignmentStores = setMenuAlignmentStoresInContext();
  $: ({ hasIcon, hasControl } = menuAlignmentStores);
</script>

<div
  class="menu"
  role="menu"
  class:has-icon={$hasIcon}
  class:has-control={$hasControl}
  style={styleString}
>
  <slot />
</div>
