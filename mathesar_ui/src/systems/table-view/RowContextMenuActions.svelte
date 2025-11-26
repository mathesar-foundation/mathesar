<script lang="ts">
  import { _ } from "svelte-i18n";
  import {
    iconDeleteMajor,
    iconDuplicateMajor,
    iconLinkToRecordPage,
    iconModalRecordView
  } from "@mathesar/icons";

  import { toast } from "@mathesar/stores/toast";
  import { confirmDelete } from "@mathesar/stores/confirmation";
  import { storeToGetRecordPageUrl } from "@mathesar/stores/storeBasedUrls";
  import RecordStore from "@mathesar/systems/record-view/RecordStore";
  import { currentTablesMap } from "@mathesar/stores/tables";
  import { modalRecordViewContext } from "@mathesar/systems/record-view-modal/modalRecordViewContext";
  import { extractPrimaryKeyValue } from "@mathesar/stores/table-data";

  // Props coming from Row.svelte
  export let selectedRowIds: Set<string>;
  export let recordsData;
  export let table;
  export let columns;
  export let canDeleteRecords: boolean;

  const modalRecordView = modalRecordViewContext.get();

  $: selectedRowCount = selectedRowIds.size;

  // compute recordId only for single selection
  $: recordId = (() => {
    if (selectedRowCount !== 1) return undefined;

    const id = [...selectedRowIds][0];
    const row = recordsData.selectableRowsMap.get(id);
    if (!row) return undefined;

    try {
      return extractPrimaryKeyValue(row.record, columns);
    } catch (_) {
      return undefined;
    }
  })();

  $: recordPageLink = recordId
    ? storeToGetRecordPageUrl({
        tableId: table.oid,
        recordId
      })
    : undefined;

  function quickViewRecord() {
    if (!modalRecordView || recordId === undefined) return;

    const containingTable = currentTablesMap.get(table.oid);
    if (!containingTable) return;

    const recordStore = new RecordStore({
      table: containingTable,
      recordPk: String(recordId)
    });

    modalRecordView.open(recordStore);
  }

  async function handleDuplicateRecords() {
    const count = selectedRowCount;
    if (count === 0) return;

    try {
      await recordsData.duplicateSelected(selectedRowIds);
      toast.success({
        title: $_("count_records_duplicated_successfully", {
          values: { count }
        })
      });
    } catch (e) {
      toast.fromError(e);
    }
  }

  async function handleDeleteRecords() {
    const count = selectedRowCount;
    if (count === 0) return;

    confirmDelete({
      identifierType: $_("multiple_records", { values: { count } }),
      body: [
        $_("deleted_records_cannot_be_recovered", { values: { count } }),
        $_("are_you_sure_to_proceed")
      ],
      onProceed: () => recordsData.deleteSelected(selectedRowIds),
      onError: (e) => toast.fromError(e),
      onSuccess: (count) => {
        toast.success({
          title: $_("count_records_deleted_successfully", {
            values: { count }
          })
        });
      }
    });
  }
</script>

<!-- Headless: only triggers + labels, no wrapper DOM -->
<slot
  name="quickView"
  let:actionQuickView={quickViewRecord}
  let:recordPageLink={recordPageLink}
  let:recordId={recordId}
></slot>

<slot
  name="openRecord"
  let:recordPageLink={recordPageLink}
  let:recordId={recordId}
></slot>

<slot
  name="duplicate"
  let:actionDuplicate={handleDuplicateRecords}
  let:selectedRowCount={selectedRowCount}
></slot>

<slot
  name="delete"
  let:actionDelete={handleDeleteRecords}
  let:canDeleteRecords={canDeleteRecords}
  let:selectedRowCount={selectedRowCount}
></slot>

