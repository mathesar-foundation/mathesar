<script lang="ts">
  import { TextInput } from '@mathesar-component-library';

  import Part from './Part.svelte';

  export let text: string;
  export let onDelete: () => void;
</script>

<Part label="Text" {onDelete}>
  <TextInput value={text} />
</Part>
