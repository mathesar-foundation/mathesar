<script lang="ts">
  import { Icon, Spinner } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  export let icon: IconProps;
  export let isLoading = false;
</script>

<span class="name-with-icon">
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
    display: inline-block;
    margin-right: 0.4em;
    /**
     * This component gets used in headings and other places where the text is
     * larger. But having the icon scale linearly with the text produces an icon
     * that looks a bit too big. This function below gives a 1rem icon when the
     * font size is 1rem. As the text gets bigger, the icon gets bigger too, but
     * not quite as big as the text.
     */
    height: min(1em, 0.7em + 0.1rem);
    color: var(--icon-color, current-color);
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
  }
</style>
