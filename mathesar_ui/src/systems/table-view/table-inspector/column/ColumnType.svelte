<script lang="ts">
  import { Button, Icon } from '@mathesar/component-library';
  import { iconEdit } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { ProcessedColumn } from '@mathesar/stores/table-data/types';
  import { UnhandledError } from '@mathesar/utils/errors';
  import { AbstractTypeControl } from '@mathesar/components/abstract-type-control';
  import type { ColumnTypeOptionsSaveArgs } from '@mathesar/components/abstract-type-control/types';
  import { toast } from '@mathesar/stores/toast';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);

  export let column: ProcessedColumn;

  let mode: 'read' | 'edit' = 'read';
  function toggleMode(): undefined {
    switch (mode) {
      case 'read':
        mode = 'edit';
        break;
      case 'edit':
        mode = 'read';
        break;
      default:
        throw new UnhandledError(mode, 'ColumnType');
    }
    return undefined;
  }

  async function save(columnInfo: ColumnTypeOptionsSaveArgs) {
    try {
      await columnsDataStore.patch(column.id, {
        type: columnInfo.type,
        type_options: columnInfo.type_options,
        display_options: columnInfo.display_options,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to change column type.';
      toast.error(message);
    }
  }
</script>

{#if mode === 'read'}
  <Button class="type-switch" appearance="plain" on:click={toggleMode}>
    <span>{column.abstractType.name}</span>
    <Icon size="0.7em" {...iconEdit} />
  </Button>
{:else}
  <AbstractTypeControl
    column={{
      ...column.column,
      abstractType: column.abstractType,
    }}
    {save}
    on:close={toggleMode}
  />
{/if}
