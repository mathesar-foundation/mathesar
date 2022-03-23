<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { TextInput, Checkbox, Select } from '@mathesar-component-library';
  import type { PreviewColumn } from '@mathesar/stores/fileImports';

  const dispatch = createEventDispatcher();

  export let column: PreviewColumn;

  function getOptions(_column: PreviewColumn) {
    if (_column.valid_target_types === null) {
      return [{ id: _column.type, label: _column.type }];
    }
    return _column.valid_target_types.map((type) => ({
      id: type,
      label: type,
    }));
  }

  $: options = getOptions(column);
  $: disabled = !column.isEditable;

  let selectedOption = {
    id: column.type,
    label: column.type,
  };

  function onTypeChange(e: CustomEvent) {
    dispatch('typechange', {
      name: column.name,
      type: e.detail.value.id as string,
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
