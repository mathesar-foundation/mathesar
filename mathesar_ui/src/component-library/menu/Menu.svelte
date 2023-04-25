<script lang="ts">
  import { setMenuAlignmentStoresInContext } from './utils';

  export let style: string | undefined = undefined;
  export let iconWidth = '1em';
  export let controlWidth = '1em';

  const menuAlignmentStores = setMenuAlignmentStoresInContext();
  $: ({ hasIcon, hasControl } = menuAlignmentStores);
  $: styleString = `--Menu__icon-width: ${iconWidth};--Menu__control-width: ${controlWidth};${
    style ?? ''
  }`;
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
