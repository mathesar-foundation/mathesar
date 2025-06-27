<script lang="ts">
  import type { Table } from '@mathesar/models/Table';

  import type { DataFormManager } from '../DataFormManager';

  import AddFormFieldElementDropdown from './AddFormFieldElementDropdown.svelte';

  export let table: Table;
  export let dataFormManager: DataFormManager;
</script>

<div class="divider">
  <!-- <div class="add-field-dropdown">
    <AddFormFieldElementDropdown {table} {dataFormManager} />
  </div> -->
</div>

<style lang="scss">
  .divider {
    height: var(--sm2);
    position: relative;

    // .add-field-dropdown {
    //   display: none;
    //   position: absolute;
    //   z-index: var(--z-index__data_forms__field-add-dropdown-trigger);
    //   top: 50%;
    //   left: 50%;
    //   transform: translate(-50%, -50%);
    // }

    // &:hover {
    //   .add-field-dropdown {
    //     display: block;
    //   }
    // }
  }
</style>
