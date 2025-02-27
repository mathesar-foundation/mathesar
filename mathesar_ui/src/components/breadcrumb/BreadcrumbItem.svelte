<script lang="ts">
  import { StringOrComponent } from '@mathesar/component-library';
  import DatabaseDisplayNameWithIcon from '@mathesar/components/DatabaseDisplayNameWithIcon.svelte';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import SchemaName from '@mathesar/components/SchemaName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconExploration, iconRecord } from '@mathesar/icons';
  import {
    getDatabasePageUrl,
    getExplorationPageUrl,
    getRecordPageUrl,
    getSchemaPageUrl,
  } from '@mathesar/routes/urls';
  import { getLinkForTableItem } from '@mathesar/utils/tables';

  import BreadcrumbLink from './BreadcrumbLink.svelte';
  import BreadcrumbPageSeparator from './BreadcrumbPageSeparator.svelte';
  import BreadcrumbRecordSelector from './BreadcrumbRecordSelector.svelte';
  import type { BreadcrumbItem } from './breadcrumbTypes';
  import EntitySelector from './EntitySelector.svelte';
  import SchemaSelector from './SchemaSelector.svelte';

  export let item: BreadcrumbItem;
</script>

{#if item.type === 'database'}
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink href={getDatabasePageUrl(item.database.id)}>
      <DatabaseDisplayNameWithIcon database={item.database} />
    </BreadcrumbLink>
  </div>
  <SchemaSelector database={item.database} />
{:else if item.type === 'schema'}
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink href={getSchemaPageUrl(item.database.id, item.schema.oid)}>
      <SchemaName schema={item.schema} />
    </BreadcrumbLink>
  </div>
  <EntitySelector database={item.database} schema={item.schema} />
{:else if item.type === 'table'}
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink
      href={getLinkForTableItem(item.database.id, item.schema.oid, item.table)}
    >
      <TableName table={item.table} />
    </BreadcrumbLink>
  </div>
  <BreadcrumbRecordSelector table={item.table} />
{:else if item.type === 'record'}
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink
      href={getRecordPageUrl(
        item.database.id,
        item.schema.oid,
        item.table.oid,
        item.record.pk,
      )}
    >
      <NameWithIcon icon={iconRecord}>{item.record.summary}</NameWithIcon>
    </BreadcrumbLink>
  </div>
{:else if item.type === 'exploration'}
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink
      href={getExplorationPageUrl(
        item.database.id,
        item.schema.oid,
        item.query.id,
      )}
    >
      <NameWithIcon icon={iconExploration}>{item.query.name}</NameWithIcon>
    </BreadcrumbLink>
  </div>
{:else if item.type === 'simple'}
  {#if item.prependSeparator}
    <BreadcrumbPageSeparator />
  {/if}
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink href={item.href}>
      {#if item.icon}
        <NameWithIcon icon={item.icon}>
          <StringOrComponent arg={item.label} />
        </NameWithIcon>
      {:else}
        <StringOrComponent arg={item.label} />
      {/if}
    </BreadcrumbLink>
  </div>
{/if}

<style lang="scss">
  .breadcrumb-item {
    --NameWithIcon__icon-opacity: 1;
    --SchemaName__locked-schema-icon-color: var(--white);

    display: flex;
    flex-shrink: 0;
    align-items: center;
    overflow: hidden;

    &.truncate {
      // We are growing from `0` instead of shrinking from `auto` because we
      // want to shrink longer breadcrumb items more aggressively than shorter
      // ones. This way the longest items will shrink until all truncating items
      // have equal width (at which point they will all shrink at equal rates).
      flex: 1 0 0;
      max-width: max-content;
    }

    > :global(* + *) {
      margin-left: var(--breadcrumb-spacing);
    }

    :global(.postgres-keyword) {
      color: var(--white);
      background: rgba(255, 255, 255, 0.25);
    }
  }
</style>
