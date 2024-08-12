<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Schema } from '@mathesar/api/rpc/schemas';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import type { Database } from '@mathesar/models/databases';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import ExplorationPage from '@mathesar/pages/exploration/ExplorationPage.svelte';
  import { queries } from '@mathesar/stores/queries';

  export let database: Database;
  export let schema: Schema;
  export let queryId: number;

  $: query = $queries.data.get(queryId);
</script>

{#if query}
  <AppendBreadcrumb
    item={{
      type: 'exploration',
      database,
      schema,
      query,
    }}
  />

  <ExplorationPage {database} {schema} {query} />
{:else}
  <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
{/if}
