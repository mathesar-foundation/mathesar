<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Button,
    Modal,
  } from '@mathesar-component-library';
  
  export let isOpen = false;

  const dispatch = createEventDispatcher();
</script>

<Modal bind:isOpen class="delete-modal">
  <div class="header">
    <!-- TODO: Fetch all table related information within table-data store -->
    Deleting this table could break existing tables and views.
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
