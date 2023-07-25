<script lang="ts">
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar/component-library';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import TableConstraints from './TableConstraints.svelte';

  export let controller: ModalController;
</script>

<ControlledModal {controller}>
  <span slot="title">{$LL.general.constraints()}</span>
  <span class="description">
    {$LL.tableConstraintsModal.constraintsDescription()}
  </span>
  <TableConstraints />
</ControlledModal>

<style lang="scss">
  .description {
    display: inline-block;
    font-size: var(--text-size-small);
    margin-bottom: 1rem;
  }
</style>
