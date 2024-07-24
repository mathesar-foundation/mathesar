<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Database } from '@mathesar/api/rpc/databases';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconAddNew } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { databasesStore } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    AddConnectionModal,
    ConnectionsEmptyState,
  } from '@mathesar/systems/connections';
  import { Button, Icon } from '@mathesar-component-library';

  const addConnectionModalController = modal.spawnModalController();

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
  <title>{makeSimplePageTitle($_('connections'))}</title>
</svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--page-padding': '0',
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
  }}
>
  <div data-identifier="connections-header">
    <span>
      {$_('database_connections')}
      {#if $databases.size}({$databases.size}){/if}
    </span>
  </div>

  <section data-identifier="connections-container">
    {#if $databases.size === 0}
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
          {#if filteredDatabases.length}
            <div data-identifier="connections-list-grid">
              <table>
                <thead>
                  <tr>
                    <th>{$_('database_name')}</th>
                    {#if isSuperUser}
                      <th>{$_('actions')}</th>
                    {/if}
                  </tr>
                </thead>
                <tbody>
                  {#each filteredDatabases as database (database.id)}
                    <!-- <ConnectionRow {connection} /> -->
                    {database.name}
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

    [data-identifier='connections-list-grid'] {
      border: 1px solid var(--slate-200);
      border-radius: var(--border-radius-m);
      overflow: auto;

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
