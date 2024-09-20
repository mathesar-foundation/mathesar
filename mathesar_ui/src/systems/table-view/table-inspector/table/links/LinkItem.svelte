<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { RichText } from '@mathesar/components/rich-text';
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
  {#if link.column}
    <span class="sub-text">
      <RichText text={$_('linked_via_column')} let:slotName>
        {#if slotName === 'columnName'}
          <strong>{link.column.name}</strong>
        {/if}
      </RichText>
    </span>
  {/if}
</a>

<style lang="scss">
  .link-item-container {
    border-left: 3px solid var(--yellow-300);
    background-color: var(--white);
    padding: 0.5rem 0.625rem;
    border-radius: 0.375rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
      background: var(--slate-50);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    > :global(* + *) {
      margin-top: 0.25rem;
    }

    .sub-text {
      font-size: var(--text-size-small);
      color: var(--color-text-muted);
    }
  }
</style>
