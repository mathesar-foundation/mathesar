<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Database } from '@mathesar/api/rpc/databases';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconConnection } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { databasesStore } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    ConnectDatabaseModal,
    DatabasesEmptyState,
  } from '@mathesar/systems/databases';
  import { Button, Icon } from '@mathesar-component-library';

  import DatabaseRow from './DatabaseRow.svelte';

  const connectDbModalController = modal.spawnModalController();

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;
  $: isSuperUser = userProfile?.isSuperUser;

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

<svelte:head>
  <title>{makeSimplePageTitle($_('databases'))}</title>
</svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--page-padding': '0',
    '--layout-background-color': 'var(--sand-100)',
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
    '--AppSecondaryHeader__padding': 'var(--size-x-large) 0',
  }}
>
  <div data-identifier="databases-header">
    <span>
      {$_('databases')}
      {#if $databases.size}({$databases.size}){/if}
    </span>
  </div>

  <section data-identifier="databases-container">
    {#if $databases.size === 0}
      <DatabasesEmptyState />
    {:else}
      <EntityContainerWithFilterBar
        searchPlaceholder={$_('search_databases')}
        bind:searchQuery={filterQuery}
        on:clear={handleClearFilterQuery}
      >
        <svelte:fragment slot="action">
          {#if isSuperUser}
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
            <div data-identifier="databases-list-grid">
              {#each filteredDatabases as database (database.id)}
                <DatabaseRow {database} />
              {/each}
            </div>
          {/if}
        </svelte:fragment>
      </EntityContainerWithFilterBar>
    {/if}
  </section>
</LayoutWithHeader>

<ConnectDatabaseModal controller={connectDbModalController} />

<style lang="scss">
  [data-identifier='databases-header'] {
    display: flex;
    padding: var(--size-x-large);
    align-items: center;

    span {
      flex: 1 0 0;
      color: var(--slate-800);
      font-size: var(--size-x-large);
      font-weight: 600;
    }
  }

  [data-identifier='databases-container'] {
    display: flex;
    padding: var(--size-x-large);
    flex-direction: column;
    align-items: stretch;
    gap: var(--size-x-small);
  }

  [data-identifier='databases-list-grid'] {
    display: grid;
    gap: 1rem;
    margin-top: var(--size-x-large);
  }
</style>
