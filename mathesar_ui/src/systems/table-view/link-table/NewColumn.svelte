<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { Table } from '@mathesar/api/rpc/tables';
  import { Field, type FieldStore } from '@mathesar/components/form';
  import { RichText } from '@mathesar/components/rich-text';
  import { Spinner } from '@mathesar-component-library';

  import Pill from './LinkTablePill.svelte';

  const label = 'Name of New Column';

  type Which = ComponentProps<Pill>['which'];

  export let base: Pick<Table, 'name'>;
  export let baseWhich: Which = 'base';
  export let target: Pick<Table, 'name'>;
  export let targetWhich: Which = 'target';
  export let field: FieldStore;
  export let targetColumnsAreLoading = false;
</script>

{#if baseWhich !== 'mapping'}
<p>
  <RichText text={$_('we_will_add_a_column_in_x_to_y')} let:slotName>
    {#if slotName === 'baseTable'}
      <Pill table={base} which={baseWhich} />
    {:else if slotName === 'targetTable'}
      <Pill table={target} which={targetWhich} />
    {/if}
  </RichText>
</p>
{/if}

{#if targetColumnsAreLoading}
  <!--
    We need to wait for the columns to load because we can't suggest a valid
    column name until we know the existing columns in the table.
  -->
  {label}
  <Spinner />
{:else}
  <Field {field} {label}>
    <span slot="help">
      The column in <Pill table={base} which={baseWhich} /> that will link to the <Pill table={target} which={targetWhich} /> table.
    </span>
  </Field>
{/if}
