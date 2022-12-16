<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { FieldStore } from '@mathesar/components/form';
  import FieldErrors from '@mathesar/components/form/FieldErrors.svelte';
  import FieldLayout from '@mathesar/components/form/FieldLayout.svelte';
  import Pill from './LinkTablePill.svelte';
  import { linkTypes, type LinkType } from './linkTableUtils';
  import LinkTypeOption from './LinkTypeOption.svelte';

  export let field: FieldStore<LinkType>;
  export let base: Pick<TableEntry, 'name'>;
  export let target: Pick<TableEntry, 'name'>;
</script>

<FieldLayout>
  <fieldset>
    <legend>
      Type of Link to <Pill table={target} which="target" />:
    </legend>
    <div class="options">
      {#each linkTypes as linkType (linkType)}
        <LinkTypeOption {linkType} {field} {base} {target} />
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
