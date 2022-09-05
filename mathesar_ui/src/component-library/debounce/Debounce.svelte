<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import type { ArtificialEvents } from '@mathesar-component-library-dir/common/types/ArtificialEvents';

  const dispatch = createEventDispatcher<ArtificialEvents<unknown>>();

  export let duration = 300;
  let parentValue: unknown = undefined;
  export { parentValue as value };

  let timeout: number;

  function setParentValue(v: unknown) {
    if (parentValue !== v) {
      parentValue = v;
      dispatch('artificialInput', v);
      dispatch('artificialChange', v);
    }
  }

  function handleNewValue({
    value,
    debounce,
  }: {
    value: unknown;
    debounce: boolean;
  }) {
    clearTimeout(timeout);

    if (debounce) {
      timeout = window.setTimeout(() => {
        setParentValue(value);
      }, duration);
    } else {
      setParentValue(value);
    }
  }

  onDestroy(() => clearTimeout(timeout));
</script>

<slot {handleNewValue} />
