<script lang="ts">
  import Logo from '../Logo.svelte';

  export let hasResponsiveAbridgement = false;
  export let href: string;
</script>

<a
  {href}
  class="home-link"
  class:has-responsive-abridgement={hasResponsiveAbridgement}
>
  <Logo />
  <div class="mathesar">Mathesar</div>
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
    font-size: var(--text-size-x-large);
    margin-left: 0.5rem;
  }
  @media (max-width: 45rem) {
    .has-responsive-abridgement .mathesar {
      display: none;
    }
  }
</style>
