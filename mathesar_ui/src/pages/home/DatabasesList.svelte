<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconConnection } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import { highlightNewItems } from '@mathesar/packages/new-item-highlighter';
  import { databasesStore } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { ConnectDatabaseModal } from '@mathesar/systems/databases';
  import { Button, Icon } from '@mathesar-component-library';

  import DatabaseRow from './DatabaseRow.svelte';

  const connectDbModalController = modal.spawnModalController();

  const userProfileStore = getUserProfileStoreFromContext();
  $: ({ isMathesarAdmin } = $userProfileStore);

  let filterQuery = '';

  $: ({ databases } = databasesStore);

  function filterDatabases(allDatabases: Database[], query: string) {
    if (!query) return allDatabases;
    const sanitizedQuery = query.trim().toLowerCase();
    const match = (t: string) => t.toLowerCase().includes(sanitizedQuery);
    return allDatabases.filter((d) => match(d.name));
  }

  function handleClearFilterQuery() {
    filterQuery = '';
  }

  $: filteredDatabases = filterDatabases([...$databases.values()], filterQuery);
</script>

<div class="databases-list">
  <div class="databases-header">
    <span>{$_('databases')}</span>
  </div>

  <section class="databases-container">
    <EntityContainerWithFilterBar
      searchPlaceholder={$_('search_databases')}
      bind:searchQuery={filterQuery}
      on:clear={handleClearFilterQuery}
    >
      <svelte:fragment slot="action">
        {#if isMathesarAdmin}
          <Button
            appearance="primary"
            on:click={() => connectDbModalController.open()}
          >
            <Icon {...iconConnection} />
            <span>{$_('connect_database')}</span>
          </Button>
        {/if}
      </svelte:fragment>

      <span slot="resultInfo">
        <RichText
          text={$_('databases_matching_search', {
            values: {
              count: filteredDatabases.length,
            },
          })}
          let:slotName
        >
          {#if slotName === 'searchValue'}
            <strong>{filterQuery}</strong>
          {/if}
        </RichText>
      </span>

      <svelte:fragment slot="content">
        {#if filteredDatabases.length}
          <div
            class="databases-list-grid"
            use:highlightNewItems={{
              scrollHint: $_('database_new_items_scroll_hint'),
            }}
          >
            {#each filteredDatabases as database (database.id)}
              <DatabaseRow {database} />
            {/each}
          </div>
        {/if}
      </svelte:fragment>
    </EntityContainerWithFilterBar>
  </section>
</div>

<ConnectDatabaseModal controller={connectDbModalController} />

<style lang="scss">
  .databases-list {
    padding: var(--size-xx-large) var(--size-x-large);
  }

  .databases-header {
    display: flex;
    align-items: center;

    span {
      flex: 1 0 0;
      color: var(--slate-900);
      font-size: var(--text-size-ultra-large);
      font-weight: var(--font-weight-medium);
    }
  }

  .databases-container {
    display: flex;
    margin-top: var(--size-x-large);
    flex-direction: column;
    align-items: stretch;
    gap: var(--size-x-small);
  }

  .databases-list-grid {
    display: grid;
    gap: 1rem;
    margin-top: var(--size-x-large);
  }
</style>
