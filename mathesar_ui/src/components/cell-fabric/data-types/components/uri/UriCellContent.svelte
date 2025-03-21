<script lang="ts">
  export let isActive = false;
  export let value: string | null | undefined;
  $: isExternalUri =
    value?.toLowerCase().startsWith('http://') ||
    value?.toLowerCase().startsWith('https://');
  $: htmlPropsForHref =
    isActive && value ? { href: value, target: '_blank' } : {};
  $: htmlPropsForNonLink = value ? { href: null, target: '_blank' } : {};
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<a
  {...isExternalUri ? htmlPropsForHref : htmlPropsForNonLink}
  class:link={isActive && isExternalUri}
  class:external-uri={isExternalUri}
  style:pointer-events={isActive ? 'auto' : 'none'}
>
  <slot />
</a>

<style>
  .external-uri {
    text-decoration: underline;
  }
  .link {
    color: var(--sky-700);
  }
  .link:visited {
    color: var(--purple-500);
  }
</style>
