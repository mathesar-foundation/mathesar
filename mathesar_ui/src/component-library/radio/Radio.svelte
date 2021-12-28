<script lang="ts">
  import { getLabelControllerFromContainingLabel } from '@mathesar-component-library-dir/label/LabelController';
  import { getGloballyUniqueId } from '@mathesar-component-library-dir/common/utils/domUtils';

  export let group: string | number | string[] | undefined = undefined;
  export let value: string | number | string[] | undefined = undefined;
  export let disabled = false;
  export let id = getGloballyUniqueId();
  export let labelController = getLabelControllerFromContainingLabel();

  $: labelController?.disabled.set(disabled);
  $: labelController?.inputId.set(id);
</script>

<input
  class="radio"
  type="radio"
  bind:group
  {value}
  {id}
  {disabled}
/>
