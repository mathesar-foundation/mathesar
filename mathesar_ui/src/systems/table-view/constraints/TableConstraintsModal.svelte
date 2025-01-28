<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import TableConstraints from './TableConstraints.svelte';

  export let controller: ModalController;
</script>

<ControlledModal {controller}>
  <span slot="title">{$_('constraints')}</span>
  <span class="description">
    {$_('constraints_info_help')}
  </span>
  <TableConstraints />
</ControlledModal>

<style lang="scss">
  .description {
    display: inline-block;
    margin-bottom: 1rem;
  }
</style>
