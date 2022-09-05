<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { TextInput, Checkbox, Select } from '@mathesar-component-library';
  import type { PreviewColumn } from '@mathesar/stores/fileImports';

  const dispatch = createEventDispatcher();

  export let column: PreviewColumn;

  $: options = column.valid_target_types ?? [column.type];
  $: disabled = !column.isEditable;

  let selectedOption = column.type;

  function onTypeChange(e: CustomEvent<string | undefined>) {
    const type = e.detail;
    if (typeof type !== 'undefined') {
      dispatch('typechange', {
        id: column.id,
        name: column.name,
        type,
      });
    }
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

<style lang="scss">
  th {
    margin: 0;
    padding: 0;
    position: sticky;
    top: 0;

    .name,
    .type {
      border-bottom: 1px solid #efefef;
    }

    .name {
      min-width: 15rem;
      display: flex;
      padding: 4px 10px;
      background: #efefef;
      align-items: center;

      :global(.text-input) {
        margin-left: 0.8rem;
        text-align: left;
      }
    }

    .type {
      background: #fff;
      :global(button) {
        width: 100%;
        border: none;
      }
    }
  }
</style>
