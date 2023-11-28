<script lang="ts">
  import { databases } from '@mathesar/stores/databases';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import type { Database } from '@mathesar/AppTypes';
  import Errors from '@mathesar/components/Errors.svelte';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { AnchorButton, Icon } from '@mathesar/component-library';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import { makeSimplePageTitle } from '../pageTitleUtils';
  import ConnectionRow from './ConnectionRow.svelte';

  let filterQuery = '';

  $: allConnections = $databases.data;
  $: connectionsRequestStatus = $databases.requestStatus;

  function isMatch(connection: Database, q: string) {
    return (
      connection.nickname.toLowerCase().includes(q) ||
      connection.database.toLowerCase().includes(q)
    );
  }

  function filterConnections(_connections: Database[], query: string) {
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

  $: filteredConnections = filterConnections(allConnections ?? [], filterQuery);
</script>

<svelte:head>
  <title>{makeSimplePageTitle('Connections')}</title>
</svelte:head>

<LayoutWithHeader
  cssVariables={{
    '--page-padding': '0',
  }}
>
  <div data-identifier="connections-header">
    <span>
      Database Connections
      {#if allConnections.length}({allConnections.length}){/if}
    </span>
  </div>

  <section data-identifier="connections-container">
    {#if connectionsRequestStatus.state === 'failure'}
      <Errors errors={connectionsRequestStatus.errors} />
    {:else if allConnections.length === 0}
      No connections found
    {:else}
      <EntityContainerWithFilterBar
        searchPlaceholder="Search Database Connections"
        bind:searchQuery={filterQuery}
        on:clear={handleClearFilterQuery}
      >
        <svelte:fragment slot="action">
          <AnchorButton appearance="primary" href="/">
            <Icon {...iconAddNew} />
            <span>Add Database Connection</span>
          </AnchorButton>
        </svelte:fragment>
        <p slot="resultInfo">
          {labeledCount(filteredConnections, 'results')}
          for all database connections matching
          <strong>{filterQuery}</strong>
        </p>
        <svelte:fragment slot="content">
          {#if filteredConnections.length}
            <div data-identifier="connections-list-grid">
              <div data-identifier="connections-list-grid-header">
                <span>Connection Name</span>
                <span>Database Name</span>
                <span>Username</span>
                <span>Host</span>
                <span>Port</span>
                <span />
              </div>
              {#each filteredConnections as connection (connection.id)}
                <ConnectionRow {connection} />
              {/each}
            </div>
          {/if}
        </svelte:fragment>
      </EntityContainerWithFilterBar>
    {/if}
  </section>
</LayoutWithHeader>

<style lang="scss">
  [data-identifier='connections-header'] {
    display: flex;
    padding: var(--size-x-large);
    align-items: center;
    border-bottom: 1px solid var(--sand-200);

    span {
      flex: 1 0 0;
      color: var(--slate-800);
      font-size: var(--size-x-large);
      font-weight: 600;
    }
  }

  [data-identifier='connections-container'] {
    display: flex;
    padding: var(--size-x-large);
    flex-direction: column;
    align-items: flex-start;
    gap: var(--size-x-small);

    [data-identifier='connections-list-grid'] {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      border: 1px solid var(--slate-200);

      [data-identifier='connections-list-grid-header'] {
        display: contents;
        font-weight: 600;

        > * {
          padding: var(--size-xx-small) var(--size-large);
          background: var(--slate-100);
          border-bottom: 1px solid var(--slate-200);
        }
      }
    }
  }
</style>
