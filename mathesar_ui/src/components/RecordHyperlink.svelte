<script lang="ts">
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import { currentTablesMap } from '@mathesar/stores/tables';
  import RecordStore from '@mathesar/systems/record-view/RecordStore';
  import { modalRecordViewContext } from '@mathesar/systems/record-view-modal/modalRecordViewContext';

  const modalRecordView = modalRecordViewContext.get();

  export let tableId: number;
  export let recordId: unknown;

  $: href = $storeToGetRecordPageUrl({ tableId, recordId });

  function handleLinkClick(e: MouseEvent) {
    if (!modalRecordView) return;
    if (recordId === undefined) return;
    const table = $currentTablesMap.get(tableId);
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
  }
</style>
