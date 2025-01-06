<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconTable } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import type { Table } from '@mathesar/models/Table';
  import { highlightNewItems } from '@mathesar/packages/new-item-highlighter';
  import { modal } from '@mathesar/stores/modal';
  import TablePermissionsModal from '@mathesar/systems/table-view/table-inspector/table/TablePermissionsModal.svelte';

  import EditTableModal from './EditTableModal.svelte';
  import EmptyEntity from './EmptyEntity.svelte';
  import TableCard from './TableCard.svelte';

  const editTableModal = modal.spawnModalController();
  const tablePermissionsModal = modal.spawnModalController();

  export let tables: Table[];
  export let database: Database;
  export let schema: Schema;

  let tableForEditing: Table | undefined;
  let tableForPermissions: Table | undefined;

  function openEditTableModal(table: Table) {
    tableForEditing = table;
    editTableModal.open();
  }

  function openTablePermissionsModal(table: Table) {
    tableForPermissions = table;
    tablePermissionsModal.open();
  }
</script>

<div class="tables-list">
  {#if tables.length > 0}
    <div
      class="container"
      use:highlightNewItems={{ scrollHint: $_('table_new_items_scroll_hint') }}
    >
      {#each tables as table (table.oid)}
        <TableCard
          {table}
          {database}
          {schema}
          {openEditTableModal}
          {openTablePermissionsModal}
        />
      {/each}
    </div>
  {:else}
    <EmptyEntity icon={iconTable}>
      <p>{$_('no_tables')}</p>
    </EmptyEntity>
  {/if}
</div>

{#if tableForEditing}
  <EditTableModal controller={editTableModal} table={tableForEditing} />
{/if}

{#if tableForPermissions}
  <TablePermissionsModal
    controller={tablePermissionsModal}
    table={tableForPermissions}
  />
{/if}

<style lang="scss">
  .container {
    display: grid;
    grid-gap: 1rem;
    --minimum-item-width: 18rem;
    // align all child items to the left
  }
  @supports (width: min(var(--minimum-item-width), 100%)) {
    .container {
      grid-template-columns: repeat(
        auto-fill,
        minmax(var(--minimum-item-width), 1fr)
      );
    }
  }
</style>
