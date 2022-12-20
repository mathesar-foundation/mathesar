<script lang="ts">
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar/component-library';
  import TableConstraints from './TableConstraints.svelte';

  export let controller: ModalController;
</script>

<ControlledModal {controller}>
  <span slot="title">Constraints</span>
  <span class="description"
    >Constraints are used to define relationships between records in different
    tables or to ensure that records in a column are unique. Constraints can be
    applied to a single column or a combination of columns.</span
  >
  <TableConstraints />
</ControlledModal>

<style lang="scss">
  .description {
    display: inline-block;
    font-size: var(--text-size-small);
    margin-bottom: 1rem;
  }
</style>
