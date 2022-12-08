<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { Button, Icon } from '@mathesar-component-library';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import { iconExploration, iconInspector } from '@mathesar/icons';
  import type { QueryInstance } from '@mathesar/api/types/queries';
  import { getExplorationEditorPageUrl } from '@mathesar/routes/urls';

  export let database: Database;
  export let schema: SchemaEntry;
  export let query: QueryInstance;
  export let isInspectorOpen = true;
</script>

<EntityPageHeader
  icon={iconExploration}
  name={query.name}
  description={query.description}
>
  <svelte:fragment slot="actions-right">
    <a href={getExplorationEditorPageUrl(database.name, schema.id, query.id)}>
      <Button appearance="primary">
        <span>Edit in Data Explorer</span>
      </Button>
    </a>
    <Button
      appearance="secondary"
      on:click={() => {
        isInspectorOpen = !isInspectorOpen;
      }}
    >
      <Icon {...iconInspector} />
      <span>Inspector</span>
    </Button>
  </svelte:fragment>
</EntityPageHeader>

<style lang="scss">
  a {
    margin-right: var(--size-small);
    text-decoration: none;
  }
</style>
