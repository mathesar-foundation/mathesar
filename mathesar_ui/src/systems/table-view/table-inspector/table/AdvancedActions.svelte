<script lang="ts">
  // import { Help, Icon, iconSettings } from '@mathesar/component-library';
  // import { iconConstraint } from '@mathesar/icons';
  import TableConstraints from '../../constraints/TableConstraints.svelte';
  // import ActionItem from '../ActionItem.svelte';
</script>

<div class="actions-container">
  <!-- 
    TODO: Implemenet as a part of constraints modal 
    rendering `TableConstraints` as it is for now
    to avoid loss of functionality
  -->
  <!-- <ActionItem suffixIcon={iconSettings}>
    <Icon {...iconConstraint} />
    <span>Constraints</span>
    <Help
      >Constraints are rules that apply to the data in a column to ensure that
      it is valid.</Help
    >
  </ActionItem> -->
  <TableConstraints />
</div>

<style lang="scss">
  .actions-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
