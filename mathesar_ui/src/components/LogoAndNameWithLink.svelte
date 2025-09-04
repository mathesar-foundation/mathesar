<script lang="ts">
  import Logo from './Logo.svelte';
  import MathesarName from './MathesarName.svelte';

  export let href: string;
  export let compactLayout = false;
</script>

<a {...$$restProps} {href} class="home-link" class:compact={compactLayout}>
  <Logo />
  <div class="mathesar"><MathesarName /></div>
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
