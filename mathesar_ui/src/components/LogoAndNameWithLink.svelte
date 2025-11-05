<script lang="ts">
  import { preloadCommonData } from '@mathesar/utils/preloadData';

  import CustomLogo from './CustomLogo.svelte';
  import Logo from './Logo.svelte';
  import MathesarName from './MathesarName.svelte';

  export let href: string;
  export let compactLayout = false;

  const commonData = preloadCommonData();
  $: customLogoUrl = commonData.custom_logo_url;
  $: hasCustomLogo = customLogoUrl && typeof customLogoUrl === 'string' && customLogoUrl.trim() !== '';

  // Debug logging (can be removed later)
  $: if (commonData.custom_logo_url !== undefined) {
    console.log('Custom logo URL from CommonData:', commonData.custom_logo_url);
    console.log('Has custom logo:', hasCustomLogo);
  }
</script>

<a {...$$restProps} {href} class="home-link" class:compact={compactLayout}>
  {#if hasCustomLogo}
    <CustomLogo logoUrl={customLogoUrl} />
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
</style>
