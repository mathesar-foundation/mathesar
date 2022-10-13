<script lang="ts">
  import { Button, Icon, iconLoading } from '@mathesar/component-library';
  import { iconDelete } from '@mathesar/icons';
  import type { RecordsData, Selection } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';

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
  <Button appearance="ghost" on:click={handleDeleteRecords}>
    <Icon {...isDeleting ? iconLoading : iconDelete} />
    <span>
      Delete {selectedRowIndices.length} record{selectedRowIndices.length > 1
        ? 's'
        : ''}
    </span>
  </Button>
</div>

<style>
  .actions-container {
    display: flex;
    flex-direction: column;
  }
</style>
