<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { Collapsible } from '@mathesar-component-library';

  import CollapsibleHeader from '../CollapsibleHeader.svelte';

  import AdvancedActions from './AdvancedActions.svelte';
  import TableLinks from './links/TableLinks.svelte';
  import TableActions from './TableActions.svelte';
  import TableDescription from './TableDescription.svelte';
  import TableName from './TableName.svelte';
  import TablePermissions from './TablePermissions.svelte';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ table } = $tabularData);
  $: ({ currentRoleOwns } = table.currentAccess);
</script>

<div class="table-mode-container">
  <Collapsible isOpen triggerAppearance="inspector">
    <CollapsibleHeader
      slot="header"
      title={$_('properties')}
      isDbLevelConfiguration
    />
    <div slot="content" class="content-container">
      <TableName disabled={!$currentRoleOwns} />
      <TableDescription disabled={!$currentRoleOwns} />
    </div>
  </Collapsible>

  <Collapsible isOpen triggerAppearance="inspector">
    <CollapsibleHeader slot="header" title={$_('table_permissions')} />
    <div slot="content" class="content-container">
      <TablePermissions />
    </div>
  </Collapsible>

  <Collapsible isOpen triggerAppearance="inspector">
    <CollapsibleHeader
      slot="header"
      title={$_('links')}
      isDbLevelConfiguration
    />
    <div slot="content" class="content-container">
      <TableLinks />
    </div>
  </Collapsible>

  <!-- TODO_BETA: re-enable this once we make the record summary template configurable -->
  <!-- <Collapsible triggerAppearance="plain">
    <CollapsibleHeader slot="header" title={$_('record_summary')} />
    <div slot="content" class="content-container">
      <RecordSummaryConfig table={$currentTable} tabularData={$tabularData} />
    </div>
  </Collapsible> -->

  <Collapsible isOpen triggerAppearance="inspector">
    <CollapsibleHeader slot="header" title={$_('actions')} />
    <div slot="content" class="content-container">
      <TableActions />
    </div>
  </Collapsible>

  <Collapsible triggerAppearance="inspector">
    <CollapsibleHeader slot="header" title={$_('advanced')} />
    <div slot="content" class="content-container">
      <AdvancedActions />
    </div>
  </Collapsible>
</div>

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
