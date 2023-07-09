<script lang="ts">
  export let isActive = false;
  export let value: string | null | undefined;
</script>

{#if isActive}
  <a href={value ?? ''} target="_blank" class="link">
    <slot />
  </a>
{:else}
<a href={value ?? ''} target="_blank" style="pointer-events: none;">
  <slot />
</a>
{/if}

<style>
  .content {
    text-decoration: underline;
  }
  .link {
    color: var(--sky-700);
  }
  .link:visited {
    color: var(--purple-500);
  }
</style>
