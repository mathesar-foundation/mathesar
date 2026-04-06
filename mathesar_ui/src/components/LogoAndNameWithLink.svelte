<script lang="ts">
  import { preloadCommonData } from '@mathesar/utils/preloadData';

  import Logo from './Logo.svelte';
  import MathesarName from './MathesarName.svelte';

  const commonData = preloadCommonData();
  const { custom_logo_url } = commonData;

  export let href: string;
  export let compactLayout = false;
</script>

<a {...$$restProps} {href} class="home-link" class:compact={compactLayout}>
  {#if custom_logo_url}
    <img src={custom_logo_url} alt="Custom Logo" class="custom-logo" />
  {:else}
    <Logo />
    <div class="mathesar"><MathesarName /></div>
  {/if}
</a>

<style>
  .home-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: inherit;
    margin-right: var(--sm6);
    /* Optical adjustment to align logo with text */
    margin-top: -1px;
  }
  .home-link > :global(svg) {
    font-size: 1.5rem;
    display: block;
  }
  .mathesar {
    font-size: var(--lg2);
    font-weight: var(--font-weight-extra-bold);
    margin-left: 0.3rem;
  }
  .home-link.compact .mathesar {
    display: none;
  }
  .custom-logo {
    height: 1.5rem;
    object-fit: contain;
  }
</style>
