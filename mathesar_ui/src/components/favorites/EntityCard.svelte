<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Icon, ButtonMenuItem } from '@mathesar-component-library';
  import EntityListItem from '@mathesar/components/EntityListItem.svelte';
  import {
    iconDatabase,
    iconSchema,
    iconRemoveFromFavorites,
    iconDeleteMajor,
    iconAddToFavorites,
  } from '@mathesar/icons';
  import type {
    FavoriteItem,
    RecentItem,
    EntityType,
  } from '@mathesar/stores/favorites';
  import { favoritesStore } from '@mathesar/stores/favorites';
  import { getEntityIcon, getEntityUrl } from '@mathesar/utils/entityUtils';
  import Truncate from '@mathesar/component-library/truncate/Truncate.svelte';

  export let item: FavoriteItem | RecentItem;
  export let type: 'favorite' | 'recent';
  export let entityName: string;
  export let databaseName: string;
  export let schemaName: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    remove: {
      entityType: EntityType;
      entityId: number;
      databaseId: number;
    };
  }>();

  function handleRemove(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    dispatch('remove', {
      entityType: item.entityType,
      entityId: item.entityId,
      databaseId: item.databaseId,
    });
  }

  $: isFavorited = favoritesStore.isFavorited(
    item.entityType,
    item.entityId,
    item.databaseId,
  );

  async function handleToggleFavorite(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (isFavorited) {
      await favoritesStore.removeFavorite(
        item.entityType,
        item.entityId,
        item.databaseId,
      );
    } else {
      await favoritesStore.addFavorite({
        entityType: item.entityType,
        entityId: item.entityId,
        databaseId: item.databaseId,
        schemaOid: item.schemaOid,
      });
    }
  }
</script>

<EntityListItem
  href={getEntityUrl(
    item.entityType,
    item.entityId,
    item.databaseId,
    item.schemaOid,
  )}
  name={entityName}
  description={undefined}
  icon={getEntityIcon(item.entityType)}
  primary
>
  <svelte:fragment slot="detail">
    <div class="entity-details">
      <div class="location-info">
        <Truncate>
          <span class="location-path">
            <Icon {...iconDatabase} size="small" />
            <span class="database-name">{databaseName}</span>
            {#if schemaName}
              <span class="separator">→</span>
              <Icon {...iconSchema} size="small" />
              <span class="schema-name">{schemaName}</span>
            {/if}
          </span>
        </Truncate>
      </div>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="menu">
    <ButtonMenuItem
      on:click={handleRemove}
      icon={type === 'favorite' ? iconRemoveFromFavorites : iconDeleteMajor}
    >
      {type === 'favorite'
        ? $_('remove_from_favorites')
        : $_('remove_from_recents')}
    </ButtonMenuItem>
    {#if type === 'recent'}
      <ButtonMenuItem
        on:click={handleToggleFavorite}
        icon={isFavorited ? iconRemoveFromFavorites : iconAddToFavorites}
      >
        {isFavorited ? $_('remove_from_favorites') : $_('add_to_favorites')}
      </ButtonMenuItem>
    {/if}
  </svelte:fragment>
</EntityListItem>

<style lang="scss">
  .entity-details {
    font-size: var(--sm1);
    color: var(--text-color-muted);
  }

  .location-info {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .location-path {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
</style>
