<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Button,
    Dropdown,
    TextInput,
    Icon,
    InputGroup,
    InputGroupText,
  } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import { iconAddNew } from '@mathesar/icons';

  const dispatch = createEventDispatcher();
  export let columns: Column[];

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

<Dropdown
  closeOnInnerClick={false}
  contentClass="content"
  bind:isOpen={isDropdownOpen}
  triggerAppearance="secondary"
  showArrow={false}
  ariaLabel="New Column"
>
  <svelte:fragment slot="trigger">
    <Icon class="opt" {...iconAddNew} size="0.75em" />
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

<style global lang="scss">
  @import 'NewColumnCell.scss';
</style>
