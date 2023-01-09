<script>
  import { Collapsible } from '@mathesar-component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { currentTable } from '@mathesar/stores/tables';
  import RecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/RecordSummaryConfig.svelte';
  import RenameTable from './TableName.svelte';
  import TableActions from './TableActions.svelte';
  import CollapsibleHeader from '../CollapsibleHeader.svelte';
  import AdvancedActions from './AdvancedActions.svelte';
  import TableLinks from './links/TableLinks.svelte';
  import TableDescription from './TableDescription.svelte';

  const tabularData = getTabularDataStoreFromContext();
</script>

<div class="table-mode-container">
  <Collapsible isOpen triggerAppearance="plain">
    <CollapsibleHeader
      slot="header"
      title="Properties"
      isDbLevelConfiguration
    />
    <div slot="content" class="content-container">
      <RenameTable />
      <TableDescription />
    </div>
  </Collapsible>

  <Collapsible isOpen triggerAppearance="plain">
    <CollapsibleHeader slot="header" title="Links" isDbLevelConfiguration />
    <div slot="content" class="content-container">
      <TableLinks />
    </div>
  </Collapsible>

  <Collapsible triggerAppearance="plain">
    <CollapsibleHeader slot="header" title="Record Summary" />
    <div slot="content" class="content-container">
      <RecordSummaryConfig table={$currentTable} tabularData={$tabularData} />
    </div>
  </Collapsible>

  <Collapsible isOpen triggerAppearance="plain">
    <CollapsibleHeader slot="header" title="Actions" />
    <div slot="content" class="content-container">
      <TableActions />
    </div>
  </Collapsible>

  <Collapsible triggerAppearance="plain">
    <CollapsibleHeader slot="header" title="Advanced" />
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
