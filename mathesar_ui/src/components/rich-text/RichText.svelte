<!--
  @component

  Use this component to render translated strings that contain components or
  html tags. This enables the translations of such strings while maintaining the
  context for the translator using the slot names.

  ## Step 1

  In you source translation strings, specify named slots within square brackets.
  For example:

  ```
  The [tableName] table belongs to the [schemaName] schema.
  ```

  Slot names can only contain letters, numbers and underscores.

  You can pass an argument to the slot, by encapsulating the argument within
  normal brackets immediately after the slot.
  For example:

  ```
  The documenation can be found [anchorComponent](here).
  ```

  The argument 'here' would be translated, and passed to the 'anchorComponent' slot.

  ## Step 2

  Render the component with condition children that match the slot names. For
  example:

  ```svelte
  <RichText text={$_(sometext)} let:slotName let:translatedArg>
    {#if slotName === 'tableName'}
      <TableName {table} />
    {:else if slotName === 'schemaName'}
      <SchemaName {schema} />
    {:else if slotName === 'anchorComponent' && translatedArg}
      <AnchorComponent label={translatedArg}/>
    {/if}
  </RichText>
  ```
-->
<script lang="ts">
  import { assertExhaustive } from '@mathesar/utils/typeUtils';

  import { parse } from './richTextUtils';

  export let text: string;
</script>

{#each parse(text) as token}
  {#if token.type === 'text'}
    {token.content}
  {:else if token.type === 'slot'}
    <slot slotName={token.name} translatedArg={token.arg} />
  {:else}
    {assertExhaustive(token)}
  {/if}
{/each}
