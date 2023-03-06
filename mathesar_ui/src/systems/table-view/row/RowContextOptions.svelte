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

  export let row: RecordRow;
  export let recordId: number;
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
      void confirmDelete({
        identifierType: 'Row',
        onProceed: () => recordsData.deleteSelected([Number(row.rowIndex)]),
        onError: (e) => toast.fromError(e),
        onSuccess: () =>
          toast.success({
            title: 'Row deleted successfully!',
          }),
      });
    }
  }
</script>

<LinkMenuItem
  href={$storeToGetRecordPageUrl({ recordId }) || ''}
  icon={iconExternalLink}
>
  Go to Record Page
</LinkMenuItem>
{#if canEditTableRecords}
  <ButtonMenuItem on:click={handleDeleteRecords} danger icon={iconDeleteMajor}>
    Delete Record
  </ButtonMenuItem>
{/if}
