<script lang="ts">
  import { tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import DocsLink from '@mathesar/components/DocsLink.svelte';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconConnection } from '@mathesar/icons';
  import { highlightNewItems } from '@mathesar/packages/new-item-highlighter';
  import { databasesStore } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    ConnectDatabaseModal,
    DatabasesEmptyState,
  } from '@mathesar/systems/databases';
  import {
    Button,
    Help,
    Icon,
    filterViaTextQuery,
  } from '@mathesar-component-library';

  import DatabaseCard from './database-card/DatabaseCard.svelte';

  const connectDbModalController = modal.spawnModalController();
  const userProfileStore = getUserProfileStoreFromContext();

  let filterQuery = '';
  let highlightingEnabled = true;

  $: ({ isMathesarAdmin } = $userProfileStore);
  $: ({ databases } = databasesStore);
  $: filteredDatabases = [
    ...filterViaTextQuery($databases.values(), filterQuery, (d) => d.allNames),
  ];
  $: countDatabases = $databases.size;

  async function momentarilyPauseHighlighting() {
    highlightingEnabled = false;
    await tick();
    highlightingEnabled = true;
  }

  // Don't highlight items when the filter query changes
  $: filterQuery, void momentarilyPauseHighlighting();

  function handleClearFilterQuery() {
    filterQuery = '';
  }
</script>

<div class="databases-list">
  <h2 class="page-header">
    {$_('databases')}
    <Help>
      <RichText text={$_('databases_list_help')} let:slotName let:translatedArg>
        {#if slotName === 'docsLink'}
          <DocsLink page="databases">{translatedArg}</DocsLink>
        {/if}
      </RichText>
    </Help>
  </h2>

  <section class="databases-container">
    {#if countDatabases}
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

        <div class="content" slot="content">
          {#if filteredDatabases.length}
            <div
              class="databases-list-grid"
              use:highlightNewItems={{
                scrollHint: $_('database_new_items_scroll_hint'),
                enabled: highlightingEnabled,
              }}
            >
              {#each filteredDatabases as database (database.id)}
                <DatabaseCard {database} />
              {/each}
            </div>
          {/if}
        </div>
      </EntityContainerWithFilterBar>
    {:else}
      <DatabasesEmptyState />
    {/if}
  </section>
</div>

<ConnectDatabaseModal controller={connectDbModalController} />

<style lang="scss">
  .page-header {
    color: var(--color-fg-header);
  }

  .databases-container {
    display: flex;
    margin-top: var(--lg2);
    flex-direction: column;
    align-items: stretch;
    gap: var(--sm2);
  }

  .databases-list-grid {
    display: grid;
    gap: 1rem;
  }

  .databases-list {
    h2 {
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
  }
</style>
