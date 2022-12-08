<script lang="ts">
  import { Icon, Spinner, Truncate } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  /** TODO: Update component and prop names */
  export let icon: IconProps | IconProps[];
  export let isLoading = false;
  /** When true, the icon will be rendered within a box */
  export let iconHasBox = false;
  export let truncate = true;

  $: icons = Array.isArray(icon) ? icon : [icon];
</script>

<Truncate passthrough={!truncate}>
  <span class="name-with-icon" on:click class:boxed={iconHasBox}>
    <span class="icon">
      {#if isLoading}
        <Spinner />
      {:else}
        {#each icons as icon}
          <Icon {...icon} size="min(1em, 0.75em + 0.25rem)" />
        {/each}
      {/if}
    </span>
    <span class="name"><slot /></span>
  </span>
</Truncate>

<style lang="scss">
  .name-with-icon {
    text-decoration: inherit;
  }
  .icon {
    color: var(--icon-color, currentcolor);
    opacity: var(--icon-opacity, 0.75);
  }
  .icon > :global(.fa-icon + .fa-icon) {
    margin-left: 0.2em;
  }
  .name-with-icon.boxed .icon {
    display: inline-flex;
    height: 1.2em;
    border-radius: 0.25em;
    padding: 0.2em;
    background: var(--icon-color, currentcolor);
    vertical-align: -10%;
  }
  .name-with-icon.boxed .icon > :global(svg) {
    color: var(--white);
  }
  .name {
    color: var(--name-color, var(--slate-800));
  }
</style>
