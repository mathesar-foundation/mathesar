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
  }
  .home-link > :global(svg) {
    font-size: 2rem;
    display: block;
  }
  .mathesar {
    font-size: var(--text-size-xx-large);
    font-weight: var(--font-weight-bold);
    margin-left: 0.5rem;
  }
  .home-link.compact .mathesar {
    display: none;
  }
</style>
