<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    Spinner,
    Button,
    LabeledInput,
    TextInput,
    Icon,
  } from '@mathesar-component-library';
  import { slide } from 'svelte/transition';
  import { iconDelete } from '@mathesar/icons';
  import type QueryManager from '../QueryManager';
  import type InputColumnsManager from '../InputColumnsManager';

  export let queryManager: QueryManager;
  export let inputColumnsManager: InputColumnsManager;

  $: ({ selectedColumnAlias, query } = queryManager);
  $: ({ inputColumns } = inputColumnsManager);
  $: ({ requestStatus, columnInformationMap } = $inputColumns);

  $: initialColumn = $selectedColumnAlias
    ? $query.getColumn($selectedColumnAlias)
    : undefined;
  $: columnInformation = initialColumn
    ? columnInformationMap.get(initialColumn.id)
    : undefined;

  let timer: number;

  onDestroy(() => {
    window.clearTimeout(timer);
  });

  function deleteSelectedColumn() {
    const alias = $selectedColumnAlias;
    if (alias) {
      void queryManager.update((q) => q.withoutColumn(alias));
      queryManager.clearSelectedColumn();
    }
  }

  function updateName(value: string) {
    window.clearTimeout(timer);
    if (initialColumn && value !== initialColumn.display_name) {
      const { alias } = initialColumn;
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
  {#if initialColumn}
    <section
      data-identifier="column-properties-pane"
      transition:slide|local={{ duration: 160 }}
    >
      <header>Column Properties</header>
      <div>
        <LabeledInput layout="stacked">
          <h4 slot="label">Display name</h4>
          <TextInput
            value={initialColumn.display_name}
            on:input={onNameInput}
            on:change={onNameChange}
          />
        </LabeledInput>
        <div data-identifier="column-source">
          <h4>Source</h4>
          <div>
            {#if requestStatus.state === 'success'}
              {#if columnInformation}
                <div>Table:</div>
                <div>{columnInformation.tableName}</div>
                <div>Column:</div>
                <div>{columnInformation.name}</div>
              {/if}
            {:else if requestStatus.state === 'processing'}
              <Spinner />
            {:else if requestStatus.state === 'failure'}
              Failed to load column information
            {/if}
          </div>
        </div>
        <div>
          <Button on:click={deleteSelectedColumn}>
            <Icon {...iconDelete} />
            <span>Delete column</span>
          </Button>
        </div>
      </div>
    </section>
  {/if}
  <section>
    <header>Transformations</header>
    <div>
      <i>Yet to be implemented</i>
    </div>
  </section>
</aside>

<style lang="scss">
  aside {
    width: 22rem;
    border-left: 1px solid #efefef;
    flex-shrink: 0;
    flex-grow: 0;
    flex-basis: 22rem;
    display: flex;
    flex-direction: column;
    overflow: auto;

    > section {
      > header {
        font-weight: 500;
        padding: 0.5rem 0.75rem;
        background: #f7f8f8;
        border-bottom: 1px solid #efefef;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      > div {
        padding: 0.75rem 0.75rem 1.2rem;
        border-bottom: 1px solid #efefef;

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
            margin-bottom: 0.25rem;
          }
          > div {
            display: grid;
            grid-template-columns: 5rem auto;
            grid-gap: 0.24rem;
          }
        }
      }
    }
  }
</style>
