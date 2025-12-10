<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import { iconPermissions } from '@mathesar/icons';
  import {
    tableInspectorTableActionsVisible,
    tableInspectorTableAdvancedVisible,
    tableInspectorTableLinksVisible,
    tableInspectorTablePropertiesVisible,
    tableInspectorTableRecordSummaryVisible,
  } from '@mathesar/stores/localStorage';
  import { modal } from '@mathesar/stores/modal';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { isTableView } from '@mathesar/utils/tables';
  import { Button, Help, Icon } from '@mathesar-component-library';

  import TableRecordSummaryConfig from '../record-summary/TableRecordSummaryConfig.svelte';

  import AdvancedActions from './AdvancedActions.svelte';
  import TableLinks from './links/TableLinks.svelte';
  import TableActions from './TableActions.svelte';
  import TableDescription from './TableDescription.svelte';
  import TableName from './TableName.svelte';
  import TablePermissionsModal from './TablePermissionsModal.svelte';

  const tabularData = getTabularDataStoreFromContext();
  const permissionModal = modal.spawnModalController();
  $: ({ table } = $tabularData);
  $: ({ currentRoleOwns } = table.currentAccess);
  $: isView = isTableView(table);
</script>

<InspectorSection
  title={isView ? $_('view_properties') : $_('table_properties')}
  bind:isOpen={$tableInspectorTablePropertiesVisible}
  isDbLevelConfiguration
>
  <TableName disabled={!$currentRoleOwns} />
  {#if !isView}
    <TableDescription disabled={!$currentRoleOwns} />
  {/if}
  <div>
    <Button
      appearance="secondary"
      on:click={() => permissionModal.open()}
      size="small"
      class="permissions-button"
    >
      <Icon {...iconPermissions} />
      <span>{isView ? $_('view_permissions') : $_('table_permissions')}</span>
    </Button>
  </div>
</InspectorSection>

{#if !isView}
  <InspectorSection
    bind:isOpen={$tableInspectorTableLinksVisible}
    isDbLevelConfiguration
  >
    <div slot="title">
      {$_('relationships')}
      <Help>
        <p>{$_('references_help')}</p>
        <p><SeeDocsToLearnMore page="relationships" /></p>
      </Help>
    </div>
    <TableLinks />
  </InspectorSection>

  <InspectorSection
    title={$_('record_summary')}
    bind:isOpen={$tableInspectorTableRecordSummaryVisible}
  >
    <TableRecordSummaryConfig tabularData={$tabularData} />
  </InspectorSection>
{/if}

<InspectorSection
  title={$_('actions')}
  bind:isOpen={$tableInspectorTableActionsVisible}
>
  <TableActions />
</InspectorSection>

{#if !isView}
  <InspectorSection
    title={$_('advanced')}
    bind:isOpen={$tableInspectorTableAdvancedVisible}
  >
    <AdvancedActions />
  </InspectorSection>
{/if}

<TablePermissionsModal {table} controller={permissionModal} />
