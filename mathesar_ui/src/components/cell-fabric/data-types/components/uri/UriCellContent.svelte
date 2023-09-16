<script lang="ts">
  export let isActive = false;
  export let value: string | null | undefined;

  $: htmlPropsForHref =
    isActive && value ? { href: value, target: '_blank' } : {};
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<a
  {...htmlPropsForHref}
  class:link={isActive}
  style:pointer-events={isActive ? 'auto' : 'none'}
>
  <slot />
</a>

<style>
  a {
    text-decoration: underline;
  }
  .link {
    color: var(--sky-700);
  }
  .link:visited {
    color: var(--purple-500);
  }
</style>
