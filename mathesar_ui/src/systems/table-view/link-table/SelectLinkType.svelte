<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { FieldStore } from '@mathesar/components/form';
  import FieldErrors from '@mathesar/components/form/FieldErrors.svelte';
  import FieldLayout from '@mathesar/components/form/FieldLayout.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Table } from '@mathesar/models/Table';

  import Pill from './LinkTablePill.svelte';
  import type { LinkType } from './linkTableUtils';
  import LinkTypeOption from './LinkTypeOption.svelte';

  export let linkTypes: LinkType[];
  export let isSelfReferential: boolean;
  export let field: FieldStore<LinkType>;
  export let base: Pick<Table, 'name'>;
  export let target: Pick<Table, 'name'>;
</script>

<FieldLayout>
  <fieldset>
    <legend>
      <RichText text={$_('type_of_relatiohship_with_table')} let:slotName>
        {#if slotName === 'tableName'}
          <Pill table={target} which="target" />:
        {/if}
      </RichText>
    </legend>
    <div class="options">
      {#each linkTypes as linkType (linkType)}
        <LinkTypeOption
          {linkType}
          {isSelfReferential}
          {field}
          {base}
          {target}
        />
      {/each}
    </div>
  </fieldset>
  <FieldErrors {field} />
</FieldLayout>

<style lang="scss">
  @import './link-table.scss';

  fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }
  legend {
    margin-bottom: 0.5rem;
    font-weight: var(--font-weight-medium);
  }
  .options {
    display: grid;
    grid-template: auto / auto;
    gap: 1rem;
  }

  @media (min-width: $breakpoint) {
    .options {
      grid-template: auto / repeat(auto-fit, minmax(0, 1fr));
    }
  }
</style>
