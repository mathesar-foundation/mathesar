<script lang="ts">
  import Identifier from '@mathesar/components/Identifier.svelte';

  export let identifier: string;
  export let pre: string | undefined = undefined;
  export let post: string | undefined = undefined;
</script>

{#if pre}<span>{pre}</span>{/if}<Identifier>{identifier}</Identifier
>{#if post}<span>{post}</span>{/if}
