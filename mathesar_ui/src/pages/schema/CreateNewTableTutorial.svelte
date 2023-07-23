<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { AnchorButton, Tutorial } from '@mathesar/component-library';
  import { getImportPageUrl } from '@mathesar/routes/urls';
  import CreateEmptyTableButton from './CreateEmptyTableButton.svelte';
  import { LL } from '@mathesar/i18n/i18n-svelte';

  export let database: Database;
  export let schema: SchemaEntry;
</script>

<Tutorial>
  <span slot="title">{$LL.createNewTableTutorial.createFirstTable()}</span>
  <span slot="body">
    {$LL.createNewTableTutorial.createFirstTableHelp()}
  </span>
  <div class="new-table-tutorial-footer" slot="footer">
    <span>{$LL.createNewTableTutorial.howYouWantToCreateTable()}</span>
    <div class="new-table-tutorial-actions">
      <CreateEmptyTableButton class="padding-zero" {database} {schema}>
        <span>{$LL.general.fromScratch()}</span>
      </CreateEmptyTableButton>
      <AnchorButton href={getImportPageUrl(database.name, schema.id)}>
        {$LL.createNewTableTutorial.importFromAFile()}
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
