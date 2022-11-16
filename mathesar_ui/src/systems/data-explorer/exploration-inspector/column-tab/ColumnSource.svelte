<script lang="ts">
  import TableName from '@mathesar/components/TableName.svelte';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import type {
    ProcessedQueryResultColumn,
    ProcessedQueryResultColumnMap,
  } from '../../utils';

  export let columnInformation: ProcessedQueryResultColumn;
  export let columnsMetaData: ProcessedQueryResultColumnMap;

  function getSource(
    _columnInfo: ProcessedQueryResultColumn,
    _columnsMetaData: ProcessedQueryResultColumnMap,
  ):
    | {
        column: ProcessedQueryResultColumn['column'] & { name?: string };
        table: { name?: string };
      }
    | undefined {
    const isInitialColumn = _columnInfo.source.is_initial_column;
    if (isInitialColumn) {
      return {
        column: {
          ..._columnInfo.column,
          name: _columnInfo.source.input_column_name,
        },
        table: {
          name: _columnInfo.source.input_table_name,
        },
      };
    }
    const inputAlias = _columnInfo.source.input_alias;
    const inputColumn = _columnsMetaData.get(inputAlias);
    if (inputColumn) {
      return getSource(inputColumn, _columnsMetaData);
    }
    return undefined;
  }

  $: source = getSource(columnInformation, columnsMetaData);
  $: aggregationColumn = (() => {
    const isInitialColumn = columnInformation.source.is_initial_column;
    if (!isInitialColumn) {
      const inputAlias = columnInformation.source.input_alias;
      const inputColumn = columnsMetaData.get(inputAlias);
      if (inputColumn) {
        return {
          ...inputColumn.column,
          name: inputColumn.column.display_name,
        };
      }
    }
    return undefined;
  })();
</script>

{#if aggregationColumn}
  <div data-identifier="aggregation-source">
    <h1>Aggregated from</h1>
    <div class="column-info">
      <ColumnName
        isLoading={!aggregationColumn.name}
        column={{
          ...aggregationColumn,
          name: aggregationColumn.name ?? '',
        }}
      />
    </div>
  </div>
{/if}

{#if source}
  <div data-identifier="column-source">
    <h1>Source Column</h1>
    <div class="column-info">
      <ColumnName
        isLoading={!source.column.name}
        column={{
          ...source.column,
          name: source.column.name ?? '',
        }}
      />
      <span>from</span>
      <TableName
        isLoading={!source.table.name}
        table={{ name: source.table.name ?? '' }}
      />
    </div>
  </div>
{/if}

<style lang="scss">
  [data-identifier='aggregation-source'],
  [data-identifier='column-source'] {
    margin-top: var(--size-large);

    .column-info {
      margin-top: var(--spacing-y);

      :global(.name-with-icon) {
        padding: var(--size-extreme-small) var(--size-ultra-small);
        background: var(--slate-200);
        border-radius: var(--size-large);
        font-weight: 510;
      }

      span {
        margin: 0 var(--size-super-ultra-small);
      }

      > :global(span) {
        margin-bottom: var(--size-super-ultra-small);
      }
    }
  }
</style>
