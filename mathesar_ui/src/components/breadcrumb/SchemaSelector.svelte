<script lang="ts">
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { iconSchema } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import {
    currentSchemaId,
    sortedSchemas as schemasStore,
  } from '@mathesar/stores/schemas';

  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type { BreadcrumbSelectorEntry } from './breadcrumbTypes';

  export let database: Database;

  function makeBreadcrumbSelectorItem(schema: Schema): BreadcrumbSelectorEntry {
    return {
      type: 'simple',
      // TODO_BETA: Make label a store
      label: get(schema.name),
      href: getSchemaPageUrl(database.id, schema.oid),
      icon: iconSchema,
      isActive() {
        return schema.oid === $currentSchemaId;
      },
    };
  }

  $: schemas = [...$schemasStore.data.values()];
</script>

<BreadcrumbSelector
  data={new Map([[$_('schemas'), schemas.map(makeBreadcrumbSelectorItem)]])}
  triggerLabel={$_('choose_schema')}
/>
