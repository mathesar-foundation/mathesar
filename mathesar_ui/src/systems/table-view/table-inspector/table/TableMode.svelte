<script>
  import { Collapsible } from '@mathesar-component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { currentTable } from '@mathesar/stores/tables';
  import RecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/RecordSummaryConfig.svelte';
  import TableName from './TableName.svelte';
  import TableActions from './TableActions.svelte';
  import CollapsibleHeader from '../CollapsibleHeader.svelte';
  import AdvancedActions from './AdvancedActions.svelte';
  import TableLinks from './links/TableLinks.svelte';
  import TableDescription from './TableDescription.svelte';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';

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
  {#if canExecuteDDL}
    <Collapsible isOpen triggerAppearance="plain">
      <CollapsibleHeader
        slot="header"
        title="Properties"
        isDbLevelConfiguration
      />
      <div slot="content" class="content-container">
        <TableName />
        <TableDescription />
      </div>
    </Collapsible>
  {/if}

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
      <TableActions {canExecuteDDL} />
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
