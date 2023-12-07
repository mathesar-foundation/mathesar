<script lang="ts">
  import { _ } from 'svelte-i18n';
  import {
    ButtonMenuItem,
    iconExternalLink,
    LinkMenuItem,
  } from '@mathesar-component-library';
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
  $: canViewLinkedEntities = !!$userProfile?.hasPermission(
    { database, schema },
    'canViewLinkedEntities',
  );

  async function handleDeleteRecords() {
    if (rowHasRecord(row)) {
      const selectedRowIndices = [Number(row.rowIndex)];
      void confirmDelete({
        identifierType: $_('record'),
        body: getRecordDeleteMessage(selectedRowIndices),
        onProceed: () => recordsData.deleteSelected(selectedRowIndices),
        onError: (e) => toast.fromError(e),
        onSuccess: () =>
          toast.success({
            title: $_('record_deleted_successfully'),
          }),
      });
    }
  }
</script>

{#if canViewLinkedEntities}
  <LinkMenuItem
    href={$storeToGetRecordPageUrl({ recordId: recordPk }) || ''}
    icon={iconExternalLink}
  >
    {$_('go_to_record_page')}
  </LinkMenuItem>
{/if}
{#if canEditTableRecords}
  <ButtonMenuItem on:click={handleDeleteRecords} icon={iconDeleteMajor}>
    {$_('delete_record')}
  </ButtonMenuItem>
{/if}
