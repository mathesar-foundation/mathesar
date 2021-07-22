<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import {
    faTimes,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button } from '@mathesar-components';
  import type {
    SortOption,
    GroupOption,
    TableColumnData,
  } from '@mathesar/stores/tableData';
  import type { SelectOption } from '@mathesar-components/types';
  import SortSection from './SortSection.svelte';
  import GroupSection from './GroupSection.svelte';

  const dispatch = createEventDispatcher();

  export let columns: TableColumnData;
  export let sort: SortOption;
  export let group: GroupOption;

  function getColumnOptions(
    _columns: TableColumnData,
  ): SelectOption[] {
    return _columns?.data?.map((column) => ({
      id: column.name,
      label: column.name,
    })) || [];
  }

  $: columnOptions = getColumnOptions(columns);
</script>

<div class="display-opts" transition:fade|local={{ duration: 250 }}>
  <div class="header">
    <span>Table Display Properties</span>
    <Button class="padding-zero" appearance="ghost" size="medium"
          on:click={() => dispatch('close')}>
      <Icon data={faTimes}/>
    </Button>
  </div>

  <SortSection options={columnOptions} bind:sort on:reload/>
  <GroupSection options={columnOptions} bind:group on:reload/>

  <section>
    <div class="header">Filter</div>
    <div class="content">
      TODO
    </div>
  </section>
</div>
