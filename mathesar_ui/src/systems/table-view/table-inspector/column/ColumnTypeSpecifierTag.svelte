<script lang="ts">
  import { _ } from 'svelte-i18n';

  import TableName from '@mathesar/components/TableName.svelte';
  import { iconConstraint } from '@mathesar/icons';
  import { storeToGetTablePageUrl } from '@mathesar/stores/storeBasedUrls';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import { currentTablesData } from '@mathesar/stores/tables';
  import { Icon, iconExternalLink } from '@mathesar-component-library';

  export let type: 'primaryKey' | 'foreignKey';
  export let column: ProcessedColumn;

  $: linkedTableId = column.linkFk?.referent_table_oid;
  $: linkedTable = linkedTableId
    ? $currentTablesData.tablesMap.get(linkedTableId)
    : undefined;
</script>

<div class="specifier-tag-container">
  {#if type === 'foreignKey' && linkedTable}
    <div class="fk-container">
      <span>{$_('linked_to')}</span>
      <a
        class="specifier-tag"
        href={$storeToGetTablePageUrl({ tableId: linkedTableId })}
      >
        <TableName table={linkedTable} />
        <Icon {...iconExternalLink} />
      </a>
    </div>
  {:else if type === 'primaryKey'}
    <div class="specifier-tag">
      <Icon {...iconConstraint} />
      <span>{$_('primary_key')}</span>
    </div>
  {/if}
</div>

<style lang="scss">
  .specifier-tag-container {
    display: flex;
  }
  .fk-container {
    display: flex;
    align-items: center;

    > :global(* + *) {
      margin-left: 0.5rem;
    }

    a {
      display: flex;
      align-items: center;
      color: inherit;
      text-decoration: none;

      > :global(* + *) {
        margin-left: 0.5rem;
      }
    }
  }
  .specifier-tag {
    border-radius: var(--border-radius-xl);
    background-color: var(--stormy-100);
    padding: 0.228rem 0.571rem;
    font-size: var(--text-size-small);
    color: var(--text-color-primary);
    font-weight: var(--font-weight-bold);

    :global(body.theme-dark) & {
      background-color: var(--stormy-800);
      border: 1px solid var(--stormy-600);
      color: var(--text-color-secondary);
    }
  }
</style>
