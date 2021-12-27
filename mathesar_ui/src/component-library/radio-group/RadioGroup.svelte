<script lang="ts">
  import type { Option } from '@mathesar-component-library-dir/types';
  import FieldsetGroup from '@mathesar-component-library-dir/fieldset-group/FieldsetGroup.svelte';
  import Radio from '@mathesar-component-library-dir/radio/Radio.svelte';

  export let value: string;
  export let isInline = false;
  export let options: Option[] = [];
  export let label: string | undefined = undefined;
</script>

<FieldsetGroup {isInline} {options} {label} let:option>
  <Radio bind:group={value} value={option.value} disabled={option.disabled} />
</FieldsetGroup>
