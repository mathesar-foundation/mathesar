<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';

  import type { ArtificialEvents } from '@mathesar-component-library-dir/common/types/ArtificialEvents';

  import { createDebounce } from './debounceUtils';

  const dispatch = createEventDispatcher<ArtificialEvents<unknown>>();

  export let duration = 300;
  let parentValue: unknown = undefined;
  export { parentValue as value };

  function setParentValue(v: unknown) {
    if (parentValue !== v) {
      parentValue = v;
      dispatch('artificialInput', v);
      dispatch('artificialChange', v);
    }
  }

  const { debounced: debouncedSetParentValue, cancel } = createDebounce(
    (v: unknown) => setParentValue(v),
    duration,
  );

  function handleNewValue({
    value,
    debounce,
  }: {
    value: unknown;
    debounce: boolean;
  }) {
    if (debounce) {
      debouncedSetParentValue(value);
    } else {
      cancel();
      setParentValue(value);
    }
  }

  onDestroy(() => cancel());
</script>

<slot {handleNewValue} />
