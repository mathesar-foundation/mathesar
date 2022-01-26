<script lang="ts">
  import { fade } from 'svelte/transition';

  export let loading = false;
</script>

{#if loading}
  <div class="skeleton" transition:fade={{ duration: 120 }} />
{/if}
