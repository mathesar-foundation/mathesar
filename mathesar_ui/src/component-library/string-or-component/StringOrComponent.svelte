<!--
  @component

  @deprecated in favor of `Render` which accepts `ComponentWithProps` for better
  type safety in comparing a component to its props.
-->
<script lang="ts">
  import {
    hasProperty,
    isDefinedObject,
  } from '@mathesar-component-library-dir/common/utils/typeUtils';
  import type { ComponentAndProps } from '@mathesar-component-library-dir/types';

  export let arg: string | string[] | ComponentAndProps;

  $: props =
    hasProperty(arg, 'props') && isDefinedObject(arg.props) ? arg.props : {};
</script>

{#if typeof arg === 'string'}
  {arg}
{:else if Array.isArray(arg)}
  {#each arg as paragraph}
    <p>{paragraph}</p>
  {/each}
{:else}
  <svelte:component this={arg.component} {...props} />
{/if}
