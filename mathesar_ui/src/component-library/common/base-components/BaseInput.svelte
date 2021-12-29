<script lang="ts">
  import { getLabelControllerFromContainingLabel } from '@mathesar-component-library-dir/label/LabelController';
  import { getGloballyUniqueId } from '@mathesar-component-library-dir/common/utils/domUtils';

  export let id = getGloballyUniqueId();
  export let labelController = getLabelControllerFromContainingLabel();
  export let disabled = false;

  $: labelController?.disabled.set(disabled);
  $: labelController?.inputId.set(id);
</script>
