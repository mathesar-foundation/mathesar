<script lang="ts">
  import { Spinner, Button } from '@mathesar-component-library';
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

  function deleteSelectedColumn() {
    const alias = $selectedColumnAlias;
    if (alias) {
      void queryManager.update((q) => q.deleteColumn(alias));
      queryManager.clearSelectedColumn();
    }
  }
</script>

<aside>
  <div>Exploration output</div>
  <div>
    {#if $selectedColumnAlias}
      <div>
        <div>Column Properties</div>
        <div>
          <div>Display name</div>
          <div />
          <div>
            {#if requestStatus.state === 'success'}
              Details
              {#if columnInformation}
                {columnInformation.name}
                {columnInformation.tableName}
              {/if}
            {:else if requestStatus.state === 'processing'}
              <Spinner />
            {:else if requestStatus.state === 'failure'}
              Failed to load column information
            {/if}
          </div>
          <div>
            <Button on:click={deleteSelectedColumn}>Delete column</Button>
          </div>
        </div>
      </div>
    {/if}
    <div>Transformations</div>
  </div>
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
  }
</style>
