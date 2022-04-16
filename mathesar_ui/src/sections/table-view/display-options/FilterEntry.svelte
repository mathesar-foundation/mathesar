<script lang="ts">
  // import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  // import { iconTimes } from '@mathesar/icons';
  // import { Icon, Button, Select, TextInput } from '@mathesar-component-library';
  // import type { FilterCondition } from '@mathesar/stores/table-data/types';
  // import type { SelectOption } from '@mathesar-component-library/types';

  // const dispatch = createEventDispatcher();

  // export let columnSelectOptions: ColumnSelectOption[];
  // export let conditions: FilterCondition[];

  // export let filterByDuplicates: boolean;

  // export let column: ColumnSelectOption;
  // export let condition: FilterEntry['condition'];
  // export let value: FilterEntry['value'];

  // let inputValue: string;
  // let timer: number;

  // onMount(() => {
  //   inputValue = value;
  // });

  // onDestroy(() => {
  //   window.clearTimeout(timer);
  // });

  // function onValueChange(_inputValue: string) {
  //   clearTimeout(timer);
  //   timer = window.setTimeout(() => {
  //     if (value !== _inputValue) {
  //       value = _inputValue;
  //       dispatch('reload');
  //     }
  //   }, 500);
  // }

  // $: onValueChange(inputValue);
</script>

<tr>
  <!-- <td class="column">
    <Select
      options={columnSelectOptions}
      bind:value={column}
      on:change={() => dispatch('reload')}
    />
  </td>
  <td class="dir">
    <Select
      options={conditions}
      bind:value={condition}
      on:change={() => dispatch('reload')}
    />
  </td>
  {#if !filterByDuplicates}
    <td class="value">
      <TextInput bind:value={inputValue} />
    </td>
  {/if}
  <td>
    <Button size="small" on:click={() => dispatch('removeFilter')}>
      <Icon {...iconTimes} />
    </Button>
  </td> -->
</tr>
