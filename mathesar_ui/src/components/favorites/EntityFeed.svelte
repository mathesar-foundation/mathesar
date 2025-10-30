<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import { Button, Icon, Skeleton } from '@mathesar-component-library';
  import {
    iconRemoveFromFavorites,
    iconAddToFavorites,
    iconClock,
  } from '@mathesar/icons';
  import type {
    FavoriteItem,
    RecentItem,
    EntityType,
  } from '@mathesar/stores/favorites';
  import EntityCard from './EntityCard.svelte';

  export let items: Array<{
    item: FavoriteItem | RecentItem;
    entityName: string;
    databaseName: string;
    schemaName?: string;
  }>;
  export let type: 'favorites' | 'recents';
  export let loading = false;
  export let error: string | null = null;
  export let onRetry: (() => void) | undefined = undefined;
  export let onRemoveItem:
    | ((
        entityType: EntityType,
        entityId: number,
        databaseId: number,
      ) => Promise<void>)
    | undefined = undefined;

  let isProcessing = false;

  $: uiConfig =
    type === 'favorites'
      ? {
          feedIcon: iconRemoveFromFavorites,
          emptyIcon: iconAddToFavorites,
          feedTitle: $_('favorites'),
          emptyTitle: $_('no_favorites_yet'),
          emptyDescription: $_('no_favorites_description'),
          clearButtonText: $_('clear_favorites'),
        }
      : {
          feedIcon: iconClock,
          emptyIcon: iconClock,
          feedTitle: $_('recent'),
          emptyTitle: $_('no_recent_items'),
          emptyDescription: $_('no_recent_items_description'),
          clearButtonText: $_('clear_recents'),
        };

  async function handleRemoveItem(
    event: CustomEvent<{
      entityType: EntityType;
      entityId: number;
      databaseId: number;
    }>,
  ) {
    if (!onRemoveItem) return;

    const { entityType, entityId, databaseId } = event.detail;
    isProcessing = true;

    try {
      await onRemoveItem(entityType, entityId, databaseId);
    } catch (error) {
      console.error(`Failed to remove ${type.slice(0, -1)}:`, error);
    } finally {
      isProcessing = false;
    }
  }
</script>

<div class="entity-feed">
  <div class="feed-header">
    <div class="title-section">
      <h2 class="feed-title">
        <Icon {...uiConfig.feedIcon} />
        {uiConfig.feedTitle}
      </h2>
    </div>
  </div>

  <div class="feed-content">
    {#if loading}
      <div class="loading-state">
        {#each Array(3) as _}
          <div class="skeleton-card">
            <Skeleton />
          </div>
        {/each}
      </div>
    {:else if error}
      <div class="error-state">
        <p class="error-message">{error}</p>
        {#if onRetry}
          <Button on:click={onRetry}>
            {$_('retry')}
          </Button>
        {/if}
      </div>
    {:else if items.length === 0}
      <div class="empty-state">
        <h3>{uiConfig.emptyTitle}</h3>
        <p>{uiConfig.emptyDescription}</p>
      </div>
    {:else}
      <div class="cards-list" class:processing={isProcessing}>
        {#each items as { item, entityName, databaseName, schemaName }, index (`${type}-${item.entityType}-${item.entityId}-${item.databaseId}-${item.schemaOid}`)}
          <div
            class="card-wrapper"
            in:fade={{ duration: 120 }}
            out:fade={{ duration: 100 }}
            animate:flip={{ duration: 200 }}
          >
            <EntityCard
              {item}
              {entityName}
              {databaseName}
              {schemaName}
              type={type === 'favorites' ? 'favorite' : 'recent'}
              on:remove={handleRemoveItem}
            />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .entity-feed {
    display: flex;
    flex-direction: column;
  }

  .feed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .feed-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-text-dark);
  }

  .feed-content {
    margin-top: var(--lg1);
  }

  .empty-state {
    text-align: center;
    padding: var(--lg2) var(--sm2);
    color: var(--color-gray-dark);

    h3 {
      margin: 1rem 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 500;
    }

    p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }
  }

  .cards-list {
    display: flex;
    flex-direction: column;
    gap: var(--sm4);
  }
</style>
