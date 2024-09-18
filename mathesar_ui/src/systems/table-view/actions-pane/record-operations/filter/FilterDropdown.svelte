<script lang="ts">
  import { type ComponentProps, onMount } from 'svelte';
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { iconFiltering } from '@mathesar/icons';
  import { getImperativeFilterControllerFromContext } from '@mathesar/pages/table/ImperativeFilterController';
  import {
    type Filtering,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { BadgeCount, Dropdown, Icon } from '@mathesar-component-library';

  import Filter from './Filter.svelte';

  interface $$Props extends ComponentProps<Dropdown> {
    filtering: Writable<Filtering>;
    canViewLinkedEntities: boolean;
  }

  const imperativeFilterController = getImperativeFilterControllerFromContext();

  const tabularData = getTabularDataStoreFromContext();
  $: ({ processedColumns, recordsData } = $tabularData);

  export let filtering: Writable<Filtering>;
  export let canViewLinkedEntities = true;

  $: processedColumnsToShow = canViewLinkedEntities
    ? $processedColumns
    : new Map([...$processedColumns].filter(([, entry]) => !entry.linkFk));

  let isOpen = false;

  function open() {
    isOpen = true;
  }

  onMount(() => imperativeFilterController?.onOpenDropdown(open));
</script>

<Dropdown
  bind:isOpen
  showArrow={false}
  triggerAppearance="secondary"
  {...$$restProps}
  ariaLabel={$_('filter')}
>
  <svelte:fragment slot="trigger">
    <Icon {...iconFiltering} size="0.8em" />
    <span class="responsive-button-label">
      {$_('filter')}
      <BadgeCount value={$filtering.entries.length} />
    </span>
  </svelte:fragment>
  <Filter
    slot="content"
    {filtering}
    processedColumns={processedColumnsToShow}
    recordSummaries={recordsData.linkedRecordSummaries}
  />
</Dropdown>
