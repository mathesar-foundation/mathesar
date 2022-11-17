<script lang="ts">
  import { Icon, iconExternalLink } from '@mathesar/component-library';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconConstraint } from '@mathesar/icons';
  import { storeToGetTablePageUrl } from '@mathesar/stores/storeBasedUrls';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import { tables } from '@mathesar/stores/tables';
  import { MissingExhaustiveConditionError } from '@mathesar/utils/errors';

  export let type: 'primaryKey' | 'foreignKey';
  export let column: ProcessedColumn;

  $: linkedTableId = column.linkFk?.referent_table;
  $: linkedTable = linkedTableId ? $tables.data.get(linkedTableId) : undefined;
</script>

<div class="specifier-tag-container">
  {#if type === 'foreignKey' && linkedTable}
    <div class="fk-container">
      <span>Linked To</span>
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
      <span>Primary Key</span>
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
    background-color: var(--slate-200);
    padding: 0.228rem 0.571rem;
    font-size: var(--text-size-small);
  }
</style>
