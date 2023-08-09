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
  const RICH_TEXT_REGEX = /\w*\[(\w+)\]\w*/gm;
  export let text: string;

  type PrefixAndSlotTuple = [prefix: string, slotName: string];
  function splitInThreePartsRecursively(
    string: string,
  ): Array<PrefixAndSlotTuple> {
    // every odd element will a slotName
    const split = string.split(RICH_TEXT_REGEX);

    let index = 0;
    const prefixAndSlotTuples: PrefixAndSlotTuple[] = [];
    while (index <= split.length) {
      const currentPart = split[index] ?? '';
      const nextPart = split[index + 1] ?? '';
      prefixAndSlotTuples.push([currentPart, nextPart]);
      index += 2;
    }

    return prefixAndSlotTuples;
  }

  $: splitText = splitInThreePartsRecursively(text);
</script>

{#each splitText as [prefix, slotName]}
  {prefix}{#if slotName}<slot {slotName} />{/if}
{/each}
