<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Button, Icon } from '@mathesar-component-library';
  import { iconRemoveFromFavorites, iconAddToFavorites } from '@mathesar/icons';
  import { favorites, favoritesStore } from '@mathesar/stores/favorites';
  import type { EntityType, FavoriteItem } from '@mathesar/stores/favorites';

  export let entityType: EntityType;
  export let entityId: number;
  export let databaseId: number;
  export let schemaOid: number | undefined = undefined;
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let appearance: 'primary' | 'secondary' | 'ghost' = 'ghost';
  export let showLabel = false;

  const dispatch = createEventDispatcher<{
    favorited: { entityType: EntityType; entityId: number };
    unfavorited: { entityType: EntityType; entityId: number };
  }>();

  let isProcessing = false;

  $: isFavorited = favoritesStore.isFavorited(entityType, entityId, databaseId);
  $: buttonTitle = isFavorited
    ? $_('remove_from_favorites')
    : $_('add_to_favorites');
  $: buttonLabel = isFavorited
    ? $_('remove_from_favorites')
    : $_('add_to_favorites');

  async function toggleFavorite() {
    if (isProcessing) return;

    isProcessing = true;
    try {
      if (isFavorited) {
        await favoritesStore.removeFavoriteByEntity(
          entityType,
          entityId,
          databaseId,
        );
        dispatch('unfavorited', { entityType, entityId });
      } else {
        await favoritesStore.addFavorite({
          entityType: entityType,
          entityId: entityId,
          databaseId: databaseId,
          schemaOid: schemaOid,
        });
        dispatch('favorited', { entityType, entityId });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      isProcessing = false;
    }
  }
</script>

<Button
  {appearance}
  {size}
  disabled={isProcessing}
  on:click={toggleFavorite}
  title={buttonTitle}
>
  <Icon {...isFavorited ? iconRemoveFromFavorites : iconAddToFavorites} />
  {#if showLabel}
    <span>{buttonLabel}</span>
  {/if}
</Button>
