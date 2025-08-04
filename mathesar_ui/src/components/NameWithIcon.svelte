<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import {
    Icon,
    Spinner,
    Truncate,
    makeStyleStringFromCssVariables,
  } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  interface $$Props extends ComponentProps<Truncate> {
    icon: IconProps | IconProps[];
    name?: string;
    isLoading?: boolean;
    iconHasBox?: boolean;
    truncate?: boolean;
    bold?: boolean;
    cssVariables?: Record<string, string>;
  }

  /** TODO: Update component and prop names */
  export let icon: $$Props['icon'];
  export let name: $$Props['name'] = undefined;
  export let isLoading = false;
  /** When true, the icon will be rendered within a box */
  export let iconHasBox = false;
  export let truncate = true;
  export let bold = false;
  export let cssVariables: $$Props['cssVariables'] = undefined;

  $: style = cssVariables
    ? makeStyleStringFromCssVariables(cssVariables)
    : undefined;
  $: icons = Array.isArray(icon) ? icon : [icon];
</script>

<Truncate {...$$restProps} passthrough={!truncate}>
  <span
    class="name-with-icon"
    on:click
    class:boxed={iconHasBox}
    class:bold
    {style}
  >
    <span class="icon" style="white-space: nowrap">
      {#if isLoading}
        <Spinner />
      {:else}
        {#each icons as innerIcon}
          <Icon size="min(1em, 0.75em + 0.25rem)" {...innerIcon} />
        {/each}
      {/if}
    </span>&nbsp;<span class="name">
      {#if name}
        {name}
      {:else}
        <slot />
      {/if}
    </span>
  </span>
</Truncate>

<style lang="scss">
  .name-with-icon {
    text-decoration: inherit;
  }
  .name-with-icon.bold {
    font-weight: var(--font-weight-medium);
  }
  .icon {
    color: var(--icon-color, var(--text-icon, currentcolor));
    opacity: var(--NameWithIcon__icon-opacity, 0.75);
    vertical-align: bottom;
  }
  .icon > :global(.fa-icon + .fa-icon) {
    margin-left: 0.2em;
  }
  .name-with-icon.boxed .icon {
    display: inline-flex;
    border-radius: 0.25em;
    padding: 0.2em;
    background: var(--icon-color, var(--text-icon, currentcolor));
    vertical-align: -10%;
  }
  .name-with-icon.boxed .icon > :global(svg) {
    color: var(--text-inverted);
  }
  .name {
    color: var(--name-color, currentcolor);
    vertical-align: bottom;
  }
</style>
