<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Table } from '@mathesar/api/rpc/tables';
  import type { FieldStore } from '@mathesar/components/form';
  import FieldErrors from '@mathesar/components/form/FieldErrors.svelte';
  import FieldLayout from '@mathesar/components/form/FieldLayout.svelte';

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
      {$_('type_of_link_to')}
      <Pill table={target} which="target" />:
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
