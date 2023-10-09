<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { AnchorButton, Tutorial } from '@mathesar/component-library';
  import { getImportPageUrl } from '@mathesar/routes/urls';
  import CreateEmptyTableButton from './CreateEmptyTableButton.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
</script>

<Tutorial>
  <span slot="title">You've created a new schema, now add tables to it.</span>
  <span slot="body">
    Tables store your data. It's good to have one table per entity. An entity is
    a thing you wish to keep data about. For example, in your personal financial
    schema, you may have a table for your bank accounts and another for your
    transactions. You can have as many tables as you wish.
  </span>
  <div class="new-table-tutorial-footer" slot="footer">
    <span>How do you want to create your table?</span>
    <div class="new-table-tutorial-actions">
      <CreateEmptyTableButton class="padding-zero" {database} {schema}>
        <span>From Scratch</span>
      </CreateEmptyTableButton>
      <AnchorButton href={getImportPageUrl(database.name, schema.id)}>
        Import from a File
      </AnchorButton>
    </div>
  </div>
</Tutorial>

<style lang="scss">
  .new-table-tutorial-footer {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }

    > span {
      font-weight: bolder;
    }
  }

  .new-table-tutorial-actions {
    display: flex;
    align-items: center;

    > :global(* + *) {
      margin-left: 1rem;
    }
  }
</style>
