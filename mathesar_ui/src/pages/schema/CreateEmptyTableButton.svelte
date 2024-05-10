<script lang="ts">
  import { router } from 'tinro';

  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { getTablePageUrl } from '@mathesar/routes/urls';
  import { createTable } from '@mathesar/stores/tables';
  import { Button, Spinner } from '@mathesar-component-library';

  export let database: Database;
  export let schema: SchemaEntry;

  let classes = '';
  export { classes as class };

  let isCreatingNewTable = false;

  async function handleCreateEmptyTable() {
    isCreatingNewTable = true;
    const tableInfo = await createTable(database, schema, {});
    isCreatingNewTable = false;
    router.goto(getTablePageUrl(database.id, schema.id, tableInfo.id), false);
  }
</script>

<Button
  on:click={handleCreateEmptyTable}
  disabled={isCreatingNewTable}
  appearance="plain-primary"
  class={classes}
>
  {#if isCreatingNewTable}
    <Spinner />
  {/if}
  <slot />
</Button>
