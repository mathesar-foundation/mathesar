<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { faPlus } from '@fortawesome/free-solid-svg-icons';
  import {
    Button,
    Dropdown,
    TextInput,
    Icon,
    InputGroup,
    InputGroupText,
  } from '@mathesar-component-library';
  import {
    DEFAULT_ROW_RIGHT_PADDING,
    ROW_CONTROL_COLUMN_WIDTH,
  } from '@mathesar/stores/table-data';
  import type { Display } from '@mathesar/stores/table-data/types';
  import type { Column } from '@mathesar/api/tables/columns';

  const dispatch = createEventDispatcher();
  export let columns: Column[];
  export let display: Display;

  $: ({ rowWidth } = display);

  let isDropdownOpen = false;
  let columnName = '';

  $: isDuplicateColumn = columns?.some(
    (column) => column.name.toLowerCase() === columnName?.toLowerCase(),
  );

  function addColumn() {
    const newColumn = {
      name: columnName,
      // We should probably let the server decide the following
      type: 'TEXT',
      nullable: true,
      primary_key: false,
    };
    dispatch('addColumn', newColumn);
    isDropdownOpen = false;
    columnName = '';
  }
</script>

<div
  class="cell new-column"
  style="
  width:{DEFAULT_ROW_RIGHT_PADDING}px;
  left:{$rowWidth + ROW_CONTROL_COLUMN_WIDTH}px"
>
  <Dropdown
    closeOnInnerClick={false}
    contentClass="content"
    bind:isOpen={isDropdownOpen}
    triggerAppearance="plain"
    showArrow={false}
    ariaLabel="New Column"
  >
    <svelte:fragment slot="trigger">
      <span class="name">
        <Icon class="opt" data={faPlus} size="0.8em" />
      </span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <div class="new-column-dropdown" style="width:250px">
        <div class="grid">
          <InputGroup>
            <InputGroupText>Name</InputGroupText>
            <TextInput bind:value={columnName} />
          </InputGroup>
          <Button
            appearance="primary"
            disabled={!columnName?.trim() || isDuplicateColumn}
            on:click={() => addColumn()}
          >
            Add
          </Button>
        </div>
        {#if isDuplicateColumn}
          <p class="messages">
            <strong>Warning!</strong> The column name must be unique.
          </p>
        {/if}
      </div>
    </svelte:fragment>
  </Dropdown>
</div>

<style global lang="scss">
  @import 'NewColumnCell.scss';
</style>
