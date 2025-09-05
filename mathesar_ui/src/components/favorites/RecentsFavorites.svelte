<script lang="ts">
  import { onMount } from 'svelte';
  import {
    favoritesWithDisplay,
    recentsWithDisplay,
    favoritesLoading,
    favoritesError,
    favoritesStore,
    type EntityType,
  } from '@mathesar/stores/favorites';
  import EntityFeed from './EntityFeed.svelte';

  // Load display data on mount
  onMount(() => {
    void favoritesStore.fetchDisplayData();
  });

  // Handler functions for favorites and recents
  async function handleRemoveFavorite(
    entityType: EntityType,
    entityId: number,
    databaseId: number,
  ) {
    await favoritesStore.removeFavorite(entityType, entityId, databaseId);
    // Refresh display data after removal
    await favoritesStore.fetchDisplayData();
  }

  async function handleRemoveRecent(
    entityType: EntityType,
    entityId: number,
    databaseId: number,
  ) {
    await favoritesStore.removeRecent(entityType, entityId, databaseId);
    // Refresh display data after removal
    await favoritesStore.fetchDisplayData();
  }
</script>

<div class="favorites-recents-section">
  <div class="favorites-section">
    <EntityFeed
      items={$favoritesWithDisplay}
      type="favorites"
      loading={$favoritesLoading}
      error={$favoritesError}
      onRetry={() => favoritesStore.fetchDisplayData()}
      onRemoveItem={handleRemoveFavorite}
    />
  </div>
  <div class="recents-section">
    <EntityFeed
      items={$recentsWithDisplay}
      type="recents"
      loading={$favoritesLoading}
      error={$favoritesError}
      onRetry={() => favoritesStore.fetchDisplayData()}
      onRemoveItem={handleRemoveRecent}
    />
  </div>
</div>

<style lang="scss">
  .favorites-recents-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }
</style>
