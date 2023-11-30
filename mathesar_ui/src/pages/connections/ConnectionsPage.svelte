<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Button, Icon } from '@mathesar-component-library';
  import { connectionsStore } from '@mathesar/stores/databases';
  import type { Connection } from '@mathesar/api/connections';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import Errors from '@mathesar/components/Errors.svelte';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { modal } from '@mathesar/stores/modal';
  import {
    ConnectionsEmptyState,
    AddConnectionModal,
  } from '@mathesar/systems/connections';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import ConnectionRow from './ConnectionRow.svelte';

  const addConnectionModalController = modal.spawnModalController();

  let filterQuery = '';

  $: connections = connectionsStore.connections;
  $: connectionsRequestStatus = connectionsStore.requestStatus;

  function isMatch(connection: Connection, q: string) {
    return (
      connection.nickname.toLowerCase().includes(q) ||
      connection.database.toLowerCase().includes(q)
    );
  }

  function filterConnections(_connections: Connection[], query: string) {
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

  $: filteredConnections = filterConnections($connections ?? [], filterQuery);
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('connections'))}</title>
</svelte:head>

<LayoutWithHeader
  cssVariables={{
    '--page-padding': '0',
  }}
>
  <div data-identifier="connections-header">
    <span>
      {$_('database_connections')}
      {#if $connections.length}({$connections.length}){/if}
    </span>
  </div>

  <section data-identifier="connections-container">
    {#if $connectionsRequestStatus.state === 'failure'}
      <Errors errors={$connectionsRequestStatus.errors} />
    {:else if $connections.length === 0}
      <ConnectionsEmptyState />
    {:else}
      <EntityContainerWithFilterBar
        searchPlaceholder={$_('search_database_connections')}
        bind:searchQuery={filterQuery}
        on:clear={handleClearFilterQuery}
      >
        <svelte:fragment slot="action">
          <Button
            appearance="primary"
            on:click={() => addConnectionModalController.open()}
          >
            <Icon {...iconAddNew} />
            <span>{$_('add_database_connection')}</span>
          </Button>
        </svelte:fragment>

        <p slot="resultInfo">
          <RichText
            text={$_('connections_matching_search', {
              values: {
                count: filteredConnections.length,
              },
            })}
            let:slotName
          >
            {#if slotName === 'searchValue'}
              <strong>{filterQuery}</strong>
            {/if}
          </RichText>
        </p>

        <svelte:fragment slot="content">
          {#if filteredConnections.length}
            <div data-identifier="connections-list-grid">
              <div data-identifier="connections-list-grid-header">
                <span>{$_('connection_name')}</span>
                <span>{$_('database_name')}</span>
                <span>{$_('username')}</span>
                <span>{$_('host')}</span>
                <span>{$_('port')}</span>
                <span>{$_('actions')}</span>
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

<AddConnectionModal controller={addConnectionModalController} />

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
    align-items: stretch;
    gap: var(--size-x-small);

    [data-identifier='connections-list-grid'] {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      border: 1px solid var(--slate-200);
      border-radius: var(--border-radius-m);

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
