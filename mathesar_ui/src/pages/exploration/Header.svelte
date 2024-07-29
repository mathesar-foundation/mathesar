<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { QueryInstance } from '@mathesar/api/rest/types/queries';
  import type { Database } from '@mathesar/api/rpc/databases';
  import type { Schema } from '@mathesar/api/rpc/schemas';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import { iconExploration, iconInspector } from '@mathesar/icons';
  import { getExplorationEditorPageUrl } from '@mathesar/routes/urls';
  import { Button, Icon } from '@mathesar-component-library';

  import ShareExplorationDropdown from './ShareExplorationDropdown.svelte';

  export let database: Database;
  export let schema: Schema;
  export let query: QueryInstance;
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
