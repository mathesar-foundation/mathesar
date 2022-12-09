<script lang="ts">
  import Errors from './Errors.svelte';
  import type { FieldStore } from './field';

  export let field: FieldStore;

  $: ({ errors, showsError } = field);
</script>

{#if $showsError}
  <Errors errors={$errors} />
{/if}
