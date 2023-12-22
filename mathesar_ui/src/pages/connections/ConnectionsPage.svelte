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
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    ConnectionsEmptyState,
    AddConnectionModal,
  } from '@mathesar/systems/connections';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import ConnectionRow from './ConnectionRow.svelte';

  const addConnectionModalController = modal.spawnModalController();

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;
  $: isSuperUser = userProfile?.isSuperUser;

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
          {#if isSuperUser}
            <Button
              appearance="primary"
              on:click={() => addConnectionModalController.open()}
            >
              <Icon {...iconAddNew} />
              <span>{$_('add_database_connection')}</span>
            </Button>
          {/if}
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
              <table>
                <thead>
                  <tr>
                    <th>{$_('connection_name')}</th>
                    <th>{$_('database_name')}</th>
                    <th>{$_('username')}</th>
                    <th>{$_('host')}</th>
                    <th>{$_('port')}</th>
                    {#if isSuperUser}
                      <th>{$_('actions')}</th>
                    {/if}
                  </tr>
                </thead>
                <tbody>
                  {#each filteredConnections as connection (connection.id)}
                    <ConnectionRow {connection} />
                  {/each}
                </tbody>
              </table>
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
    align-items: center;
    height: 100vh;

    [data-identifier='connections-list-grid'] {
      border: 1px solid var(--slate-200);
      border-radius: var(--border-radius-m);
      overflow: auto;
      max-width: 1587px;
      width: 100%;

      table {
        border-collapse: collapse;
        min-width: 100%;
      }

      thead {
        border-bottom: 1px solid var(--slate-200);
        background: var(--slate-100);

        th {
          font-weight: 500;
          padding: var(--size-xx-small) var(--size-large);
          text-align: left;
        }
      }

      tbody > :global(tr:not(first-child)) {
        border-top: 1px solid var(--slate-200);
      }
    }
  }
</style>
