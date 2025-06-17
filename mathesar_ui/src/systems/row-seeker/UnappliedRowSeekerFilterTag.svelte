<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { toast } from '@mathesar/stores/toast';
  import { Icon, iconClose } from '@mathesar-component-library';

  import type RowSeekerController from './RowSeekerController';

  export let controller: RowSeekerController;
  let filterSearch: HTMLElement;

  $: ({ unappliedFilter } = controller);

  function onClickOrFocus(e: MouseEvent) {
    e.preventDefault();
  }

  async function onClose() {
    unappliedFilter.set(undefined);
    await controller.focusSearch();
  }

  function onChange() {
    toast.error(
      $_('New column filter from the dropdown is not implemented yet'),
    );
  }
</script>

<div class="filter-tag unapplied" on:click={onClickOrFocus}>
  <div class="column">
    {$unappliedFilter?.column.name}*
  </div>
  <div class="values">
    <input
      bind:this={filterSearch}
      type="text"
      class="input-element"
      placeholder={$_('enter value')}
      on:click={onClickOrFocus}
      on:change={onChange}
    />
  </div>
  <div class="close" on:click={onClose}>
    <Icon {...iconClose} />
  </div>
</div>

<style lang="scss">
  .filter-tag {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    border: 1px solid var(--salmon-300);
    overflow: hidden;
    margin-right: var(--sm5);
    margin-bottom: var(--sm5);
    max-width: 13rem;

    input.input-element {
      border: none;
      box-shadow: none;
      padding: 0;
    }

    .column {
      background-color: var(--salmon-300);
      padding: 0 var(--sm6);
      color: var(--slate-900);
    }
    .values {
      padding: 0 var(--sm6);
    }
  }
</style>
