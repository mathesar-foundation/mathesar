<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Button,
    Dropdown,
    TextInput,
    Icon,
    LabeledInput,
  } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import { iconAddNew } from '@mathesar/icons';
  import ColumnTypeSelector from './ColumnTypeSelector.svelte';

  const dispatch = createEventDispatcher();
  export let columns: Column[];

  let columnName = '';
  let columnType: string | undefined;

  $: isDuplicateColumn = columns?.some(
    (column) => column.name.toLowerCase() === columnName?.toLowerCase(),
  );

  function clearValues() {
    columnName = '';
    columnType = undefined;
  }

  function addColumn() {
    const newColumn = {
      name: columnName,
      type: columnType,
      nullable: true,
      primary_key: false,
    };
    dispatch('addColumn', newColumn);
  }
</script>

<Dropdown
  closeOnInnerClick={false}
  triggerAppearance="secondary"
  showArrow={false}
  ariaLabel="New Column"
  on:close={clearValues}
>
  <svelte:fragment slot="trigger">
    <Icon class="opt" {...iconAddNew} size="0.9em" />
  </svelte:fragment>
  <div slot="content" class="new-column-dropdown">
    <LabeledInput label="Column Name" layout="stacked">
      <TextInput bind:value={columnName} />
    </LabeledInput>
    <ColumnTypeSelector bind:value={columnType} />
    <Button
      appearance="primary"
      disabled={!columnName?.trim() || isDuplicateColumn}
      on:click={() => addColumn()}
    >
      Add
    </Button>
    {#if isDuplicateColumn}
      <p class="messages">
        <strong>Warning!</strong> The column name must be unique.
      </p>
    {/if}
  </div>
</Dropdown>

<style lang="scss">
  .new-column-dropdown {
    padding: 0.5em;
    overflow: hidden;

    .messages {
      color: darkred;
      font-style: italic;

      strong {
        font-weight: bold;
        font-style: normal;
      }
    }
  }
</style>
