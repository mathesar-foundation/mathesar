<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getImportPageUrl } from '@mathesar/routes/urls';
  import { AnchorButton, Button, Tutorial } from '@mathesar-component-library';

  export let database: Database;
  export let schema: Schema;
  export let onCreateEmptyTable: () => void;
</script>

<Tutorial>
  <span slot="title">{$_('add_tables_to_new_schema')}</span>
  <span slot="body">
    {$_('what_is_a_table')}
  </span>
  <div class="new-table-tutorial-footer" slot="footer">
    <span>{$_('how_do_you_want_to_create_table')}</span>
    <div class="new-table-tutorial-actions">
      <Button on:click={onCreateEmptyTable} appearance="secondary">
        {$_('from_scratch')}
      </Button>
      <AnchorButton
        href={getImportPageUrl(database.id, schema.oid)}
        appearance="secondary"
      >
        {$_('import_from_file')}
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
