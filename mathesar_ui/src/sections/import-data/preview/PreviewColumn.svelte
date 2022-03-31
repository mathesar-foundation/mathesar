<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { TextInput, Checkbox, Select } from '@mathesar-component-library';
  import type { PreviewColumn } from '@mathesar/stores/fileImports';

  const dispatch = createEventDispatcher();

  export let column: PreviewColumn;

  $: options = column.valid_target_types ?? [column.type];
  $: disabled = !column.isEditable;

  let selectedOption = column.type;

  function onTypeChange(e: CustomEvent<string>) {
    dispatch('typechange', {
      name: column.name,
      type: e.detail,
    });
  }
</script>

<th class:disabled>
  <div class="name">
    <Checkbox {disabled} bind:checked={column.isSelected} />
    <TextInput {disabled} bind:value={column.displayName} />
  </div>
  <div class="type">
    <Select
      {disabled}
      {options}
      triggerAppearance="plain"
      bind:value={selectedOption}
      on:change={onTypeChange}
    />
  </div>
</th>
