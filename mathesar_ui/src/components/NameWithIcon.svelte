<script lang="ts">
  import { Icon, Spinner } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  export let icon: IconProps;
  export let isLoading = false;
  /** When true, the icon will be rendered within a box */
  export let iconHasBox = false;
</script>

<span class="name-with-icon" on:click class:boxed={iconHasBox}>
  <span class="icon">
    {#if isLoading}
      <Spinner />
    {:else}
      <Icon {...icon} />
    {/if}
  </span>
  <span class="name"><slot /></span>
</span>

<style>
  .name-with-icon {
    display: inline-flex;
    align-items: center;
    text-decoration: inherit;
    overflow: hidden;
    max-width: 100%;
  }

  .icon {
    flex: 0 0 auto;
    display: inline-block;
    margin-right: 0.4em;
    /**
     * This component gets used in headings and other places where the text is
     * larger. But having the icon scale linearly with the text produces an icon
     * that looks a bit too big. This function below gives a 1rem icon when the
     * font size is 1rem. As the text gets bigger, the icon gets bigger too, but
     * not quite as big as the text.
     */
    height: min(1em, 0.75em + 0.25rem);
    color: var(--icon-color, currentcolor);
    opacity: var(--icon-opacity, 0.75);
  }
  .name-with-icon.boxed .icon {
    height: 1.2em;
    border-radius: 0.25em;
    padding: 0.2em;
    background: var(--icon-color, currentcolor);
  }
  .name-with-icon.boxed .icon > :global(svg) {
    color: var(--white);
  }
  .icon > :global(svg) {
    display: block;
    height: 100%;
    width: 100%;
  }
  .name {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--name-color, var(--slate-400));
  }
</style>
