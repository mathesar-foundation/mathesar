<script lang="ts">
  import {
    ButtonMenuItem,
    iconExternalLink,
    LinkMenuItem,
  } from '@mathesar/component-library';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    RecordsData,
    rowHasRecord,
    type RecordRow,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { getRecordDeleteMessage } from '@mathesar/pages/record/recordHelp';

  export let row: RecordRow;
  export let recordPk: string;
  export let recordsData: RecordsData;

  const userProfile = getUserProfileStoreFromContext();

  $: database = $currentDatabase;
  $: schema = $currentSchema;
  $: canEditTableRecords = !!$userProfile?.hasPermission(
    { database, schema },
    'canEditTableRecords',
  );

  async function handleDeleteRecords() {
    if (rowHasRecord(row)) {
      const selectedRowIndices = [Number(row.rowIndex)];
      void confirmDelete({
        identifierType: 'Record',
        body: getRecordDeleteMessage(selectedRowIndices),
        onProceed: () => recordsData.deleteSelected(selectedRowIndices),
        onError: (e) => toast.fromError(e),
        onSuccess: () =>
          toast.success({
            title: 'Record deleted successfully!',
          }),
      });
    }
  }
</script>

{#if !recordsData.rowHasError(row)}
  <LinkMenuItem
    href={$storeToGetRecordPageUrl({ recordId: recordPk }) || ''}
    icon={iconExternalLink}
  >
    Go to Record Page
  </LinkMenuItem>
{/if}

{#if canEditTableRecords}
  <ButtonMenuItem on:click={handleDeleteRecords} icon={iconDeleteMajor}>
    Delete Record
  </ButtonMenuItem>
{/if}
