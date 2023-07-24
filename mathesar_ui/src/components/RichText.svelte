<script lang="ts">
  const RICH_TEXT_REGEX = /\w*<>(\w+)<>\w*/gm;
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
