<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';

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
    <div>{$_('aggregated_from')}</div>
    <div class="column-info">
      <span class="tag">
        <ColumnName
          isLoading={!aggregationColumn.name}
          column={{
            ...aggregationColumn,
            name: aggregationColumn.name ?? '',
          }}
        />
      </span>
    </div>
  </div>
{/if}

{#if source}
  <div data-identifier="column-source">
    <div>{$_('source_column')}</div>
    <div class="column-info">
      <RichText text={$_('column_from_table')} let:slotName let:translatedArg>
        {#if slotName === 'columnName'}
          <span class="tag">
            <ColumnName
              isLoading={!source.column.name}
              column={{
                ...source.column,
                name: source.column.name ?? '',
              }}
            />
          </span>
        {:else if slotName === 'fromSlot' && translatedArg}
          <span class="from">{translatedArg}</span>
        {:else if slotName === 'tableName'}
          <span class="tag">
            <TableName
              isLoading={!source.table.name}
              table={{ name: source.table.name ?? '' }}
            />
          </span>
        {/if}
      </RichText>
    </div>
  </div>
{/if}

<style lang="scss">
  [data-identifier='aggregation-source'],
  [data-identifier='column-source'] {
    margin-top: var(--sm4);

    .column-info {
      max-width: 100%;

      .tag {
        padding: var(--sm6) var(--sm2);
        background: var(--card-background);
        color: var(--text-color-secondary);
        border: 1px solid var(--card-border);
        border-radius: var(--lg1);
        font-weight: var(--font-weight-medium);
        overflow: hidden;
        max-width: 100%;
      }

      span {
        display: inline-block;
        vertical-align: middle;
      }
    }
  }
</style>
