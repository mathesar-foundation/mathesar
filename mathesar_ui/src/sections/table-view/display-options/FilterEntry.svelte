<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import {
    faTimes,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    Icon,
    Button,
    Select,
    TextInput,
  } from '@mathesar-components';
  import type {
    FilterEntry,
  } from '@mathesar/stores/tableData';
  import type { SelectOption } from '@mathesar-components/types';

  const dispatch = createEventDispatcher();

  export let options: SelectOption[];
  export let conditions: SelectOption[];

  export let column: FilterEntry['column'];
  export let condition: FilterEntry['condition'];
  export let value: FilterEntry['value'];

  let inputValue: string;
  let timer;

  onMount(() => {
    inputValue = value;
  });

  onDestroy(() => {
    clearTimeout(timer);
  });

  function onValueChange(_inputValue: string) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (value !== _inputValue) {
        value = _inputValue;
        dispatch('reload');
      }
    }, 500);
  }
  
  $: onValueChange(inputValue);
</script>

<tr>
  <td class="column">
    <Select {options} bind:value={column}
      on:change={() => dispatch('reload')}/>
  </td>
  <td class="dir">
    <Select options={conditions} bind:value={condition}
      on:change={() => dispatch('reload')}/>
  </td>
  <td class="value">
    <TextInput bind:value={inputValue}/>
  </td>
  <td>
    <Button size="small" on:click={() => dispatch('removeFilter')}>
      <Icon data={faTimes}/>
    </Button>
  </td>
</tr>
