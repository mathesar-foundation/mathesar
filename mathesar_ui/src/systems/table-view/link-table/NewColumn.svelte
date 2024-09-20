<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { Field, type FieldStore } from '@mathesar/components/form';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Table } from '@mathesar/models/Table';
  import { Spinner } from '@mathesar-component-library';
  import Collapsible from '@mathesar-component-library-dir/collapsible/Collapsible.svelte';

  import Pill from './LinkTablePill.svelte';

  $: label = $_('name_of_new_column');

  type Which = ComponentProps<Pill>['which'];

  export let base: Pick<Table, 'name'>;
  export let baseWhich: Which = 'base';
  export let target: Pick<Table, 'name'>;
  export let targetWhich: Which = 'target';
  export let field: FieldStore;
  export let targetColumnsAreLoading = false;

  let isOpen = false;
</script>

<Collapsible bind:isOpen triggerAppearance="outcome">
  <svelte:fragment slot="header">
    <RichText text={$_('we_will_add_a_column_in_x_to_y')} let:slotName>
      {#if slotName === 'baseTable'}
        <Pill table={base} which={baseWhich} />
      {:else if slotName === 'targetTable'}
        <Pill table={target} which={targetWhich} />
      {/if}
    </RichText>
  </svelte:fragment>

  <svelte:fragment slot="content">
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
  </svelte:fragment>
</Collapsible>
