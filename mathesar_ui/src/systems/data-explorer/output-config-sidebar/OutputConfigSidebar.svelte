<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    Spinner,
    Button,
    LabeledInput,
    TextInput,
    Icon,
  } from '@mathesar-component-library';
  import { iconDeleteMajor } from '@mathesar/icons';
  import type QueryManager from '../QueryManager';

  export let queryManager: QueryManager;

  $: ({ selection, query, state, inputColumns, processedColumns } =
    queryManager);
  $: ({ inputColumnsFetchState } = $state);
  $: ({ inputColumnInformationMap } = $inputColumns);
  $: ({ selectedCells, columnsSelectedWhenTheTableIsEmpty } = selection);
  $: selectedColumns = (() => {
    const ids = selection.getSelectedUniqueColumnsId(
      $selectedCells,
      $columnsSelectedWhenTheTableIsEmpty,
    );
    const columns = [];
    for (const id of ids) {
      const c = $processedColumns.get(id);
      if (c !== undefined) {
        columns.push(c);
      }
    }
    return columns;
  })();
  $: hasMultipleSelectedColumns = selectedColumns.length > 1;
  $: selectedColumn =
    selectedColumns.length > 0 ? selectedColumns[0] : undefined;
  $: initialColumn = selectedColumn
    ? $query.getColumn(selectedColumn.column.alias)
    : undefined;
  $: columnInformation = initialColumn
    ? inputColumnInformationMap.get(initialColumn.id)
    : undefined;

  let timer: number;

  onDestroy(() => {
    window.clearTimeout(timer);
  });

  function deleteSelectedColumn() {
    if (selectedColumn) {
      const { alias } = selectedColumn.column;
      void queryManager.update((q) => q.withoutColumn(alias));
      queryManager.clearSelectedColumn();
    }
  }

  function updateName(value: string) {
    window.clearTimeout(timer);
    if (selectedColumn && value !== selectedColumn.column.display_name) {
      const { alias } = selectedColumn.column;
      void queryManager.update((q) => q.withDisplayNameForColumn(alias, value));
    }
  }

  function onNameChange(e: Event) {
    const element = e.target as HTMLInputElement;
    updateName(element.value);
  }

  function onNameInput(e: Event) {
    window.clearTimeout(timer);
    const element = e.target as HTMLInputElement;
    timer = window.setTimeout(() => {
      updateName(element.value);
    }, 500);
  }
</script>

<aside>
  {#if selectedColumn}
    <section data-identifier="column-properties-pane">
      <header>Column Properties</header>
      {#if hasMultipleSelectedColumns}
        <div>
          {selectedColumns.length} columns selected
        </div>
      {:else}
        <div>
          <LabeledInput layout="stacked">
            <h4 slot="label">Display name</h4>
            <TextInput
              value={selectedColumn.column.display_name}
              on:input={onNameInput}
              on:change={onNameChange}
            />
          </LabeledInput>
          <div data-identifier="column-source">
            <h4>Source</h4>
            <div>
              {#if inputColumnsFetchState?.state === 'success'}
                {#if columnInformation}
                  <div class="column-info">
                    <div>Table:</div>
                    <div>{columnInformation.tableName}</div>
                    <div>Column:</div>
                    <div>{columnInformation.name}</div>
                  </div>
                {:else}
                  <div>Column is auto-generated through a transformation</div>
                {/if}
              {:else if inputColumnsFetchState?.state === 'processing'}
                <Spinner />
              {:else if inputColumnsFetchState?.state === 'failure'}
                Failed to load column information
              {/if}
            </div>
          </div>
          <div>
            <Button on:click={deleteSelectedColumn}>
              <Icon {...iconDeleteMajor} />
              <span>Delete column</span>
            </Button>
          </div>
        </div>
      {/if}
    </section>
  {/if}
</aside>

<style lang="scss">
  aside {
    width: 24rem;
    border-left: 1px solid var(--color-gray-medium);
    flex-shrink: 0;
    flex-grow: 0;
    flex-basis: 24rem;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    isolation: isolate;

    > section {
      > header {
        font-weight: 500;
        padding: 1rem;
        background: var(--color-gray-light);
        border-bottom: 1px solid var(--color-gray-medium);
        position: sticky;
        top: 0;
        z-index: 1;
      }
      > :global(div) {
        padding: 1rem 1rem 1.25rem;
      }
      > div {
        border-bottom: 1px solid var(--color-gray-medium);
        h4 {
          margin: 0;
          padding: 0;
          font-weight: 500;
        }

        > :global(div + div) {
          margin-top: 0.75rem;
        }

        [data-identifier='column-source'] {
          h4 {
            margin-bottom: 0.5rem;
          }
          .column-info {
            display: grid;
            grid-template-columns: 5rem auto;
            grid-gap: 0.5rem;
          }
        }
      }
    }
  }
</style>
