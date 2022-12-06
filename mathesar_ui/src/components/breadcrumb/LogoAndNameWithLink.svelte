<script lang="ts">
  import Logo from '../Logo.svelte';

  export let href: string;
</script>

<a {href} class="home-link">
  <!-- TODO: Use the logo with white outline from Figma -->
  <Logo />
  <span class="mathesar">Mathesar</span>
</a>

<style>
  .home-link {
    display: flex;
    align-items: center;
    text-decoration: none;
  }
  .mathesar {
    display: block;
    color: var(--white);
    font-size: var(--text-size-xx-large);
    margin: 0 var(--spacing);
  }
</style>
