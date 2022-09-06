<script lang="ts">
  import Logo from '@mathesar/components/Logo.svelte';
  import SchemaName from '@mathesar/components/SchemaName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    getDatabasePageUrl,
    getSchemaPageUrl,
    getTablePageUrl,
  } from '@mathesar/routes/urls';
  import RecordSelectorNavigationButton from '@mathesar/systems/record-selector/RecordSelectorNavigationButton.svelte';
  import BreadcrumbLink from './BreadcrumbLink.svelte';
  import type { BreadcrumbItem } from './breadcrumbTypes';
  import EntitySelector from './EntitySelector.svelte';
  import SchemaSelector from './SchemaSelector.svelte';

  export let item: BreadcrumbItem;
</script>

{#if item.type === 'database'}
  <a href={getDatabasePageUrl(item.database.name)} class="logo-link"><Logo /></a
  >
  <SchemaSelector database={item.database} />
{:else if item.type === 'schema'}
  <BreadcrumbLink href={getSchemaPageUrl(item.database.name, item.schema.id)}>
    <SchemaName schema={item.schema} />
  </BreadcrumbLink>
  <EntitySelector database={item.database} schema={item.schema} />
{:else if item.type === 'table'}
  <BreadcrumbLink
    href={getTablePageUrl(item.database.name, item.schema.id, item.table.id)}
  >
    <TableName table={item.table} />
  </BreadcrumbLink>
  <RecordSelectorNavigationButton table={item.table} />
{/if}

<style>
  .logo-link {
    text-decoration: none;
  }
</style>
