<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import EntityListItem from '@mathesar/components/EntityListItem.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    iconDeleteMajor,
    iconEdit,
    iconExploration,
    iconRemoveFromFavorites,
    iconAddToFavorites,
  } from '@mathesar/icons';
  import { favorites, favoritesStore } from '@mathesar/stores/favorites';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getExplorationPageUrl } from '@mathesar/routes/urls';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { deleteExploration } from '@mathesar/stores/queries';
  import { currentTablesData as tablesStore } from '@mathesar/stores/tables';
  import { ButtonMenuItem } from '@mathesar-component-library';

  export let exploration: SavedExploration;
  export let database: Database;
  export let schema: Schema;
  export let openEditExplorationModal: (e: SavedExploration) => void;

  $: baseTable = $tablesStore.tablesMap.get(exploration.base_table_oid);
  $: href = getExplorationPageUrl(database.id, schema.oid, exploration.id);
  $: isFavorited = $favorites.some(
    (fav) =>
      fav.entityType === 'exploration' &&
      fav.entityId === exploration.id &&
      fav.databaseId === database.id,
  );

  function handleDelete() {
    void confirmDelete({
      identifierType: 'Exploration',
      identifierName: exploration.name,
      onProceed: () => deleteExploration(exploration.id),
    });
  }

  async function handleToggleFavorite() {
    if (isFavorited) {
      await favoritesStore.removeFavoriteByEntity(
        'exploration',
        exploration.id,
        database.id,
      );
    } else {
      await favoritesStore.addFavorite({
        entityType: 'exploration',
        entityId: exploration.id,
        databaseId: database.id,
        schemaOid: schema.oid,
      });
    }
  }
</script>

<EntityListItem
  {href}
  name={exploration.name}
  description={exploration.description ?? undefined}
  icon={iconExploration}
  cssVariables={{
    '--EntityListItem__accent-color': 'var(--color-exploration-80)',
  }}
>
  <svelte:fragment slot="detail">
    {#if baseTable}
      <RichText text={$_('based_on_base')} let:slotName>
        {#if slotName === 'base'}
          <TableName table={baseTable} truncate={false} />
        {/if}
      </RichText>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="menu">
    <ButtonMenuItem
      on:click={() => openEditExplorationModal(exploration)}
      icon={iconEdit}
    >
      {$_('rename_exploration')}
    </ButtonMenuItem>
    <ButtonMenuItem
      on:click={handleToggleFavorite}
      icon={isFavorited ? iconRemoveFromFavorites : iconAddToFavorites}
    >
      {isFavorited ? $_('remove_from_favorites') : $_('add_to_favorites')}
    </ButtonMenuItem>
    <ButtonMenuItem on:click={handleDelete} danger icon={iconDeleteMajor}>
      {$_('delete_exploration')}
    </ButtonMenuItem>
  </svelte:fragment>
</EntityListItem>
