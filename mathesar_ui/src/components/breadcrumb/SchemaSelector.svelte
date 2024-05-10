<script lang="ts">
  import { _ } from 'svelte-i18n';

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
      type: 'simple',
      label: schemaEntry.name,
      href: getSchemaPageUrl(database.id, schemaEntry.id),
      icon: iconSchema,
      isActive() {
        return schemaEntry.id === $currentSchemaId;
      },
    };
  }

  $: schemas = [...$schemasStore.data.values()];
</script>

<BreadcrumbSelector
  data={new Map([[$_('schemas'), schemas.map(makeBreadcrumbSelectorItem)]])}
  triggerLabel={$_('choose_schema')}
/>
