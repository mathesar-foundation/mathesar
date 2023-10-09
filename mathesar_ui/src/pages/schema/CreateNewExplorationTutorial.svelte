<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { AnchorButton } from '@mathesar/component-library';
  import Tutorial from '@mathesar/component-library/tutorial/Tutorial.svelte';
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';

  export let database: Database;
  export let schema: SchemaEntry;
</script>

<Tutorial>
  <span slot="title"
    >It's time to use your tables. Create your first exploration.</span
  >
  <span slot="body"
    >Explorations let you query your data to uncover trends and insights. They
    may be stored and run anytime to see the latest data. Explorations make
    great reports. You might, for example, create an exploration that shows your
    monthly spending.</span
  >
  <AnchorButton
    slot="footer"
    href={getDataExplorerPageUrl(database.name, schema.id)}
  >
    Open Data Explorer
  </AnchorButton>
</Tutorial>
