<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, dayjs } from '@mathesar-component-library';
  import type {
    DateTimeCellExternalProps,
    DateTimeCellProps,
  } from '../typeDefinitions';

  const dispatch = createEventDispatcher();

  export let type: DateTimeCellExternalProps['type'];
  export let value: DateTimeCellProps['value'];
  export let formattingString: DateTimeCellExternalProps['formattingString'];
  export let isRelative = false;

  const allPresets = {
    now: { label: 'Now', absoluteDate: dayjs().format(formattingString) },
    today: {
      label: 'Today',
      absoluteDate: dayjs().startOf('day').format(formattingString),
    },
    yesterday: {
      label: 'Yesterday',
      absoluteDate: dayjs()
        .startOf('day')
        .subtract(1, 'day')
        .format(formattingString),
    },
  };

  const presetTypeMap: Record<
    DateTimeCellExternalProps['type'],
    (keyof typeof allPresets)[]
  > = {
    date: ['today', 'yesterday'],
    datetime: ['now', 'today'],
    time: ['now'],
  };

  $: presets = presetTypeMap[type];
</script>

<div class="presets" class:is-relative={isRelative}>
  {#each presets as preset (preset)}
    <Button
      appearance={value?.trim() === preset ? 'primary' : 'plain'}
      on:click={() => {
        value = preset;
        dispatch('change', value);
      }}
    >
      {#if isRelative}
        <span class="tag-label">
          {allPresets[preset].label}
        </span>
      {:else}
        <span>
          {allPresets[preset].absoluteDate}
        </span>
        <span class="tag-label absolute-date">
          ({allPresets[preset].label})
        </span>
      {/if}
    </Button>
  {/each}
</div>

<style lang="scss">
  .presets {
    border-top: 1px solid var(--color-gray-light);
    padding: 0.4rem 0.6rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;

    &:not(.is-relative) {
      flex-direction: column;
    }

    :global(button.btn) {
      border: 1px solid var(--color-gray-light);
      border-radius: 1rem;
      padding: 0.3rem 0.6rem;
    }

    :global(button.btn.selected) {
      background: var(--color-contrast);
      color: var(--color-white);
    }

    .tag-label {
      &.absolute-date {
        font-size: var(--text-size-x-small);
        color: var(--color-text-muted);
      }
    }
  }
</style>
