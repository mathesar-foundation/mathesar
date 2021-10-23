<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import { fade } from 'svelte/transition';
  import {
    faTimes,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button } from '@mathesar-components';
  import type {
    TabularDataStore,
    TabularData,
    ColumnsData,
  } from '@mathesar/stores/table-data/types';
  import type { SelectOption } from '@mathesar-components/types';
  import FilterSection from './FilterSection.svelte';
  import SortSection from './SortSection.svelte';
  import GroupSection from './GroupSection.svelte';

  const dispatch = createEventDispatcher();
  
  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({ columnsDataStore, meta } = $tabularData as TabularData);

  function getColumnOptions(
    columnsData: ColumnsData,
  ): SelectOption<string>[] {
    return columnsData?.columns?.map((column) => ({
      id: column.name,
      label: column.name,
    })) || [];
  }

  $: columnOptions = getColumnOptions($columnsDataStore);
</script>

<div class="display-opts" transition:fade|local={{ duration: 250 }}>
  <div class="header">
    <span>Table Display Properties</span>
    <Button class="padding-zero" appearance="ghost" size="medium"
          on:click={() => dispatch('close')}>
      <Icon data={faTimes}/>
    </Button>
  </div>

  <FilterSection options={columnOptions} {meta}/>
  <SortSection options={columnOptions} {meta}/>
  <GroupSection options={columnOptions} {meta}/>
</div>
