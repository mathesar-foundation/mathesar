<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import { isTableImportConfirmationRequired } from '@mathesar/utils/tables';
  import {
    getTablePageUrl,
    getImportPreviewPageUrl,
  } from '@mathesar/routes/urls';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import Button from '@mathesar/component-library/button/Button.svelte';
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import TableName from '@mathesar/components/TableName.svelte';

  const recordSelector = getRecordSelectorFromContext();

  export let table: TableEntry;
  export let database: Database;
  export let schema: SchemaEntry;

  function getGoToTableLink() {
    return isTableImportConfirmationRequired(table)
      ? getImportPreviewPageUrl(database.name, schema.id, table.id)
      : getTablePageUrl(database.name, schema.id, table.id);
  }
</script>

<div class="container">
  <div class="name-and-description">
    <div class="name"><TableName {table} /></div>
    <!-- <span class="description">Table description Coming Soon...</span> -->
  </div>
  <div class="actions">
    <a class="action passthrough action-link" href={getGoToTableLink()}>
      Go to Table
    </a>
    <Button
      on:click={() =>
        recordSelector.navigateToRecordPage({ tableId: table.id })}
      appearance="ghost"
      class="action"
    >
      Find Record
    </Button>
  </div>
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-l);
    max-width: 22rem;
    overflow: hidden;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }

  .name-and-description {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 1rem;

    .name {
      font-size: var(--text-size-large);
    }

    > :global(* + *) {
      margin-top: 0.75rem;
    }
  }

  .actions {
    display: flex;
    flex-direction: row;
    background-color: var(--sand-100);
    border-top: 1px solid var(--sand-200);

    :global(.action) {
      flex: 1;
      padding: 0.75rem;
      justify-content: center;

      &:first-child {
        border-right: 1px solid var(--sand-200);
        border-bottom-left-radius: var(--border-radius-l);
      }
      &:last-child {
        border-bottom-right-radius: var(--border-radius-l);
      }
      &:hover {
        background-color: var(--slate-100);
      }

      &.action-link {
        text-decoration: none;
        cursor: pointer;
        text-align: center;
      }
    }
  }
</style>
