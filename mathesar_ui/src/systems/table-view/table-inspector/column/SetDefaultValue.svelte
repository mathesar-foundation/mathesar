<script lang="ts">
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';
  import {
    getTabularDataStoreFromContext,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';

  export let column: ProcessedColumn;

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);

  async function save(value: unknown) {
    try {
      await columnsDataStore.patch(column.id, {
        default: {
          is_dynamic: !!column.column.default?.is_dynamic,
          value,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to change column display options.';
      toast.error(message);
    }
  }
</script>

<div class="default-value-container">
  <span class="label">Value</span>
  <EditableTextWithActions
    initialValue={column.column.default?.value}
    onSubmit={save}
    getValidationErrors={() => []}
    inputComponentAndProps={{
      component: DynamicInput,
      props: {
        componentAndProps: column.inputComponentAndProps,
      },
    }}
  />
</div>

<style lang="scss">
  .default-value-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
