<script lang="ts">
  import { databases } from '@mathesar/stores/databases';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconAddNew, iconDatabase } from '@mathesar/icons';
  import {
    DATABASE_CONNECTION_ADD_URL,
    DATABASE_CONNECTION_LIST_URL,
  } from '@mathesar/routes/urls';
  import type { Database } from '@mathesar/AppTypes';
  import { States } from '@mathesar/api/utils/requestUtils';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { AnchorButton, Icon } from '@mathesar/component-library';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import { isSuccessfullyConnectedDatabase } from '@mathesar/utils/database';
  import DatabaseConnectionSkeleton from './DatabaseConnectionSkeleton.svelte';
  import { makeSimplePageTitle } from '../pageTitleUtils';
  import DatabaseConnectionItem from './DatabaseConnectionItem.svelte';

  let filterQuery = '';

  $: isPreloaded = $databases.preload;
  $: allDatabases = $databases.data;
  $: databasesLoadStatus = $databases.state;
  $: databasesLoadError = $databases.error;

  function filterDatabase(_databases: Database[], query: string) {
    function isMatch(database: Database, q: string) {
      if (!isSuccessfullyConnectedDatabase(database)) {
        return database.name.toLowerCase().includes(q);
      }
      return (
        database.name.toLowerCase().includes(q) ||
        database.db_name.toLowerCase().includes(q)
      );
    }
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
    href: DATABASE_CONNECTION_LIST_URL,
    label: 'Add Database Connection',
    icon: iconDatabase,
  }}
/>

<h1>Database Connections {filteredDatabasesCountText}</h1>

<section class="connections-list-container">
  {#if databasesLoadStatus === States.Loading && !isPreloaded}
    <DatabaseConnectionSkeleton />
  {:else if databasesLoadStatus === States.Done || isPreloaded}
    <EntityContainerWithFilterBar
      searchPlaceholder="Search Database Connections"
      bind:searchQuery={filterQuery}
      on:clear={handleClearFilterQuery}
    >
      <slot slot="action">
        <AnchorButton appearance="primary" href={DATABASE_CONNECTION_ADD_URL}>
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
          <div class="connection-list">
            {#each filteredDatabases as connection (connection.id)}
              <DatabaseConnectionItem database={connection} />
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
  .connection-list {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
</style>
