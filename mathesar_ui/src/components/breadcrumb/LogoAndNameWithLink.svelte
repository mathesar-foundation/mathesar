<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Logo from '../Logo.svelte';

  export let href: string;
  export let compactLayout = false;
</script>

<a {href} class="home-link" class:compact={compactLayout}>
  <Logo />
  <div class="mathesar">{$_('mathesar')}</div>
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
    margin-left: 0.25rem;
  }
  .home-link.compact .mathesar {
    display: none;
  }
</style>
