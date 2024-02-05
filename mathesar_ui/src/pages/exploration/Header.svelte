<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { Button, Icon } from '@mathesar-component-library';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import { iconExploration, iconInspector } from '@mathesar/icons';
  import type { QueryInstance } from '@mathesar/api/types/queries';
  import { getExplorationEditorPageUrl } from '@mathesar/routes/urls';
  import ShareExplorationDropdown from './ShareExplorationDropdown.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let query: QueryInstance;
  export let isInspectorOpen = true;
  export let canEditMetadata: boolean;
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
      {#if canEditMetadata}
        <a
          class="btn btn-primary"
          href={getExplorationEditorPageUrl(database.id, schema.id, query.id)}
        >
          <span>{$_('edit_in_data_explorer')}</span>
        </a>
      {/if}
      <ShareExplorationDropdown id={query.id} />
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
