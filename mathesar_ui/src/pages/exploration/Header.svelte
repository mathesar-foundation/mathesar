<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import { iconExploration, iconInspector } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getExplorationEditorPageUrl } from '@mathesar/routes/urls';
  import { Button, Icon } from '@mathesar-component-library';

  export let database: Database;
  export let schema: Schema;
  export let query: SavedExploration;
  export let isInspectorOpen = true;
  export let context: 'page' | 'shared-consumer-page' = 'page';
</script>

<EntityPageHeader
  title={{
    icon: iconExploration,
    name: query.name,
    description: query.description,
  }}
>
  <svelte:fragment slot="actions-right">
    {#if context !== 'shared-consumer-page'}
      <a
        class="btn btn-primary"
        href={getExplorationEditorPageUrl(database.id, schema.oid, query.id)}
      >
        <span>{$_('edit_in_data_explorer')}</span>
      </a>
      <!-- TODO: Display Share option when we re-implement it with the new permissions structure -->
      <!-- <ShareExplorationDropdown id={query.id} /> -->
    {/if}
    <Button
      appearance="secondary"
      on:click={() => {
        isInspectorOpen = !isInspectorOpen;
      }}
    >
      <Icon {...iconInspector} />
      <span>{$_('inspector')}</span>
    </Button>
  </svelte:fragment>
</EntityPageHeader>
