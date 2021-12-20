<!-- Checkbox | toggle -->
<script lang='ts'>
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import type { DynamicInputElementType } from './types.d';

  export let value = undefined;
  export let inputType: DynamicInputElementType = undefined;
</script>

<Checkbox bind:checked={value}/>
