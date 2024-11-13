<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { TextInput } from '@mathesar-component-library';

  import Part from './Part.svelte';

  export let text: string;
  export let onDelete: () => void;
  export let onUpdate: (text: string) => void;

  function handleInput(e: Event) {
    const element = e.target as HTMLInputElement;
    onUpdate(element.value);
  }
</script>

<Part label={$_('text')} {onDelete}>
  <TextInput value={text} on:input={handleInput} />
</Part>
