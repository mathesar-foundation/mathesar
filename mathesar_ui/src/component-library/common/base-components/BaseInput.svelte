<script lang="ts">
  import { tick, afterUpdate } from 'svelte';
  import { getLabelControllerFromContainingLabel } from '@mathesar-component-library-dir/label/LabelController';
  import { getGloballyUniqueId } from '@mathesar-component-library-dir/common/utils/domUtils';
  import type { BaseInputProps } from './BaseInputTypes';

  type $$Props = BaseInputProps;

  export let id = getGloballyUniqueId();
  export let labelController = getLabelControllerFromContainingLabel();
  export let disabled = false;
  export let focusOnMount = false;

  $: labelController?.disabled.set(disabled);
  $: labelController?.inputId.set(id);

  afterUpdate(async () => {
    await tick();
    if (focusOnMount) {
      const inputElement = document.querySelector(`#${id}`) as
        | HTMLInputElement
        | undefined;
      inputElement?.focus();
    }
  });
</script>
