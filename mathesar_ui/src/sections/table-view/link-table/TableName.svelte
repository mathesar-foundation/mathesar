<script lang="ts">
  import Identifier from '@mathesar/components/Identifier.svelte';

  export let name = '';
  export let which: 'this' | 'that' | 'mapping';
</script>

<span
  class="table-name"
  class:this={which === 'this'}
  class:that={which === 'that'}
  class:mapping={which === 'mapping'}
>
  <Identifier>{name}</Identifier>
</span>

<style>
  .table-name {
    border-radius: 0.2em;
    padding: 0 0.2em;
  }
  .this {
    background: var(--this-table-color);
  }
  .that {
    background: var(--that-table-color);
  }
  .mapping {
    background: var(--mapping-table-color);
  }
</style>
