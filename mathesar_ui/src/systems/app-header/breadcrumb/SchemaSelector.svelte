<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { iconSchema } from '@mathesar/icons';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import {
    currentSchemaId,
    schemas as schemasStore,
  } from '@mathesar/stores/schemas';
  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type { BreadcrumbSelectorEntry } from './breadcrumbTypes';

  export let database: Database;

  function makeBreadcrumbSelectorItem(
    schemaEntry: SchemaEntry,
  ): BreadcrumbSelectorEntry {
    return {
      label: schemaEntry.name,
      href: getSchemaPageUrl(database.name, schemaEntry.id),
      icon: iconSchema,
      isActive() {
        return schemaEntry.id === $currentSchemaId;
      },
    };
  }

  $: schemas = [...$schemasStore.data.values()];
</script>

<BreadcrumbSelector
  data={new Map([['Schemas', schemas.map(makeBreadcrumbSelectorItem)]])}
  triggerLabel="Choose a Schema"
/>
