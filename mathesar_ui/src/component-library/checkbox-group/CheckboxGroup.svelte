<script lang="ts">
  import type { Option } from '@mathesar-component-library-dir/types';
  import FieldsetGroup from '@mathesar-component-library-dir/fieldset-group/FieldsetGroup.svelte';
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import ImmutableSet from '@mathesar-component-library-dir/common/utils/ImmutableSet';

  export let values: Option['value'][] = [];
  export let isInline = false;
  export let options: Option[] = [];
  export let label: string | undefined = undefined;

  $: set = new ImmutableSet<Option['value']>(values);

  function handleChange(
    { value }: Option,
    e: CustomEvent<{ checked: boolean }>,
  ) {
    const { checked } = e.detail;
    set = checked ? set.with(value) : set.without(value);
    values = [...set.values()];
  }
</script>

<FieldsetGroup {isInline} {options} {label} let:option>
  <Checkbox
    on:change={(e) => handleChange(option, e)}
    checked={set.has(option.value)}
    disabled={option.disabled}
  />
</FieldsetGroup>
