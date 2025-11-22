<script lang="ts">
  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';
  import type { ComponentAndProps } from '@mathesar-component-library-dir/types';

  export let label: string | ComponentAndProps | undefined = undefined;
</script>

<div class="menu-heading" {...$$restProps}>
  <slot>
    {#if label}
      <StringOrComponent arg={label} />
    {/if}
  </slot>
</div>
