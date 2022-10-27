<script lang="ts">
  import { Icon } from '@mathesar/component-library';
  import { iconConstraint } from '@mathesar/icons';
  import {
    findFkConstraintsForColumn,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { MissingExhaustiveConditionError } from '@mathesar/utils/errors';

  export let type: 'primaryKey' | 'foreignKey';
  export let column: ProcessedColumn;

  function getLableText(): string {
    switch (type) {
      case 'primaryKey':
        return 'Primary Key';
      case 'foreignKey':
        return `Linked to ${
          findFkConstraintsForColumn(column.exclusiveConstraints, column.id)[0]
            .referent_table
        }`;
      default:
        throw new MissingExhaustiveConditionError(type, 'ColumnType');
    }
  }
</script>

<div class="container">
  <div>
    <Icon {...iconConstraint} />
    <span>{getLableText()}</span>
  </div>
</div>

<style lang="scss">
  .container {
    border-radius: var(--border-radius-xl);
    background-color: var(--slate-200);
    padding: 0.428rem 0.571rem;
    font-size: var(--text-size-small);
  }
</style>
