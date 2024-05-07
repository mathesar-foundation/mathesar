<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { TableEntry } from '@mathesar/api/rest/types/tables';
  import { Spinner } from '@mathesar-component-library';
  import { Field, type FieldStore } from '@mathesar/components/form';
  import { RichText } from '@mathesar/components/rich-text';
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
  <RichText text={$_('we_will_add_a_column_in_x_to_y')} let:slotName>
    {#if slotName === 'baseTable'}
      <Pill table={base} which={baseWhich} />
    {:else if slotName === 'targetTable'}
      <Pill table={target} which={targetWhich} />
    {/if}
  </RichText>
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
