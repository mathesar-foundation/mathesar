<script lang="ts">
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';

  export let identifier: string;
  export let wrappingString = '';
  export let identifierKey = 'identifier';
</script>

<RichText text={wrappingString} let:slotName>
  {#if slotName === identifierKey}
    <Identifier>{identifier}</Identifier>
  {/if}
</RichText>
