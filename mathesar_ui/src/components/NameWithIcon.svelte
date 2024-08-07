<script lang="ts">
  import { Icon, Spinner, Truncate } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  /** TODO: Update component and prop names */
  export let icon: IconProps | IconProps[];
  export let name: string | undefined = undefined;
  export let isLoading = false;
  /** When true, the icon will be rendered within a box */
  export let iconHasBox = false;
  export let truncate = true;
  export let bold = false;

  $: icons = Array.isArray(icon) ? icon : [icon];
</script>

<Truncate passthrough={!truncate}>
  <span class="name-with-icon" on:click class:boxed={iconHasBox} class:bold>
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
    font-weight: 500;
  }
  .icon {
    color: var(--icon-color, currentcolor);
    opacity: var(--NameWithIcon__icon-opacity, 0.75);
    vertical-align: middle;
  }
  .icon > :global(.fa-icon + .fa-icon) {
    margin-left: 0.2em;
  }
  .name-with-icon.boxed .icon {
    display: inline-flex;
    border-radius: 0.25em;
    padding: 0.2em;
    background: var(--icon-color, currentcolor);
    vertical-align: -10%;
  }
  .name-with-icon.boxed .icon > :global(svg) {
    color: var(--white);
  }
  .name {
    color: var(--name-color, currentcolor);
    vertical-align: middle;
  }
</style>
