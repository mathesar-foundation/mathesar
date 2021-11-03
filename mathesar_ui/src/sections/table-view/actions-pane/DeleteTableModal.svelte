<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Button,
    Modal,
  } from '@mathesar-components';
  import type { MathesarTab } from '@mathesar/stores/tabs';
  
  export let isOpen = false;
  export let activeTab: MathesarTab;

  const dispatch = createEventDispatcher();
</script>

<Modal class="delete-modal">
    <div class="header">
      Deleting '{activeTab.label}' could break existing tables and views.
    </div >
    <!-- Todo Show dependencies-->
    <div class="help-text">
      All Objects related to this table will be affected.
    </div>
  
  <svelte:fragment slot="footer">
      <Button on:click={() => { isOpen = false; }}>Cancel</Button>
      <Button appearance="primary" on:click={() => dispatch('deleteConfirm')}>
        Delete Table
      </Button>
  </svelte:fragment>
</Modal>
