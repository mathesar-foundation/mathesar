<script lang="ts">
  import { preloadCommonData } from '@mathesar/utils/preloadData';
  import { resolvedUiTheme } from '@mathesar/utils/uiThemePreference';

  import Logo from './Logo.svelte';
  import MathesarName from './MathesarName.svelte';

  export let href: string;
  export let compactLayout = false;

  const commonData = preloadCommonData();
  let failedLogoUrl: string | null = null;

  $: customLogoUrl =
    $resolvedUiTheme === 'dark' && commonData.mathesar_app_header_logo_dark_url
      ? commonData.mathesar_app_header_logo_dark_url
      : commonData.mathesar_app_header_logo_url;
  $: shouldRenderCustomLogo =
    Boolean(customLogoUrl) && failedLogoUrl !== customLogoUrl;

  function handleLogoError() {
    failedLogoUrl = customLogoUrl;
  }
</script>

<a
  {...$$restProps}
  {href}
  class="home-link"
  class:compact={compactLayout}
  aria-label={`${commonData.mathesar_instance_name} home`}
>
  {#if shouldRenderCustomLogo}
    <img
      class="custom-logo"
      src={customLogoUrl ?? ''}
      alt=""
      aria-hidden="true"
      on:error={handleLogoError}
    />
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
  .custom-logo {
    display: block;
    width: auto;
    height: 1.5rem;
    max-width: min(12rem, 24vw);
    object-fit: contain;
  }
  .mathesar {
    font-size: var(--lg2);
    font-weight: var(--font-weight-extra-bold);
    margin-left: 0.3rem;
  }
  .home-link.compact .mathesar {
    display: none;
  }
  .home-link.compact .custom-logo {
    max-width: min(7rem, 18vw);
  }
</style>
