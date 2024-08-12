<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Schema } from '@mathesar/api/rpc/schemas';
  import type { Database } from '@mathesar/models/databases';
  import { getImportPageUrl } from '@mathesar/routes/urls';
  import { AnchorButton, Tutorial } from '@mathesar-component-library';

  import CreateEmptyTableButton from './CreateEmptyTableButton.svelte';

  export let database: Database;
  export let schema: Schema;
</script>

<Tutorial>
  <span slot="title">{$_('add_tables_to_new_schema')}</span>
  <span slot="body">
    {$_('what_is_a_table')}
  </span>
  <div class="new-table-tutorial-footer" slot="footer">
    <span>{$_('how_do_you_want_to_create_table')}</span>
    <div class="new-table-tutorial-actions">
      <CreateEmptyTableButton class="padding-zero" {database} {schema}>
        <span>{$_('from_scratch')}</span>
      </CreateEmptyTableButton>
      <AnchorButton href={getImportPageUrl(database.id, schema.oid)}>
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
