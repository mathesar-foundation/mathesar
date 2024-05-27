<script lang="ts">
  import {
    makeStyleStringFromCssVariables,
    mergeStyleStrings,
  } from '@mathesar-component-library-dir/common/utils/styleUtils';
  import type { CssVariablesObj } from '@mathesar-component-library-dir/types';

  import { setNewMenuControllerInContext } from './MenuController';

  const controller = setNewMenuControllerInContext();
  const { hasControlColumn, hasIconColumn } = controller;

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
</script>

<div
  class="menu"
  role="menu"
  class:has-icon={$hasIconColumn}
  class:has-control={$hasControlColumn}
  style={styleString}
>
  <slot />
</div>
