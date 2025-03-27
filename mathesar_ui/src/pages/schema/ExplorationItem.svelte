<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconExploration, iconExpandRight } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getExplorationPageUrl } from '@mathesar/routes/urls';
  import { currentTablesData as tablesStore } from '@mathesar/stores/tables';
  import { Icon } from '@mathesar-component-library';

  export let exploration: SavedExploration;
  export let database: Database;
  export let schema: Schema;

  $: baseTable = $tablesStore.tablesMap.get(exploration.base_table_oid);
</script>

<a
  class="link-container"
  href={getExplorationPageUrl(database.id, schema.oid, exploration.id)}
>
  <div class="content">
    <div class="title-and-meta">
      <div class="title-container">
        <div class="icon-container">
          <Icon {...iconExploration} size="0.875rem" class="exploration-icon" />
        </div>
        <span class="name">{exploration.name}</span>
      </div>
    </div>
    {#if baseTable}
      <div class="detail">
        <span>{$_('based_on')}</span>
        <TableName table={baseTable} />
      </div>
    {/if}
  </div>
  <div class="caret-container">
    <Icon {...iconExpandRight} size="0.875rem" class="caret-icon" />
  </div>
</a>

<style lang="scss">
  .link-container {
    position: relative;
    text-decoration: none;
    color: inherit;
    padding: 0.5rem 0.75rem;
    margin: 0 -0.75rem;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
    border-radius: var(--border-radius-m);

    &:hover {
      background-color: var(--hover-background);

      .caret-container {
        opacity: 1;
      }
    }

    &:focus {
      outline: none;
      background-color: var(--active-background);
    }
  }

  .icon-container {
    background-color: var(--icon-background);
    border-radius: 50%;
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .exploration-icon {
    color: var(--brand-500);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    flex-grow: 1;
    min-width: 0;
  }

  .title-and-meta {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .title-container {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .name {
    font-size: var(--text-size-large);
    font-weight: var(--font-weight-medium);
    color: var(--text-color-primary);
    line-height: 1.2;
    transition: color 0.2s ease;
  }

  .detail {
    font-size: var(--text-size-base);
    color: var(--text-color-secondary);
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .caret-container {
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.2s ease;
    display: flex;
    align-items: center;
  }

  .caret-icon {
    color: var(--text-color-tertiary);
  }
</style>
