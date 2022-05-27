<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Button } from '@mathesar-component-library';
  import {
    currentDbAbstractTypes,
    getAbstractTypesForDbTypeList,
  } from '@mathesar/stores/abstract-types';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import type { Column } from '@mathesar/stores/table-data/types';
  import TypeIcon from '@mathesar/components/TypeIcon.svelte';

  const dispatch = createEventDispatcher();

  export let column: Column;
  export let selectedAbstractType: AbstractType | undefined;

  let abstractTypeContainer: HTMLUListElement;

  $: allowedTypeConversions = getAbstractTypesForDbTypeList(
    [...(column.valid_target_types || []), column.type],
    $currentDbAbstractTypes.data,
  );

  function scrollToSelectedType() {
    const selectedElement: HTMLLIElement | null =
      abstractTypeContainer?.querySelector('li.selected');
    if (selectedElement) {
      abstractTypeContainer.scrollTop = selectedElement.offsetTop;
    }
  }

  onMount(() => {
    scrollToSelectedType();
  });
</script>

<ul bind:this={abstractTypeContainer} class="type-list">
  {#each allowedTypeConversions as abstractType (abstractType.identifier)}
    <li
      class:selected={selectedAbstractType?.identifier ===
        abstractType?.identifier}
    >
      <Button
        appearance="plain"
        on:click={() => dispatch('selection', abstractType)}
      >
        <TypeIcon icon={abstractType.icon} />
        <span>{abstractType.name}</span>
      </Button>
    </li>
  {/each}
</ul>
