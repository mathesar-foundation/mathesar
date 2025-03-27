<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { DateTimeFormatter } from '@mathesar/utils/date-time';
  import { Button, assertExhaustive } from '@mathesar-component-library';

  import type {
    DateTimeCellExternalProps,
    DateTimeCellProps,
  } from '../typeDefinitions';

  const dispatch = createEventDispatcher();

  export let type: DateTimeCellExternalProps['type'];
  export let value: DateTimeCellProps['value'];
  export let formatter: DateTimeFormatter;
  export let isRelative = false;

  interface Preset {
    keyword: string;
    label: string;
  }

  const now: Preset = { keyword: 'now', label: $_('now') };
  const today: Preset = { keyword: 'today', label: $_('today') };
  const yesterday: Preset = { keyword: 'yesterday', label: $_('yesterday') };

  $: presets = (() => {
    if (type === 'date') return [today, yesterday];
    if (type === 'datetime') return [now, today];
    if (type === 'time') return [now];
    return assertExhaustive(type);
  })();

  function getCanonicalValue(keyword: string) {
    return formatter.parse(keyword).value;
  }

  function getFormattedValue(keyword: string) {
    return formatter.parseAndFormat(keyword);
  }
</script>

<div class="presets" class:is-relative={isRelative}>
  {#each presets as { keyword, label } (keyword)}
    <Button
      appearance={value?.trim() === keyword ? 'primary' : 'plain'}
      on:click={() => {
        value = getCanonicalValue(keyword);
        dispatch('change', value);
      }}
    >
      {#if isRelative}
        <span class="tag-label">{label}</span>
      {:else}
        <span>{getFormattedValue(keyword)}</span>
        <span class="tag-label absolute-date">({label})</span>
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
