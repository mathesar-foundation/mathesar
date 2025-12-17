<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type {
    ColumnsDataStore,
    ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import {
    CancelOrProceedButtonPair,
    TextArea,
    TextInput,
  } from '@mathesar-component-library';

  export let column: ProcessedColumn;
  export let columnsDataStore: ColumnsDataStore;
  export let currentRoleOwnsTable: boolean;

  $: ({ columns } = columnsDataStore);

  let isEditing = false;
  let name = '';
  let description = '';
  let isSubmitting = false;

  $: liveColumn =
    $columns.find((c) => c.id === column.column.id) ?? column.column;

  $: if (!isEditing) {
    name = liveColumn.name;
    description = liveColumn.description ?? '';
  }

  $: validationErrors = (() => {
    if (name === liveColumn.name) return [];
    if (!name) return [$_('column_name_cannot_be_empty')];
    if ($columns.some((c) => c.name === name)) return [$_('column_name_already_exists')];
    return [];
  })();

  $: hasChanges =
    name !== liveColumn.name || description !== (liveColumn.description ?? '');
  $: canSave = !validationErrors.length && hasChanges;

  async function save() {
    if (!canSave) return;
    isSubmitting = true;
    try {
      await columnsDataStore.patch({
        id: column.column.id,
        name,
        description,
      });
      isEditing = false;
    } catch (error) {
      toast.error(`${$_('unable_to_update_column')} ${getErrorMessage(error)}`);
    } finally {
      isSubmitting = false;
    }
  }

  function cancel() {
    name = liveColumn.name;
    description = liveColumn.description ?? '';
    isEditing = false;
  }
</script>

<div class="container">
  <div class="column-property column-name">
    <span class="label">{$_('column_name')}</span>
    <TextInput
      bind:value={name}
      on:focus={() => {
        if (currentRoleOwnsTable) isEditing = true;
      }}
      disabled={!currentRoleOwnsTable}
    />
    {#if isEditing}
      {#each validationErrors as error}
        <span class="error">{error}</span>
      {/each}
    {/if}
  </div>

  <div class="column-property column-description">
    <span class="label">{$_('column_description')}</span>
    <TextArea
      bind:value={description}
      on:focus={() => {
        if (currentRoleOwnsTable) isEditing = true;
      }}
      disabled={!currentRoleOwnsTable}
    />
  </div>

  {#if isEditing}
    <CancelOrProceedButtonPair
      onProceed={save}
      onCancel={cancel}
      isProcessing={isSubmitting}
      canProceed={canSave}
      proceedButton={{ label: $_('save') }}
      size="small"
    />
  {/if}
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .column-property {
    display: flex;
    flex-direction: column;

    .label {
      color: var(--color-fg-label);
    }

    > :global(* + *) {
      margin-top: 0.25rem;
    }
  }

  .error {
    color: var(--color-fg-danger);
    font-size: var(--sm2);
  }
</style>
