<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconConstraint } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import {
    Button,
    Help,
    Icon,
    iconSettings,
  } from '@mathesar-component-library';

  import TableConstraintsModal from '../../constraints/TableConstraintsModal.svelte';

  const constraintsModal = modal.spawnModalController();
</script>

<div class="actions-container">
  <Button on:click={() => constraintsModal.open()} appearance="secondary">
    <div class="action-item">
      <div>
        <Icon {...iconConstraint} /> <span>{$_('constraints')}</span>
        <Help>{$_('constraints_info_help_mini')}</Help>
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
