<script lang="ts">
  import TableName from '@mathesar/components/TableName.svelte';
  import { storeToGetTablePageUrl } from '@mathesar/stores/storeBasedUrls';
  import type { TableLink } from './utils';

  export let link: TableLink;

  $: tableId = link.table.id;
  $: href = $storeToGetTablePageUrl({ tableId });
</script>

<a class="passthrough link-item-container" {href}>
  <span class="table-name">
    <TableName table={link.table} truncate={false} />
  </span>
  <span class="sub-text">Linked via <strong>{link.column.name}</strong></span>
</a>

<style lang="scss">
  .link-item-container {
    border: 1px solid var(--slate-300);
    background-color: var(--white);
    padding: 0.5rem;
    border-radius: var(--border-radius-m);
    cursor: pointer;
    display: flex;
    flex-direction: column;

    &:hover {
      background: var(--slate-100);
      .table-name {
        text-decoration: underline;
      }
    }

    > :global(* + *) {
      margin-top: 0.25rem;
    }

    .sub-text {
      font-size: var(--text-size-small);
    }
  }
</style>
