<script lang="ts">
  import type { Readable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import { ButtonMenuItem, Tooltip } from '@mathesar-component-library';

  export let processedColumn: ProcessedColumn;
  export let parentHasColumn: Readable<boolean>;

  $: isDynamic = processedColumn.column.default?.is_dynamic;
  $: columnAlreadyAdded = $parentHasColumn;
  $: disabled = columnAlreadyAdded || isDynamic;
</script>

<ButtonMenuItem {disabled} on:click>
  {#if disabled}
    <Tooltip placements={['right', 'left']}>
      <div slot="trigger">
        <ProcessedColumnName {processedColumn} truncate={false} />
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
    <ProcessedColumnName {processedColumn} truncate={false} />
  {/if}
</ButtonMenuItem>
