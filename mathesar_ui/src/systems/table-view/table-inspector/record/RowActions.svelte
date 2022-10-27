<script lang="ts">
  import { Icon, iconLoading } from '@mathesar/component-library';
  import { iconDeleteMajor } from '@mathesar/icons';
  import type { RecordsData, Selection } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import ActionItem from '../ActionItem.svelte';

  export let selectedRowIndices: number[];
  export let recordsData: RecordsData;
  export let selection: Selection;

  let isDeleting = false;

  async function handleDeleteRecords() {
    if (!isDeleting) {
      try {
        isDeleting = true;
        selection.freezeSelection = true;
        await recordsData.deleteSelected(selectedRowIndices);
        selection.resetSelection();
      } catch (e) {
        toast.fromError(e);
      } finally {
        selection.freezeSelection = false;
        isDeleting = true;
      }
    }
  }
</script>

<div class="actions-container">
  <ActionItem danger on:click={handleDeleteRecords}>
    <Icon {...isDeleting ? iconLoading : iconDeleteMajor} />
    <span>
      Delete {selectedRowIndices.length} record{selectedRowIndices.length > 1
        ? 's'
        : ''}
    </span>
  </ActionItem>
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
