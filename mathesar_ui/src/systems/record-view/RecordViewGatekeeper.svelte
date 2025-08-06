<script lang="ts">
  import { _ } from 'svelte-i18n';

  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import type RecordStore from '@mathesar/systems/record-view/RecordStore';

  import RecordViewLoadingSpinner from './RecordViewLoadingSpinner.svelte';

  export let record: RecordStore;

  $: ({ table, tableStructure } = record);
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: canViewTable = $currentRolePrivileges.has('SELECT');
  $: tableStructureIsLoading = tableStructure.isLoading;
  $: recordStoreFetchRequest = record.fetchRequest;
  $: recordStoreIsLoading = $recordStoreFetchRequest?.state === 'processing';
  $: isLoading = $tableStructureIsLoading || recordStoreIsLoading;
</script>

{#if isLoading}
  <RecordViewLoadingSpinner />
{:else if canViewTable}
  <slot />
{:else}
  <div class="no-access">
    <WarningBox fullWidth>
      {$_('no_privileges_view_record')}
    </WarningBox>
  </div>
{/if}

<style>
  .no-access {
    padding: 1rem;
  }
</style>
