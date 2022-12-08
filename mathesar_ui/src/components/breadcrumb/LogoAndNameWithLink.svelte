<script lang="ts">
  import Logo from '../Logo.svelte';

  export let href: string;
</script>

<a {href} class="home-link">
  <Logo />
  <div class="mathesar">Mathesar</div>
</a>

<style>
  .home-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: var(--white);
  }
  .home-link > :global(svg) {
    font-size: 2rem;
    display: block;
  }
  .mathesar {
    font-size: var(--text-size-xx-large);
    margin-left: 0.5rem;
  }
</style>
