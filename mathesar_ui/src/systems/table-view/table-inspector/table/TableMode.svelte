<script>
  import { _ } from 'svelte-i18n';

  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { currentTable } from '@mathesar/stores/tables';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import RecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/RecordSummaryConfig.svelte';
  import { Collapsible } from '@mathesar-component-library';

  import CollapsibleHeader from '../CollapsibleHeader.svelte';

  import AdvancedActions from './AdvancedActions.svelte';
  import TableLinks from './links/TableLinks.svelte';
  import TableActions from './TableActions.svelte';
  import TableDescription from './TableDescription.svelte';
  import TableName from './TableName.svelte';

  const tabularData = getTabularDataStoreFromContext();
  const userProfile = getUserProfileStoreFromContext();

  $: database = $currentDatabase;
  $: schema = $currentSchema;

  $: canExecuteDDL = !!$userProfile?.hasPermission(
    { database, schema },
    'canExecuteDDL',
  );
</script>

<div class="table-mode-container">
  <Collapsible isOpen triggerAppearance="plain">
    <CollapsibleHeader
      slot="header"
      title={$_('properties')}
      isDbLevelConfiguration
    />
    <div slot="content" class="content-container">
      <TableName disabled={!canExecuteDDL} />
      <TableDescription disabled={!canExecuteDDL} />
    </div>
  </Collapsible>

  <Collapsible isOpen triggerAppearance="plain">
    <CollapsibleHeader
      slot="header"
      title={$_('links')}
      isDbLevelConfiguration
    />
    <div slot="content" class="content-container">
      <TableLinks {canExecuteDDL} />
    </div>
  </Collapsible>

  <Collapsible triggerAppearance="plain">
    <CollapsibleHeader slot="header" title={$_('record_summary')} />
    <div slot="content" class="content-container">
      <RecordSummaryConfig table={$currentTable} tabularData={$tabularData} />
    </div>
  </Collapsible>

  <Collapsible isOpen triggerAppearance="plain">
    <CollapsibleHeader slot="header" title={$_('actions')} />
    <div slot="content" class="content-container">
      <TableActions {canExecuteDDL} />
    </div>
  </Collapsible>

  <Collapsible triggerAppearance="plain">
    <CollapsibleHeader slot="header" title={$_('advanced')} />
    <div slot="content" class="content-container">
      <AdvancedActions />
    </div>
  </Collapsible>
</div>

<style lang="scss">
  .table-mode-container {
    padding-bottom: 1rem;
  }

  .content-container {
    padding: 1rem;
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
</style>
