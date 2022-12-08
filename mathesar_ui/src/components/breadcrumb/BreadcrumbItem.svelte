<script lang="ts">
  import SchemaName from '@mathesar/components/SchemaName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import {
    getDatabasePageUrl,
    getExplorationPageUrl,
    getRecordPageUrl,
    getSchemaPageUrl,
    getTablePageUrl,
  } from '@mathesar/routes/urls';
  import { StringOrComponent } from '@mathesar/component-library';
  import { iconExploration, iconRecord } from '@mathesar/icons';
  import BreadcrumbLink from './BreadcrumbLink.svelte';
  import type { BreadcrumbItem } from './breadcrumbTypes';
  import EntitySelector from './EntitySelector.svelte';
  import SchemaSelector from './SchemaSelector.svelte';
  import LogoAndNameWithLink from './LogoAndNameWithLink.svelte';
  import BreadcrumbRecordSelector from './BreadcrumbRecordSelector.svelte';
  import BreadcrumbPageSeparator from './BreadcrumbPageSeparator.svelte';
  import RecordSummary from '../RecordSummary.svelte';

  export let item: BreadcrumbItem;
</script>

<div class="container">
  {#if item.type === 'database'}
    <LogoAndNameWithLink href={getDatabasePageUrl(item.database.name)} />
  {:else if item.type === 'schema'}
    <SchemaSelector database={item.database} />
    <BreadcrumbLink href={getSchemaPageUrl(item.database.name, item.schema.id)}>
      <SchemaName schema={item.schema} />
    </BreadcrumbLink>
  {:else if item.type === 'table'}
    <EntitySelector database={item.database} schema={item.schema} />
    <BreadcrumbLink
      href={getTablePageUrl(item.database.name, item.schema.id, item.table.id)}
    >
      <TableName table={item.table} />
    </BreadcrumbLink>
    <BreadcrumbRecordSelector table={item.table} />
  {:else if item.type === 'record'}
    <BreadcrumbLink
      href={getRecordPageUrl(
        item.database.name,
        item.schema.id,
        item.table.id,
        item.record.id,
      )}
    >
      <NameWithIcon icon={iconRecord}>
        <RecordSummary recordSummary={item.record.summary} />
      </NameWithIcon>
    </BreadcrumbLink>
  {:else if item.type === 'exploration'}
    <EntitySelector database={item.database} schema={item.schema} />
    <BreadcrumbLink
      href={getExplorationPageUrl(
        item.database.name,
        item.schema.id,
        item.query.id,
      )}
    >
      <NameWithIcon icon={iconExploration}>{item.query.name}</NameWithIcon>
    </BreadcrumbLink>
  {:else if item.type === 'simple'}
    <BreadcrumbPageSeparator />
    <BreadcrumbLink href={item.href}>
      {#if item.icon}
        <NameWithIcon icon={item.icon}>
          <StringOrComponent arg={item.label} />
        </NameWithIcon>
      {:else}
        <StringOrComponent arg={item.label} />
      {/if}
    </BreadcrumbLink>
  {/if}
</div>

<style lang="scss">
  .container {
    --icon-color: var(--white);
    --name-color: var(--white);

    display: flex;
    flex-direction: row;
    align-items: center;

    > :global(* + *) {
      margin-left: var(--breadcrumb-spacing);
    }
  }
</style>
