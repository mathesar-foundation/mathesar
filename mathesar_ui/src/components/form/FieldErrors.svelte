<script lang="ts">
  import Errors from '@mathesar/components/errors/Errors.svelte';

  import type { FieldStore } from './field';

  export let field: FieldStore;
  export let hasMargin = true;

  $: ({ errors, showsError } = field);
</script>

{#if $showsError}
  <div class="field-errors" class:has-margin={hasMargin}>
    <Errors errors={$errors} />
  </div>
{/if}

<style>
  .field-errors.has-margin {
    --MessageBox__margin: 0.5rem 0 0 0.5rem;
  }
</style>
