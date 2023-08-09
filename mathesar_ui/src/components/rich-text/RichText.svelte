<!-- 
  @component
  
  Use this component to render strings having component/html tags 
  embedded in it. It enables the translations of such strings.

  It breaks the translations strings(passed in the prop named `text`) 
  with `[uniqueSlotNameWithinTheString]` identifiers into named slots.

  Ex: 
  If the string is - 
  This <TableName /> comes under <SchemaName /> of the <DatabaseName /> db.

  The translations string could be - 
  This [tableName] comes under [schemaName] of the [databaseName] db.

  There will three slots with the following names 
  1. tableName
  2. schemaName
  3. databaseName

  This enables the translations of such strings while maintaining the 
  context for the translator using the slot names. 
  
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
