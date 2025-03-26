<script lang="ts">
  import { filter } from 'iter-tools';
  import { tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import DocsLink from '@mathesar/components/DocsLink.svelte';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconConnection } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import { highlightNewItems } from '@mathesar/packages/new-item-highlighter';
  import { databasesStore } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    ConnectDatabaseModal,
    DatabasesEmptyState,
  } from '@mathesar/systems/databases';
  import BulkUpgradeDatabaseModal from '@mathesar/systems/databases/upgrade-database/BulkUpgradeDatabaseModal.svelte';
  import UpgradeDatabaseModal from '@mathesar/systems/databases/upgrade-database/UpgradeDatabaseModal.svelte';
  import {
    Button,
    Help,
    Icon,
    assertExhaustive,
    filterViaTextQuery,
  } from '@mathesar-component-library';

  import DatabaseCard from './database-card/DatabaseCard.svelte';

  const connectDbModalController = modal.spawnModalController();
  const upgradeDbModalController = modal.spawnModalController<Database>();
  const bulkUpgradeDbModalController = modal.spawnModalController<Database[]>();
  const userProfileStore = getUserProfileStoreFromContext();

  let filterQuery = '';
  let highlightingEnabled = true;

  $: ({ isMathesarAdmin } = $userProfileStore);
  $: ({ databases } = databasesStore);
  $: filteredDatabases = [
    ...filterViaTextQuery($databases.values(), filterQuery, (d) => d.name),
  ];
  $: databasesNeedingUpgrade = [
    ...filter((d) => d.needsUpgradeAttention, $databases.values()),
  ];
  $: countDatabases = $databases.size;
  $: countDatabasesNeedingUpgrade = databasesNeedingUpgrade.length;
  $: needToUpgrade = (() => {
    if (countDatabasesNeedingUpgrade === 0) {
      return 'none' as const;
    }
    if (countDatabasesNeedingUpgrade === countDatabases) {
      return 'all' as const;
    }
    return 'some' as const;
  })();

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
  <h2>
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
          <div class="message-area">
            {#if needToUpgrade !== 'none'}
              <WarningBox>
                <div class="bulk-upgrade-message">
                  <div class="text trim-child-margins">
                    <p>{$_('service_upgraded_notice')}</p>
                    <p>
                      {#if needToUpgrade === 'all'}
                        {$_('upgrade_all_databases_notice')}
                      {:else if needToUpgrade === 'some'}
                        {$_('upgrade_some_databases_notice')}
                      {:else}
                        {assertExhaustive(needToUpgrade)}
                      {/if}
                    </p>
                  </div>
                  <div class="button">
                    <Button
                      on:click={() =>
                        bulkUpgradeDbModalController.open(
                          databasesNeedingUpgrade,
                        )}
                    >
                      {#if needToUpgrade === 'all'}
                        {$_('upgrade_all_databases')}
                      {:else if needToUpgrade === 'some'}
                        {$_('upgrade_remaining_databases')}
                      {:else}
                        {assertExhaustive(needToUpgrade)}
                      {/if}
                    </Button>
                  </div>
                </div>
              </WarningBox>
            {/if}
          </div>

          {#if filteredDatabases.length}
            <div
              class="databases-list-grid"
              use:highlightNewItems={{
                scrollHint: $_('database_new_items_scroll_hint'),
                enabled: highlightingEnabled,
              }}
            >
              {#each filteredDatabases as database (database.id)}
                <DatabaseCard
                  {database}
                  onTriggerUpgrade={(d) => upgradeDbModalController.open(d)}
                />
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
<BulkUpgradeDatabaseModal
  controller={bulkUpgradeDbModalController}
  refreshDatabaseList={() => databasesStore.refresh()}
/>
<UpgradeDatabaseModal
  controller={upgradeDbModalController}
  refreshDatabaseList={() => databasesStore.refresh()}
/>

<style lang="scss">
  .message-area {
    margin-bottom: 1rem;
  }
  .message-area:empty {
    display: none;
  }
  .bulk-upgrade-message {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;

    .text {
      flex: 1 1 20rem;
    }
    .button {
      flex: 0 0 auto;
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
  }

  .databases-list {
    h2 {
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
  }
</style>
