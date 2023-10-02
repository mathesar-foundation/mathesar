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
  import { isSuccessfullyConnectedDatabase } from '@mathesar/utils/preloadData';
  import DatabaseConnectionSkeleton from './DatabaseConnectionSkeleton.svelte';
  import { makeSimplePageTitle } from '../pageTitleUtils';
  import DatabaseConnectionItem from './DatabaseConnectionItem.svelte';

  let filterQuery = '';

  $: isPreloaded = $databases.preload;
  $: connections = $databases.data;
  $: connectionsStatus = $databases.state;
  $: connectionsError = $databases.error;

  function filterConnections(_connections: Database[], query: string) {
    function isMatch(connection: Database, q: string) {
      if (!isSuccessfullyConnectedDatabase(connection)) {
        return connection.name.toLowerCase().includes(q);
      }
      return (
        connection.name.toLowerCase().includes(q) ||
        connection.db_name.toLowerCase().includes(q)
      );
    }
    return _connections.filter((connection) => {
      if (query) {
        const sanitizedQuery = query.trim().toLowerCase();
        return isMatch(connection, sanitizedQuery);
      }
      return true;
    });
  }

  function handleClearFilterQuery() {
    filterQuery = '';
  }

  $: filteredConnections = filterConnections(connections ?? [], filterQuery);
  $: filteredConnectionsCountText = filteredConnections.length
    ? `(${filteredConnections.length})`
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

<h1>Database Connections {filteredConnectionsCountText}</h1>

<section class="connections-list-container">
  {#if connectionsStatus === States.Loading && !isPreloaded}
    <DatabaseConnectionSkeleton />
  {:else if connectionsStatus === States.Done || isPreloaded}
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
          {labeledCount(filteredConnections, 'results')}
          for all database connections matching <strong>{filterQuery}</strong>
        </p>
      </slot>
      <slot slot="content">
        {#if filteredConnections.length}
          <div class="connection-list">
            {#each filteredConnections as connection (connection.id)}
              <DatabaseConnectionItem database={connection} />
            {/each}
          </div>
        {:else if connections.length === 0}
          <p class="no-connections-found-text">No database connection found</p>
        {/if}
      </slot>
    </EntityContainerWithFilterBar>
  {:else if connectionsStatus === States.Error}
    <ErrorBox>
      <p>Error: {connectionsError}</p>
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
