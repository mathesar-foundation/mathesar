<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Column } from '@mathesar/api/rpc/columns';
  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import { AbstractTypeControl } from '@mathesar/components/abstract-type-control';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import {
    iconAutomaticallyAdded,
    iconChangeAToB,
    iconPrimaryKey,
  } from '@mathesar/icons';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import {
    Checkbox,
    Dropdown,
    TextInput,
    Tooltip,
  } from '@mathesar-component-library';

  import { RESERVED_ID_COLUMN_NAME } from './importPreviewPageUtils';

  export let isLoading = false;
  export let renamedIdColumn: string | undefined = undefined;

  export let processedColumn: {
    column: Column;
    abstractType: AbstractType;
  };
  export let selected: boolean;
  export let displayName: string;
  export let updateTypeRelatedOptions: (options: Column) => Promise<unknown>;
  /**
   * True when Mathesar automatically added this column as part of the import
   * process
   */
  export let isAutoAdded = false;

  $: ({ column } = processedColumn);
  $: isPk = column.primary_key;
  $: disabled = isPk || isLoading;
  $: isColumnRenamed = renamedIdColumn === processedColumn.column.name;

  // TODO: Also validate with other column names
  function checkAndSetNameIfEmpty() {
    if (displayName.trim() === '') {
      displayName = column.name;
    }
  }
</script>

<div class="column">
  <div class="pk-indicator">
    {#if isPk}
      <Tooltip allowHover placements={['top', 'bottom']}>
        <span slot="trigger"><Icon {...iconPrimaryKey} /></span>
        <p slot="content">{$_('pk_indicator_help_text')}</p>
      </Tooltip>
    {/if}
    {#if isAutoAdded}
      <Tooltip allowHover placements={['top', 'bottom']}>
        <span slot="trigger"><Icon {...iconAutomaticallyAdded} /></span>
        <p slot="content">{$_('auto_added_indicator_help_text')}</p>
      </Tooltip>
    {/if}
    {#if isColumnRenamed}
      <Tooltip allowHover placements={['top', 'bottom']}>
        <span slot="trigger" class="id-rename">
          {RESERVED_ID_COLUMN_NAME}
          <Icon {...iconChangeAToB} />
          {renamedIdColumn}
        </span>
        <p slot="content">
          {$_('id_column_has_been_renamed', {
            values: {
              renamedIdColumn,
            },
          })}
        </p>
      </Tooltip>
    {/if}
  </div>
  <div class="column-name">
    <Checkbox bind:checked={selected} {disabled} />
    <TextInput
      disabled={isLoading}
      bind:value={displayName}
      on:blur={checkAndSetNameIfEmpty}
    />
  </div>
  <Dropdown {disabled} triggerClass="column-type" triggerAppearance="plain">
    <NameWithIcon slot="trigger" icon={processedColumn.abstractType.getIcon()}>
      {processedColumn.abstractType.name}
    </NameWithIcon>
    <div slot="content" class="type-options-content" let:close>
      <AbstractTypeControl
        column={{
          ...processedColumn.column,
          abstractType: processedColumn.abstractType,
        }}
        showWarnings={false}
        on:cancel={close}
        save={async (opts) => {
          await updateTypeRelatedOptions({
            ...processedColumn.column,
            ...opts,
          });
          close();
        }}
      />
    </div>
  </Dropdown>
</div>

<style lang="scss">
  .column {
    flex-grow: 1;
    position: relative;
    align-self: flex-end;

    > :global(.column-type) {
      height: 2.2rem;
      width: 100%;
    }

    > .column-name {
      height: 3rem;
      padding: 0.35rem 0.6rem;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--slate-200);

      :global(.checkbox) {
        flex-grow: 0;
        flex-shrink: 0;
        margin-right: 0.5rem;
      }
    }
  }

  .id-rename {
    font-size: var(--size-small);
  }

  .type-options-content {
    min-width: 18rem;
    max-width: 22rem;
    padding: var(--size-small);
  }

  .pk-indicator {
    color: var(--slate-400);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }
</style>
