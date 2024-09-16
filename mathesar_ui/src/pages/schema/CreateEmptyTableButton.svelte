<script lang="ts">
  import { router } from 'tinro';

  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getTablePageUrl } from '@mathesar/routes/urls';
  import { createTable } from '@mathesar/stores/tables';
  import { Button, Spinner } from '@mathesar-component-library';

  export let database: Database;
  export let schema: Schema;

  let classes = '';
  export { classes as class };

  let isCreatingNewTable = false;

  async function handleCreateEmptyTable() {
    isCreatingNewTable = true;
    const table = await createTable({ database, schema });
    isCreatingNewTable = false;
    router.goto(getTablePageUrl(database.id, schema.oid, table.oid), false);
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
