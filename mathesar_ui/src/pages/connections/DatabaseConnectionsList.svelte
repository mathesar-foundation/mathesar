<script lang="ts">
  import { databases } from '@mathesar/stores/databases';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconAddNew, iconDatabase } from '@mathesar/icons';
  import { CONNECTIONS_URL } from '@mathesar/routes/urls';
  import type { Database } from '@mathesar/AppTypes';
  import { States } from '@mathesar/api/utils/requestUtils';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { AnchorButton, Icon } from '@mathesar/component-library';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import DatabaseConnectionSkeleton from './DatabaseConnectionSkeleton.svelte';
  import { makeSimplePageTitle } from '../pageTitleUtils';
  import DatabaseConnectionItem from './DatabaseConnectionItem.svelte';

  let filterQuery = '';

  $: allDatabases = $databases.data;
  $: databasesLoadStatus = $databases.state;
  $: databasesLoadError = $databases.error;

  function isMatch(database: Database, q: string) {
    return (
      database.nickname.toLowerCase().includes(q) ||
      database.database.toLowerCase().includes(q)
    );
  }

  function filterDatabase(_databases: Database[], query: string) {
    return _databases.filter((database) => {
      if (query) {
        const sanitizedQuery = query.trim().toLowerCase();
        return isMatch(database, sanitizedQuery);
      }
      return true;
    });
  }

  function handleClearFilterQuery() {
    filterQuery = '';
  }

  $: filteredDatabases = filterDatabase(allDatabases ?? [], filterQuery);
  $: filteredDatabasesCountText = filteredDatabases.length
    ? `(${filteredDatabases.length})`
    : '';
</script>

<svelte:head>
  <title>{makeSimplePageTitle('Database Connections')}</title>
</svelte:head>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: CONNECTIONS_URL,
    label: 'Add Database Connection',
    icon: iconDatabase,
  }}
/>

<h1>Database Connections {filteredDatabasesCountText}</h1>

<section class="connections-list-container">
  {#if databasesLoadStatus === States.Loading}
    <DatabaseConnectionSkeleton />
  {:else if databasesLoadStatus === States.Done}
    <EntityContainerWithFilterBar
      searchPlaceholder="Search Database Connections"
      bind:searchQuery={filterQuery}
      on:clear={handleClearFilterQuery}
    >
      <slot slot="action">
        <AnchorButton appearance="primary" href="/">
          <Icon {...iconAddNew} />
          <span>Add Database Connection</span>
        </AnchorButton>
      </slot>
      <slot slot="resultInfo">
        <p>
          {labeledCount(filteredDatabases, 'results')}
          for all database connections matching <strong>{filterQuery}</strong>
        </p>
      </slot>
      <slot slot="content">
        {#if filteredDatabases.length}
          <div class="connections-list">
            {#each filteredDatabases as db, index (db.id)}
              {#if index !== 0}
                <hr />
              {/if}
              <DatabaseConnectionItem database={db} />
            {/each}
          </div>
        {:else if allDatabases.length === 0}
          <p class="no-connections-found-text">No database connection found</p>
        {/if}
      </slot>
    </EntityContainerWithFilterBar>
  {:else if databasesLoadStatus === States.Error}
    <ErrorBox>
      <p>Error: {databasesLoadError}</p>
    </ErrorBox>
  {/if}
</section>

<style lang="scss">
  .connections-list-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }

  .connections-list {
    border-radius: var(--border-radius-m);
    border: 1px solid var(--slate-200);
    hr {
      border: 0;
      border-top: 1px solid var(--slate-200);
      display: block;
      margin: 0 var(--size-xx-small);
    }
  }
</style>
