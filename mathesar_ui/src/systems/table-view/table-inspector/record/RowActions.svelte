<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconDeleteMajor, iconRecord } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    extractPrimaryKeyValue,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { takeFirstAndOnly } from '@mathesar/utils/iterUtils';
  import {
    AnchorButton,
    Button,
    Icon,
    iconExternalLink,
  } from '@mathesar-component-library';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ selection, recordsData, columnsDataStore, canDeleteRecords } =
    $tabularData);
  $: selectedRowIds = $selection.rowIds;
  $: selectedRowCount = selectedRowIds.size;

  $: ({ columns } = columnsDataStore);
  $: ({ selectableRowsMap } = recordsData);
  $: recordPageLink = (() => {
    const id = takeFirstAndOnly(selectedRowIds);
    if (!id) return undefined;
    const row = $selectableRowsMap.get(id);
    if (!row) return undefined;
    try {
      const recordId = extractPrimaryKeyValue(row.record, $columns);
      return $storeToGetRecordPageUrl({ recordId });
    } catch (e) {
      return undefined;
    }
  })();

  async function handleDeleteRecords() {
    void confirmDelete({
      identifierType: $_('multiple_records', {
        values: { count: selectedRowCount },
      }),
      body: [
        $_('deleted_records_cannot_be_recovered', {
          values: { count: selectedRowCount },
        }),
        $_('are_you_sure_to_proceed'),
      ],
      onProceed: () => recordsData.deleteSelected(selectedRowIds),
      onError: (e) => toast.fromError(e),
      onSuccess: (count) => {
        toast.success({
          title: $_('count_records_deleted_successfully', {
            values: { count },
          }),
        });
      },
    });
  }
</script>

<div class="actions-container">
  {#if recordPageLink}
    <AnchorButton href={recordPageLink} appearance="action">
      <div class="action-item">
        <div>
          <Icon {...iconRecord} />
          <span>{$_('open_record')}</span>
        </div>
        <Icon {...iconExternalLink} />
      </div>
    </AnchorButton>
  {/if}
  <Button
    on:click={handleDeleteRecords}
    disabled={!$canDeleteRecords}
    appearance="action"
  >
    <Icon {...iconDeleteMajor} />
    <span>
      {$_('delete_records', { values: { count: selectedRowCount } })}
    </span>
  </Button>
</div>

<style lang="scss">
  .actions-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }

  .action-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
