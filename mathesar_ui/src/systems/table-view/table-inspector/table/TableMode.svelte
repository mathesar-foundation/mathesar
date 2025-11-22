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
</script>

<InspectorSection
  title={$_('table_properties')}
  bind:isOpen={$tableInspectorTablePropertiesVisible}
  isDbLevelConfiguration
>
  <TableName disabled={!$currentRoleOwns} />
  <TableDescription disabled={!$currentRoleOwns} />
  <div>
    <Button
      appearance="secondary"
      on:click={() => permissionModal.open()}
      size="small"
      class="permissions-button"
    >
      <Icon {...iconPermissions} />
      <span>{$_('table_permissions')}</span>
    </Button>
  </div>
</InspectorSection>

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

<InspectorSection
  title={$_('actions')}
  bind:isOpen={$tableInspectorTableActionsVisible}
>
  <TableActions />
</InspectorSection>

<InspectorSection
  title={$_('advanced')}
  bind:isOpen={$tableInspectorTableAdvancedVisible}
>
  <AdvancedActions />
</InspectorSection>

<TablePermissionsModal {table} controller={permissionModal} />
