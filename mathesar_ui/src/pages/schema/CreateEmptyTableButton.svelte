<script lang="ts">
  import { router } from 'tinro';
  import { createTable } from '@mathesar/stores/tables';
  import { getTablePageUrl } from '@mathesar/routes/urls';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { Button, Spinner } from '@mathesar-component-library';

  export let database: Database;
  export let schema: SchemaEntry;

  let classes = '';
  export { classes as class };

  let isCreatingNewTable = false;

  async function handleCreateEmptyTable() {
    isCreatingNewTable = true;
    const tableInfo = await createTable(schema.id, {});
    isCreatingNewTable = false;
    router.goto(getTablePageUrl(database.name, schema.id, tableInfo.id), false);
  }
</script>

<Button
  on:click={handleCreateEmptyTable}
  disabled={isCreatingNewTable}
  appearance="plain"
  class={classes}
>
  {#if isCreatingNewTable}
    <Spinner />
  {/if}
  <slot />
</Button>
