<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
  import { DB_TYPES } from '@mathesar/stores/abstract-types/dbTypes';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { updateTable } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Select } from '@mathesar-component-library';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ table, processedColumns } = $tabularData);
  $: ({ currentRoleOwns } = table.currentAccess);

  // Filter to only user-type columns (integer columns with user_display_field set)
  $: userColumns = [...$processedColumns.values()].filter(
    (pc) =>
      pc.column.type === DB_TYPES.INTEGER &&
      pc.column.metadata?.user_display_field != null,
  );

  $: currentAttnum = table.metadata?.user_tracking_attnum ?? null;

  interface TrackingOption {
    id: number | null;
    label: string;
  }

  $: options = [
    { id: null, label: $_('none') } as TrackingOption,
    ...userColumns.map((pc) => ({
      id: pc.column.id,
      label: pc.column.name,
    })),
  ];

  $: selectedOption = options.find((o) => o.id === currentAttnum) ?? options[0];

  let saveStatus: RequestStatus | undefined;

  async function handleChange(option: TrackingOption) {
    if (option.id === currentAttnum) return;
    saveStatus = { state: 'processing' };
    try {
      await updateTable({
        schema: table.schema,
        table: {
          oid: table.oid,
          metadata: { user_tracking_attnum: option.id },
        },
      });
      if (table.metadata) {
        table.metadata = { ...table.metadata, user_tracking_attnum: option.id };
      }
      saveStatus = { state: 'success' };
    } catch (e) {
      toast.error(`${$_('unable_to_save_changes')} ${getErrorMessage(e)}`);
      saveStatus = { state: 'failure', errors: [getErrorMessage(e)] };
    }
  }
</script>

{#if userColumns.length === 0}
  <p class="no-user-columns">{$_('user_tracking_no_user_columns')}</p>
{:else}
  <Select
    {options}
    value={selectedOption}
    on:change={(e) => e.detail && handleChange(e.detail)}
    disabled={!($currentRoleOwns ?? false) ||
      saveStatus?.state === 'processing'}
    getLabel={(o) => o?.label ?? ''}
  />
{/if}

<style>
  .no-user-columns {
    color: var(--color-fg-muted);
    font-size: var(--text-size-small);
    margin: 0;
  }
</style>
