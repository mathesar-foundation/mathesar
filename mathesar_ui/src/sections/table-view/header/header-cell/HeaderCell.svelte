<script lang="ts">
  import { getContext, tick } from 'svelte';
  import {
    faCog,
    faChevronRight,
    faChevronLeft,
  } from '@fortawesome/free-solid-svg-icons';
  import { toast } from '@mathesar/stores/toast';
  import {
    Dropdown,
    Icon,
    Button,
    TextInput,
    SpinnerArea,
  } from '@mathesar-component-library';
  import type {
    ConstraintsDataStore,
    TabularDataStore,
  } from '@mathesar/stores/table-data/types';
  import { focusAndSelectAll } from '@mathesar/utils/domUtils';
  import type {
    Meta,
    ColumnsDataStore,
  } from '@mathesar/stores/table-data/types';
  import ColumnName from '@mathesar/components/ColumnName.svelte';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import DefaultOptions from './DefaultOptions.svelte';
  import AbstractTypeConfiguration from './abstract-type-configuration/AbstractTypeConfiguration.svelte';
  import type { ProcessedTableColumn } from '../../utils';
  import ColumnResizer from './ColumnResizer.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');

  export let processedColumn: ProcessedTableColumn;
  export let meta: Meta;
  export let columnsDataStore: ColumnsDataStore;
  export let constraintsDataStore: ConstraintsDataStore;

  $: ({ column, abstractTypeOfColumn } = processedColumn);
  $: ({ display } = $tabularData);
  $: ({ columnWidths, columnPositions } = display);

  let menuIsOpen = false;
  let renamingInputElement: HTMLInputElement | undefined;
  let isRenaming = false;
  let isSubmittingRename = false;
  let newName = '';
  let view: 'default' | 'type' = 'default';

  function setDefaultView() {
    view = 'default';
  }

  function setTypeView() {
    view = 'type';
  }

  function closeMenu() {
    menuIsOpen = false;
    setDefaultView();
  }

  $: newNameValidationErrors = (() => {
    if (newName === column.name) {
      return [];
    }
    if (!newName) {
      return ['Name cannot be empty.'];
    }
    const columnNames = $columnsDataStore.columns.map((c) => c.name);
    if (columnNames.includes(newName)) {
      return ['A column with that name already exists.'];
    }
    return [];
  })();

  async function handleStartRenaming() {
    isRenaming = true;
    newName = column.name;
    await tick();
    if (renamingInputElement) {
      focusAndSelectAll(renamingInputElement);
    }
  }

  function handleCancelRename() {
    isRenaming = false;
  }

  async function submitRename({
    allowRetry,
  }: {
    /** Keep the renaming state active if we get an error. */
    allowRetry: boolean;
  }) {
    if (isSubmittingRename || !isRenaming) {
      // When the user presses Enter, the TextInput will dispatch an 'enter'
      // event as well as a 'blur' event. Since we're handling both events, we
      // need to make sure this function doesn't run twice.
      //
      // Similarly, when the user presses Esc, we need to make sure not to
      // proceed with submitting a rename operation.
      return;
    }
    if (newName === column.name) {
      isRenaming = false;
      return;
    }
    if (newNameValidationErrors.length) {
      toast.error(newNameValidationErrors.join(' '));
      if (!allowRetry) {
        isRenaming = false;
      }
      return;
    }
    try {
      isSubmittingRename = true;
      await columnsDataStore.rename(column.id, newName);
      isRenaming = false;
    } catch (error) {
      toast.error(`Unable to rename column. ${getErrorMessage(error)}`);
      if (!allowRetry) {
        isRenaming = false;
      }
    } finally {
      isSubmittingRename = false;
    }
  }

  async function handleColumnRenameInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      await submitRename({ allowRetry: true });
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  }
</script>

<div
  class="cell header-cell"
  style="
    width:{$columnWidths.get(column.id) ?? 0}px;
    left:{$columnPositions.get(column.id) ?? 0}px;
  "
>
  {#if isRenaming}
    <SpinnerArea isSpinning={isSubmittingRename} hasOverlay={false}>
      <TextInput
        bind:value={newName}
        bind:element={renamingInputElement}
        disabled={isSubmittingRename}
        hasError={!!newNameValidationErrors.length}
        aria-label="Column name"
        on:keydown={handleColumnRenameInputKeydown}
        on:blur={() => submitRename({ allowRetry: false })}
      />
    </SpinnerArea>
  {:else}
    <Dropdown
      bind:isOpen={menuIsOpen}
      triggerClass="column-opts"
      triggerAppearance="plain"
      contentClass="no-max-height column-opts-content"
      on:close={setDefaultView}
    >
      <ColumnName slot="trigger" {column} />
      <svelte:fragment slot="content">
        <div class="container">
          <div class="section type-header">
            {#if view === 'default'}
              <h6 class="category">Data Type</h6>
              <Button
                class="type-switch"
                appearance="plain"
                on:click={setTypeView}
              >
                <span>{abstractTypeOfColumn?.name}</span>
                <Icon size="0.8em" data={faCog} />
                <Icon size="0.7em" data={faChevronRight} />
              </Button>
            {:else if view === 'type'}
              <h6 class="category">
                <Button
                  size="small"
                  appearance="plain"
                  class="padding-zero"
                  on:click={setDefaultView}
                >
                  <Icon data={faChevronLeft} />
                  Go back
                </Button>
              </h6>
            {/if}
          </div>

          <div class="divider" />

          <div class="section">
            {#if view === 'default'}
              <DefaultOptions
                {meta}
                {column}
                {columnsDataStore}
                {constraintsDataStore}
                on:close={closeMenu}
                on:rename={handleStartRenaming}
              />
            {:else if view === 'type'}
              <AbstractTypeConfiguration
                {column}
                {abstractTypeOfColumn}
                on:close={closeMenu}
              />
            {/if}
          </div>
        </div></svelte:fragment
      >
    </Dropdown>
  {/if}
  <ColumnResizer columnId={column.id} />
</div>

<style global lang="scss">
  @import 'HeaderCell.scss';
</style>
