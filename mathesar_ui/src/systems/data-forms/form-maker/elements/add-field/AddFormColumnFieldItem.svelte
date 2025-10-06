<script lang="ts">
  import type { Readable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

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

  $: ({ column, abstractType } = fieldColumn);

  /**
   * This is somewhat crude, but it works okay in most circumstances. Ideally
   * the front end should have an easy (and opaque) way to determine whether
   * it's appropriate to INSERT into a column. For example, if the column has a
   * dynamic value set to be the result of a sequence, then we don't want to
   * manually supply a value when inserting because it will mess up the
   * sequence. But even non-PK column can have sequence-based default. And PK
   * column can also have non-sequence dynamic defaults where inserting would
   * theoretically be safe (e.g. UUID). It would be nice to improve this logic
   * at some point via some accompanying backend work.
   */
  $: isDynamicPk = column.default?.is_dynamic && column.primary_key;
  $: columnAlreadyAdded = $parentHasColumn;
  $: disabled = columnAlreadyAdded || isDynamicPk;
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
            {:else if isDynamicPk}
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
