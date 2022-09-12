<script lang="ts">
  import { Button, Icon } from '@mathesar/component-library';
  import { iconEdit } from '@mathesar/icons';
  import type { ProcessedColumn } from '@mathesar/stores/table-data/types';
  import { UnhandledError } from '@mathesar/utils/errors';
  import AbstractTypeConfiguration from '../../header/header-cell/abstract-type-configuration/AbstractTypeConfiguration.svelte';

  export let column: ProcessedColumn;

  let mode: 'read' | 'edit' = 'read';
  function toggleMode(): undefined {
    switch (mode) {
      case 'read':
        mode = 'edit';
        break;
      case 'edit':
        mode = 'read';
        break;
      default:
        throw new UnhandledError(mode, 'ColumnType');
    }
    return undefined;
  }
</script>

{#if mode === 'read'}
  <Button class="type-switch" appearance="plain" on:click={toggleMode}>
    <span>{column.abstractType.name}</span>
    <Icon size="0.7em" {...iconEdit} />
  </Button>
{:else}
  <AbstractTypeConfiguration
    processedColumn={column}
    abstractType={column.abstractType}
    on:close={toggleMode}
  />
{/if}
