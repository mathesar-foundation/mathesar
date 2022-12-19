<script lang="ts">
  import {
    Button,
    Help,
    Icon,
    iconSettings,
  } from '@mathesar/component-library';
  import { iconConstraint } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import TableConstraintsModal from '../../constraints/TableConstraintsModal.svelte';

  const constraintsModal = modal.spawnModalController();
</script>

<div class="actions-container">
  <Button on:click={() => constraintsModal.open()}>
    <div class="action-item">
      <div>
        <Icon {...iconConstraint} /> <span>Constraints</span>
        <Help
          >Constraints are rules that apply to the data in a column to ensure
          that it is valid.</Help
        >
      </div>
      <Icon {...iconSettings} />
    </div>
  </Button>

  <TableConstraintsModal controller={constraintsModal} />
</div>

<style lang="scss">
  .actions-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }

  .action-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
