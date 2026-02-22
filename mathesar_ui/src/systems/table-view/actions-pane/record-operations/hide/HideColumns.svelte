<script lang="ts">
  import { type Writable, get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import {
    HiddenColumns,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { Checkbox, LabeledInput } from '@mathesar-component-library';

  const tabularData = getTabularDataStoreFromContext();

  export let hiddenColumns: Writable<HiddenColumns>;
  $: ({ processedColumns } = $tabularData);

  $: allColumns = [...$processedColumns.values()];

  function handleCheckboxChange(columnId: string, checked: boolean) {
    hiddenColumns.update((h) =>
      checked ? h.withColumn(columnId) : h.withoutColumn(columnId),
    );
  }

  function hideAll() {
    hiddenColumns.set(new HiddenColumns(allColumns.map((c) => c.id)));
  }

  function showAll() {
    hiddenColumns.set(new HiddenColumns());
  }
</script>

<div class="hide-columns">
  <div class="header">
    <div class="links">
      <button type="button" class="link" on:click={hideAll}>
        {get(_)('hide_all')}
      </button>
      <span class="separator">|</span>
      <button type="button" class="link" on:click={showAll}>
        {get(_)('show_all')}
      </button>
    </div>
  </div>
  <div class="column-list">
    {#each allColumns as column (column.id)}
      <LabeledInput layout="inline-input-first">
        <span slot="label">
          <ProcessedColumnName processedColumn={column} />
        </span>
        <Checkbox
          checked={$hiddenColumns.has(column.id)}
          on:change={(e) => handleCheckboxChange(column.id, e.detail)}
        />
      </LabeledInput>
    {/each}
  </div>
</div>

<style lang="scss">
  .hide-columns {
    min-width: 20rem;
    padding: 0.5rem 0;

    .header {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 0.5rem 1rem;

      .links {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;

        .link {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          color: var(--color-link);
          text-decoration: underline;
          cursor: pointer;
          font-size: inherit;
          font-family: inherit;

          &:hover {
            color: var(--color-link-hover);
          }

          &:active {
            color: var(--color-link-active);
          }
        }

        .separator {
          color: var(--color-fg-subtle-2);
        }
      }
    }

    .column-list {
      padding: 0 1rem;

      :global(.labeled-input) {
        margin-bottom: 0.5rem;
      }
    }
  }
</style>
