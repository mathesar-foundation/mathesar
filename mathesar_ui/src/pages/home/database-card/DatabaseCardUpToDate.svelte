<script lang="ts">
  import type { Database } from '@mathesar/models/Database';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';

  import DatabaseCardContent from './DatabaseCardContent.svelte';

  export let database: Database;

  $: href = getDatabasePageUrl(database.id);
</script>

<a class="db-card-link passthrough" {href}>
  <DatabaseCardContent {database} />
</a>

<style>
  .db-card-link:focus {
    outline: 2px solid var(--slate-300);
    outline-offset: 1px;
  }
</style>
