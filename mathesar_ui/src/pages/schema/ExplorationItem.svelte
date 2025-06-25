<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import EntityListItem from '@mathesar/components/EntityListItem.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconDeleteMajor, iconEdit, iconExploration } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getExplorationPageUrl } from '@mathesar/routes/urls';
  import { currentTablesData as tablesStore } from '@mathesar/stores/tables';
  import { ButtonMenuItem } from '@mathesar-component-library';

  export let exploration: SavedExploration;
  export let database: Database;
  export let schema: Schema;

  $: baseTable = $tablesStore.tablesMap.get(exploration.base_table_oid);
  $: href = getExplorationPageUrl(database.id, schema.oid, exploration.id);
</script>

<EntityListItem
  {href}
  name={exploration.name}
  description={exploration.description ?? undefined}
  icon={iconExploration}
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
    <ButtonMenuItem icon={iconEdit}>
      {$_('edit_exploration')}
    </ButtonMenuItem>
    <ButtonMenuItem danger icon={iconDeleteMajor}>
      {$_('delete_exploration')}
    </ButtonMenuItem>
  </svelte:fragment>
</EntityListItem>
