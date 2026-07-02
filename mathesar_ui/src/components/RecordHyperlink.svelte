<script lang="ts">
  import { getRecordPageUrlByTable } from '@mathesar/routes/urls';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import { databasesStore } from '@mathesar/stores/databases';
  import { getTableFromStoreOrApi } from '@mathesar/stores/tables';
  import RecordStore from '@mathesar/systems/record-view/RecordStore';
  import { modalRecordViewContext } from '@mathesar/systems/record-view-modal/modalRecordViewContext';

  const modalRecordView = modalRecordViewContext.get();

  export let tableId: number;
  export let recordId: unknown;

  const tableFetch = new AsyncStore(getTableFromStoreOrApi);

  $: database = databasesStore.currentDatabase;
  $: $database
    ? void tableFetch.run({ database: $database, tableOid: tableId })
    : tableFetch.reset();
  $: table = $tableFetch.resolvedValue;
  $: href = table ? getRecordPageUrlByTable(table, recordId) : undefined;

  function handleLinkClick(e: MouseEvent) {
    if (!modalRecordView) return;
    if (recordId === undefined) return;
    if (!table) return;
    e.preventDefault();
    e.stopPropagation();
    const recordStore = new RecordStore({ table, recordPk: String(recordId) });
    modalRecordView.open(recordStore);
  }
</script>

<a
  {href}
  class="record-hyperlink"
  on:contextmenu
  on:click={handleLinkClick}
  {...$$restProps}
>
  <slot />
</a>

<style>
  .record-hyperlink {
    display: inline-grid;
    align-items: center;
    justify-content: center;
    color: var(--color-fg-base);
  }
</style>
