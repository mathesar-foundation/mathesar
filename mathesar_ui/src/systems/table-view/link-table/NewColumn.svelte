<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import { Spinner } from '@mathesar-component-library';
  import { Field, type FieldStore } from '@mathesar/components/form';
  import type { ComponentProps } from 'svelte';
  import Pill from './LinkTablePill.svelte';

  const label = 'Column Name';

  type Which = ComponentProps<Pill>['which'];

  export let base: Pick<TableEntry, 'name'>;
  export let baseWhich: Which = 'base';
  export let target: Pick<TableEntry, 'name'>;
  export let targetWhich: Which = 'target';
  export let field: FieldStore;
  export let targetColumnsAreLoading = false;
</script>

<p>
  We'll add a column in
  <Pill table={base} which={baseWhich} />
  which links to
  <Pill table={target} which={targetWhich} />.
</p>
{#if targetColumnsAreLoading}
  <!--
    We need to wait for the columns to load because we can't suggest a valid
    column name until we know the existing columns in the table.
  -->
  {label}
  <Spinner />
{:else}
  <Field {field} {label} />
{/if}
