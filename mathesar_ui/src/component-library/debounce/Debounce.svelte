<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ArtificialEvents } from '@mathesar-component-library-dir/common/types/ArtificialEvents';

  const dispatch = createEventDispatcher<ArtificialEvents<unknown>>();

  export let duration = 300;
  let parentValue: unknown = undefined;
  export { parentValue as value };

  let timeout: number;

  function getValueFromArtificialEvent(event: CustomEvent<unknown>) {
    return event.detail;
  }

  function getValueFromStandardEvent(e: InputEvent): unknown {
    if (!e.target) {
      return undefined;
    }
    const target = e.target as { value?: unknown };
    return target.value;
  }

  function setParentValue(v: unknown) {
    parentValue = v;
    dispatch('artificialInput', v);
    dispatch('artificialChange', v);
  }

  function handleGenericInput(v: unknown) {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      setParentValue(v);
    }, duration);
  }
  function handleArtificialInput(e: CustomEvent<unknown>) {
    handleGenericInput(getValueFromArtificialEvent(e));
  }
  function handleStandardInput(e: InputEvent) {
    handleGenericInput(getValueFromStandardEvent(e));
  }

  function handleGenericChange(v: unknown) {
    clearTimeout(timeout);
    setParentValue(v);
  }
  function handleArtificialChange(e: CustomEvent<unknown>) {
    handleGenericChange(getValueFromArtificialEvent(e));
  }
  function handleStandardChange(e: InputEvent) {
    handleGenericChange(getValueFromStandardEvent(e));
  }
</script>

<slot
  artificialInput={handleArtificialInput}
  input={handleStandardInput}
  artificialChange={handleArtificialChange}
  change={handleStandardChange}
/>
