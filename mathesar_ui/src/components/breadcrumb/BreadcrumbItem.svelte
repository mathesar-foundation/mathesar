<script lang="ts">
  import { _ } from 'svelte-i18n';
  import DatabaseName from '@mathesar/components/DatabaseName.svelte';
  import SchemaName from '@mathesar/components/SchemaName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import {
    getDatabasePageUrl,
    getExplorationPageUrl,
    getRecordPageUrl,
    getSchemaPageUrl,
    CONNECTIONS_URL,
  } from '@mathesar/routes/urls';
  import { StringOrComponent } from '@mathesar/component-library';
  import { iconExploration, iconRecord, iconConnection } from '@mathesar/icons';
  import { getLinkForTableItem } from '@mathesar/utils/tables';
  import BreadcrumbLink from './BreadcrumbLink.svelte';
  import type { BreadcrumbItem } from './breadcrumbTypes';
  import DatabaseSelector from './DatabaseSelector.svelte';
  import EntitySelector from './EntitySelector.svelte';
  import SchemaSelector from './SchemaSelector.svelte';
  import BreadcrumbRecordSelector from './BreadcrumbRecordSelector.svelte';
  import BreadcrumbPageSeparator from './BreadcrumbPageSeparator.svelte';
  import RecordSummary from '../RecordSummary.svelte';

  export let item: BreadcrumbItem;
</script>

{#if item.type === 'connectionList'}
  <DatabaseSelector />
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink href={CONNECTIONS_URL}>
      <NameWithIcon icon={iconConnection}>
        {$_('connections')}
      </NameWithIcon>
    </BreadcrumbLink>
  </div>
{:else if item.type === 'database'}
  <DatabaseSelector />
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink href={getDatabasePageUrl(item.database.nickname)}>
      <DatabaseName database={item.database} />
    </BreadcrumbLink>
  </div>
{:else if item.type === 'schema'}
  <SchemaSelector database={item.database} />
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink
      href={getSchemaPageUrl(item.database.nickname, item.schema.id)}
    >
      <SchemaName schema={item.schema} />
    </BreadcrumbLink>
  </div>
{:else if item.type === 'table'}
  <EntitySelector database={item.database} schema={item.schema} />
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink
      href={getLinkForTableItem(
        item.database.nickname,
        item.schema.id,
        item.table,
      )}
    >
      <TableName table={item.table} />
    </BreadcrumbLink>
  </div>
  <BreadcrumbRecordSelector table={item.table} />
{:else if item.type === 'record'}
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink
      href={getRecordPageUrl(
        item.database.nickname,
        item.schema.id,
        item.table.id,
        item.record.pk,
      )}
    >
      <NameWithIcon icon={iconRecord}>
        <RecordSummary recordSummary={item.record.summary} />
      </NameWithIcon>
    </BreadcrumbLink>
  </div>
{:else if item.type === 'exploration'}
  <EntitySelector database={item.database} schema={item.schema} />
  <div class="breadcrumb-item truncate">
    <BreadcrumbLink
      href={getExplorationPageUrl(
        item.database.nickname,
        item.schema.id,
        item.query.id,
      )}
    >
      <NameWithIcon icon={iconExploration}>{item.query.name}</NameWithIcon>
    </BreadcrumbLink>
  </div>
{:else if item.type === 'simple'}
  <BreadcrumbPageSeparator />
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
