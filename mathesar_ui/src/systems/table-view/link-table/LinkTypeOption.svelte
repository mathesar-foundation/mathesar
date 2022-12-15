<script lang="ts">
  import { Label, Radio } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { FieldStore } from '@mathesar/components/form';
  import { assertExhaustive } from '@mathesar/utils/typeUtils';
  import Diagram from './diagram/Diagram.svelte';
  import Pill from './LinkTablePill.svelte';
  import type { LinkType } from './linkTableUtils';

  export let linkType: LinkType;
  export let field: FieldStore<LinkType>;
  export let base: Pick<TableEntry, 'name'>;
  export let target: Pick<TableEntry, 'name'>;

  $: checked = linkType === $field;
  $: label = (() => {
    if (linkType === 'oneToMany') {
      return 'One to Many';
    }
    if (linkType === 'manyToOne') {
      return 'Many to One';
    }
    if (linkType === 'manyToMany') {
      return 'Many to Many';
    }
    return assertExhaustive(linkType);
  })();

  function change({ detail: isChecked }: CustomEvent<boolean>) {
    if (isChecked) {
      field.set(linkType);
    }
  }
</script>

<Label style="--Label__display:contents;">
  <div class="link-type-option" class:checked>
    <span class="top">
      <span class="input">
        <Radio {checked} on:change={change} />
      </span>
      <span class="label">{label}</span>
    </span>
    <span class="diagram">
      <Diagram {linkType} />
    </span>
    <span class="description">
      {#if linkType === 'oneToMany'}
        One
        <Pill table={base} which="base" />
        record can be linked from multiple
        <Pill table={target} which="target" />
        records.
      {:else if linkType === 'manyToOne'}
        Multiple
        <Pill table={base} which="base" />
        records can link to the same
        <Pill table={target} which="target" />
        record.
      {:else if linkType === 'manyToMany'}
        Multiple
        <Pill table={base} which="base" />
        and
        <Pill table={target} which="target" />
        records can link to each other through a new
        <Pill table={{ name: 'Linking Table' }} which="mapping" />
      {:else}
        {assertExhaustive(linkType)}
      {/if}
    </span>
  </div>
</Label>

<style lang="scss">
  @import './link-table.scss';

  .link-type-option {
    --hue: var(--radio-hue, 207);
    --saturation: var(--radio-saturation, 90%);
    --lightness: var(--radio-lightness, 59%);
    --color-unchecked: hsl(0, 0%, var(--lightness));
    --color-checked: hsl(var(--hue), var(--saturation), var(--lightness));
    display: grid;
    grid-template: auto auto auto / 1fr;
    gap: 0.5rem;
    border-radius: 0.5rem;
    border: solid 0.15rem var(--slate-300);
    padding: 0.7rem 1rem;
    background: white;
  }
  .link-type-option.checked {
    border-color: var(--color-checked);
    cursor: default;
  }
  .link-type-option.checked,
  .link-type-option:hover {
    box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.3);
  }
  .top {
    align-self: start;
    display: flex;
    align-items: center;
    .input {
      flex: 0 0 auto;
    }
    .label {
      display: block;
      margin-left: 1rem;
    }
  }
  .diagram {
    display: block;
    max-height: 7rem;
  }
  .description {
    align-self: end;
    display: block;
    font-size: var(--text-size-small);
    overflow: hidden;
  }

  @media (min-width: 28rem) {
    .link-type-option {
      grid-template: auto auto / auto 25%;
    }
    .top {
      grid-row: 1;
      grid-column: 1;
    }
    .diagram {
      grid-row: 1 / span 2;
      grid-column: 2;
    }
    .description {
      grid-row: 2;
      grid-column: 1;
    }
  }

  @media (min-width: $breakpoint) {
    .link-type-option {
      grid-template: auto minmax(7rem, 1fr) auto / 1fr;
    }
    .top {
      grid-row: 1;
      grid-column: 1;
    }
    .diagram {
      grid-row: 2;
      grid-column: 1;
      max-height: none;
    }
    .description {
      grid-row: 3;
      grid-column: 1;
    }
  }
</style>
