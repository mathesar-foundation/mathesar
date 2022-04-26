<script context="module" lang="ts">
  export interface BaseInputProps {
    id?: string;
    labelController?: LabelController;
    disabled?: boolean;
    focusOnMount?: boolean;
  }
</script>

<script lang="ts">
  import { tick, afterUpdate } from 'svelte';
  import type { LabelController } from '@mathesar-component-library-dir/label/LabelController';
  import { getLabelControllerFromContainingLabel } from '@mathesar-component-library-dir/label/LabelController';
  import { getGloballyUniqueId } from '@mathesar-component-library-dir/common/utils/domUtils';

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
