<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { TextInput, Checkbox, Select } from '@mathesar-component-library';
  import type { PreviewColumn } from '@mathesar/stores/fileImports';

  const dispatch = createEventDispatcher();
  export let column: PreviewColumn;

  const options = column.valid_target_types?.map((type) => ({
    id: type,
    label: type,
  }));
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

<th class:disabled={!column.isEditable}>
  <div class="name">
    <Checkbox disabled={!column.isEditable} bind:checked={column.isSelected} />
    <TextInput disabled={!column.isEditable} bind:value={column.displayName} />
  </div>
  <div class="type">
    <Select
      {options}
      triggerAppearance="plain"
      bind:value={selectedOption}
      on:change={onTypeChange}
    />
  </div>
</th>
