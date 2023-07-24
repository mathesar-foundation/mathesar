<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import { Spinner } from '@mathesar-component-library';
  import { Field, type FieldStore } from '@mathesar/components/form';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import type { ComponentProps } from 'svelte';
  import RichText from '@mathesar/components/RichText.svelte';
  import Pill from './LinkTablePill.svelte';

  const label = $LL.general.columnName();

  type Which = ComponentProps<Pill>['which'];

  export let base: Pick<TableEntry, 'name'>;
  export let baseWhich: Which = 'base';
  export let target: Pick<TableEntry, 'name'>;
  export let targetWhich: Which = 'target';
  export let field: FieldStore;
  export let targetColumnsAreLoading = false;
</script>

<p>
  <RichText
    text={$LL.linkTableNewColumn.newColumnInBaseLinkingToTarget()}
    let:slotName
  >
    {#if slotName === 'baseTable'}
      <Pill table={base} which={baseWhich} />
    {:else if slotName === 'targetTable'}
      <Pill table={target} which={targetWhich} />.
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
