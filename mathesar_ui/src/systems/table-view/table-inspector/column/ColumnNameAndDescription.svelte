<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    CancelOrProceedButtonPair,
    TextArea,
    TextInput,
  } from '@mathesar-component-library';
  import type {
    ColumnsDataStore,
    ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';

  export let column: ProcessedColumn;
  export let columnsDataStore: ColumnsDataStore;
  export let currentRoleOwnsTable: boolean;

  $: ({ columns } = columnsDataStore);

  let isEditing = false;
  let name = '';
  let description = '';
  let isSubmitting = false;

  $: liveColumn = $columns.find((c) => c.id === column.column.id);
  $: columnSource = liveColumn ?? column.column;

  $: if (!isEditing && columnSource) {
    name = columnSource.name;
    description = columnSource.description ?? '';
  }

  $: validationErrors = (() => {
    if (name === column.column.name) return [];
    if (!name) return [$_('column_name_cannot_be_empty')];
    if ($columns.some((c) => c.name === name))
      return [$_('column_name_already_exists')];
    return [];
  })();

  $: canSave =
    validationErrors.length === 0 &&
    (name !== column.column.name ||
      description !== (column.column.description ?? ''));

  async function save() {
    isSubmitting = true;
    try {
      if (canSave) {
        await columnsDataStore.patch({
          id: column.column.id,
          name,
          description,
        });
      }
      isEditing = false;
    } catch (error) {
      toast.error(`${$_('unable_to_update_column')} ${getErrorMessage(error)}`);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="container">
  <div class="column-property column-name">
    <span class="label">{$_('column_name')}</span>
    <TextInput
      bind:value={name}
      on:focus={() => currentRoleOwnsTable && (isEditing = true)}
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
      on:focus={() => currentRoleOwnsTable && (isEditing = true)}
      disabled={!currentRoleOwnsTable}
    />
  </div>

  {#if isEditing}
    <div class="actions">
      <CancelOrProceedButtonPair
        onProceed={save}
        onCancel={() => (isEditing = false)}
        isProcessing={isSubmitting}
        canProceed={canSave}
        proceedButton={{ label: $_('save') }}
        size="small"
      />
    </div>
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
