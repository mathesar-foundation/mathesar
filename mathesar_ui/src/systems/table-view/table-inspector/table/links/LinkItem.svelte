<script lang="ts">
  import TableName from '@mathesar/components/TableName.svelte';
  import type { TableLink } from './utils';

  export let link: TableLink;
</script>

<div class="link-item-container">
  <TableName table={link.table} />
  <span class="sub-text">Linked via <strong>{link.column.name}</strong></span>
</div>

<style lang="scss">
  .link-item-container {
    border: 1px solid var(--slate-300);
    background-color: var(--white);
    padding: 0.5rem;
    border-radius: var(--border-radius-m);

    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.25rem;
    }

    .sub-text {
      font-size: var(--text-size-small);
    }
  }
</style>
