<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { AnchorButton } from '@mathesar/component-library';
  import Tutorial from '@mathesar/component-library/tutorial/Tutorial.svelte';
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
  import { LL } from '@mathesar/i18n/i18n-svelte';

  export let database: Database;
  export let schema: SchemaEntry;
</script>

<Tutorial>
  <span slot="title">
    {$LL.createNewExplorationTutorial.createFirstExploration()}
  </span>
  <span slot="body">
    {$LL.createNewExplorationTutorial.createFirstExplorationHelp()}
  </span>
  <AnchorButton
    slot="footer"
    href={getDataExplorerPageUrl(database.name, schema.id)}
  >
    {$LL.general.openDataExplorer()}
  </AnchorButton>
</Tutorial>
