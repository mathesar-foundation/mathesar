<script lang="ts">
  import type { Readable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { columnDefaultAllowsInsertion } from '@mathesar/api/rpc/columns';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import {
    ButtonMenuItem,
    Icon,
    Tooltip,
    iconSuccess,
    iconWarning,
  } from '@mathesar-component-library';

  import type { FieldColumn } from '../../data-form-utilities/fields';

  export let fieldColumn: FieldColumn;
  export let parentHasColumn: Readable<boolean>;

  $: ({ column } = fieldColumn);

  $: canInsert = columnDefaultAllowsInsertion(column);
  $: columnAlreadyAdded = $parentHasColumn;
  $: disabled = columnAlreadyAdded || !canInsert;
</script>

<ButtonMenuItem {disabled} on:click>
  <div class="item">
    <div class="name">
      <ColumnName
        column={{
          ...column,
          constraintsType: fieldColumn.foreignKeyLink ? ['foreignkey'] : [],
        }}
        truncate={false}
      />
    </div>

    {#if disabled}
      <div class="tooltip">
        <Tooltip placements={['right', 'left']}>
          <Icon
            slot="trigger"
            {...columnAlreadyAdded ? iconSuccess : iconWarning}
          />

          <div slot="content">
            {#if columnAlreadyAdded}
              {$_('cannot_add_field_column_is_already_added')}
            {:else if !canInsert}
              {$_('cannot_add_field_column_value_is_dynamic_pk')}
            {/if}
          </div>
        </Tooltip>
      </div>
    {/if}
  </div>
</ButtonMenuItem>

<style lang="scss">
  .item {
    display: flex;

    .name {
      flex-grow: 1;
    }

    .tooltip {
      margin-left: auto;
    }
  }
</style>
