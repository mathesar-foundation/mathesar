<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { TextInput, Checkbox, Select } from '@mathesar-component-library';
  import type { PreviewColumn } from '@mathesar/stores/fileImports';

  const dispatch = createEventDispatcher();
  export let column: PreviewColumn;

  let options = column.valid_target_types?.map((type) => ({
    id: type,
    label: type,
  }));

  if (column.name === 'id' && options === undefined) {
    options = [{ id: 'INTEGER', label: 'INTEGER' }];
  }

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
  const disabled = !column.isEditable;
</script>

<th class:disabled={!column.isEditable}>
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
