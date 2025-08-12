<script lang="ts">
  import type { Readable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { ButtonMenuItem, Tooltip } from '@mathesar-component-library';

  import type { FieldColumn } from '../../data-form-utilities/fields';

  export let fieldColumn: FieldColumn;
  export let parentHasColumn: Readable<boolean>;

  $: isDynamic = fieldColumn.column.default?.is_dynamic;
  $: columnAlreadyAdded = $parentHasColumn;
  $: disabled = columnAlreadyAdded || isDynamic;
</script>

<ButtonMenuItem {disabled} on:click>
  {#if disabled}
    <Tooltip placements={['right', 'left']}>
      <div slot="trigger">
        <ColumnName
          column={{
            ...fieldColumn.column,
            constraintsType: fieldColumn.foreignKeyLink ? ['foreignkey'] : [],
          }}
          truncate={false}
        />
      </div>

      <div slot="content">
        {#if columnAlreadyAdded}
          {$_('cannot_add_field_column_is_already_added')}
        {:else if isDynamic}
          {$_('cannot_add_field_column_value_is_dynamic')}
        {/if}
      </div>
    </Tooltip>
  {:else}
    <ColumnName
      column={{
        ...fieldColumn.column,
        constraintsType: fieldColumn.foreignKeyLink ? ['foreignkey'] : [],
      }}
      truncate={false}
    />
  {/if}
</ButtonMenuItem>
