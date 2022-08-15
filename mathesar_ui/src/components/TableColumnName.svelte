<!--
  @component 
  TableName is used to render the column name
  (with other meta data)
  specifically in the context of the Table
  hence the name `TableColumn`.
  Composes ColumnName
 -->
<script lang="ts">
  import type { ProcessedColumn } from '@mathesar/stores/table-data/processedColumns';
  import type { ConstraintType } from '@mathesar/api/tables/constraints';
  import ColumnName from './column/ColumnName.svelte';

  function getAllConstraintsTypeForColumn(
    processedColumn: ProcessedColumn,
  ): ConstraintType[] {
    return processedColumn.exclusiveConstraints.map(
      (constraint) => constraint.type,
    );
  }

  export let column: ProcessedColumn;
</script>

<ColumnName
  column={{
    ...column.column,
    constraintsType: getAllConstraintsTypeForColumn(column),
  }}
/>
