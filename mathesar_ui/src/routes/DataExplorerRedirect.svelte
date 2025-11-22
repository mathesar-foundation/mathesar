<!--
@component

This component exists to redirect a path like

`/db/1/schemas/123/explorations/1/edit`

to

`/db/1/schemas/123/explorations/1`

This redirect is necessary because previously we had two routes for an
exploration — one with the `/edit` segment appended and one without it. When we
consolidated those routes, we wanted to avoid broken user bookmarks.

I'm not sure if there's a better way to do this redirect. I tried using tinro's
[redirect property][1] but I couldn't get it to work with this use case.

[1]: https://github.com/AlexxNB/tinro?tab=readme-ov-file#redirects

  -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from 'tinro';

  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';

  import { getExplorationPageUrl } from './urls';

  export let database: Pick<Database, 'id'>;
  export let schema: Pick<Schema, 'oid'>;
  export let query: { id: number };

  onMount(() => {
    router.goto(getExplorationPageUrl(database.id, schema.oid, query.id));
  });
</script>
