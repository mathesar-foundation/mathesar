<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    tableInspectorTableActionsVisible,
    tableInspectorTableAdvancedVisible,
    tableInspectorTableLinksVisible,
    tableInspectorTablePropertiesVisible,
    tableInspectorTableRecordSummaryVisible,
  } from '@mathesar/stores/localStorage';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { Collapsible } from '@mathesar-component-library';

  import CollapsibleHeader from '../CollapsibleHeader.svelte';
  import TableRecordSummaryConfig from '../record-summary/TableRecordSummaryConfig.svelte';

  import AdvancedActions from './AdvancedActions.svelte';
  import TableLinks from './links/TableLinks.svelte';
  import TableActions from './TableActions.svelte';
  import TableDescription from './TableDescription.svelte';
  import TableName from './TableName.svelte';
  import TablePermissionsModal from './TablePermissionsModal.svelte';
    import { modal } from '@mathesar/stores/modal';
    import Button from '@mathesar/component-library/button/Button.svelte';
    import { iconPermissions } from '@mathesar/icons';
    import Icon from '@mathesar/component-library/icon/Icon.svelte';

  const tabularData = getTabularDataStoreFromContext();
  const permissionModal = modal.spawnModalController();
  $: ({ table } = $tabularData);
  $: ({ currentRoleOwns } = table.currentAccess);
</script>

<div class="table-mode-container">
  <Collapsible
    bind:isOpen={$tableInspectorTablePropertiesVisible}
    triggerAppearance="inspector"
  >
    <CollapsibleHeader
      slot="header"
      title={$_('table_properties')}
      isDbLevelConfiguration
    />
    <div slot="content" class="content-container">
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
      
    </div>
  </Collapsible>

  <Collapsible
    bind:isOpen={$tableInspectorTableLinksVisible}
    triggerAppearance="inspector"
  >
    <CollapsibleHeader
      slot="header"
      title={$_('links')}
      isDbLevelConfiguration
    />
    <div slot="content" class="content-container">
      <TableLinks />
    </div>
  </Collapsible>

  <Collapsible
    bind:isOpen={$tableInspectorTableRecordSummaryVisible}
    triggerAppearance="inspector"
  >
    <CollapsibleHeader slot="header" title={$_('record_summary')} />
    <div slot="content" class="content-container">
      <TableRecordSummaryConfig tabularData={$tabularData} />
    </div>
  </Collapsible>

  <Collapsible
    bind:isOpen={$tableInspectorTableActionsVisible}
    triggerAppearance="inspector"
  >
    <CollapsibleHeader slot="header" title={$_('actions')} />
    <div slot="content" class="content-container">
      <TableActions />
    </div>
  </Collapsible>

  <Collapsible
    bind:isOpen={$tableInspectorTableAdvancedVisible}
    triggerAppearance="inspector"
  >
    <CollapsibleHeader slot="header" title={$_('advanced')} />
    <div slot="content" class="content-container">
      <AdvancedActions />
    </div>
  </Collapsible>
</div>

<TablePermissionsModal {table} controller={permissionModal} />

<style lang="scss">
  .table-mode-container {
    padding-bottom: var(--size-small);

    > :global(* + *) {
      margin-top: var(--size-super-ultra-small);
    }
  }

  .content-container {
    padding: var(--size-small);
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
</style>
