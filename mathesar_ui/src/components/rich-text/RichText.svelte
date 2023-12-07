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

  ## Step 2

  Render the component with condition children that match the slot names. For
  example:

  ```svelte
  <RichText text={$LL.text()} let:slotName>
    {#if slotName === 'tableName'}
      <TableName {table} />
    {:else if slotName === 'schemaName'}
      <SchemaName {schema} />
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
    <slot slotName={token.name} />
  {:else}
    {assertExhaustive(token)}
  {/if}
{/each}
