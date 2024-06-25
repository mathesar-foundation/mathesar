<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
  import { AnchorButton, Tutorial } from '@mathesar-component-library';

  export let database: Database;
  export let schema: SchemaEntry;
</script>

<Tutorial>
  <span slot="title">
    {$_('time_to_create_exploration')}
  </span>
  <span slot="body">
    {$_('what_is_an_exploration')}
  </span>
  <AnchorButton
    slot="footer"
    href={getDataExplorerPageUrl(database.id, schema.id)}
  >
    {$_('open_data_explorer')}
  </AnchorButton>
</Tutorial>
