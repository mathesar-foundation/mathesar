<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { ResultValue } from '@mathesar/api/rpc/records';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    type RecordRow,
    type RecordsData,
    getRowSelectionId,
    isRecordRow,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import {
    ButtonMenuItem,
    LinkMenuItem,
    iconExternalLink,
  } from '@mathesar-component-library';

  export let row: RecordRow;
  export let recordPk: ResultValue | undefined = undefined;
  export let recordsData: RecordsData;
  export let isTableEditable: boolean;

  // To be used in case of publicly shared links where user should not be able
  // to view linked tables & explorations
  const canViewLinkedEntities = true;

  async function handleDeleteRecords() {
    if (isRecordRow(row)) {
      void confirmDelete({
        identifierType: $_('record'),
        body: [
          $_('deleted_records_cannot_be_recovered', { values: { count: 1 } }),
          $_('are_you_sure_to_proceed'),
        ],
        onProceed: () => recordsData.deleteSelected(getRowSelectionId(row)),
        onError: (e) => toast.fromError(e),
        onSuccess: () =>
          toast.success({
            title: $_('record_deleted_successfully'),
          }),
      });
    }
  }
</script>

{#if recordPk && canViewLinkedEntities}
  <LinkMenuItem
    href={$storeToGetRecordPageUrl({ recordId: recordPk }) || ''}
    icon={iconExternalLink}
  >
    {$_('go_to_record_page')}
  </LinkMenuItem>
{/if}

<ButtonMenuItem
  on:click={handleDeleteRecords}
  icon={iconDeleteMajor}
  disabled={!isTableEditable}
>
  {$_('delete_records', { values: { count: 1 } })}
</ButtonMenuItem>
