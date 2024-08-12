<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Schema } from '@mathesar/api/rpc/schemas';
  import { iconSchema } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/databases';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import {
    currentSchemaId,
    schemas as schemasStore,
  } from '@mathesar/stores/schemas';

  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type { BreadcrumbSelectorEntry } from './breadcrumbTypes';

  export let database: Database;

  function makeBreadcrumbSelectorItem(schema: Schema): BreadcrumbSelectorEntry {
    return {
      type: 'simple',
      label: schema.name,
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
