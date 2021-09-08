<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import { Button } from '@mathesar-components';
  import Modal from '../Modal.svelte';

  const meta = {
    title: 'Components/Modal',
    component: Modal,
  };

  let isBasicModalOpen = false;
</script>

<Meta {...meta} />

<Story
  name="Basic">
  <Button on:click={() => { isBasicModalOpen = true; }}>Open Modal</Button>
  <Modal bind:isOpen={isBasicModalOpen}>
    Render anything in the slot!
    <svelte:fragment slot="footer">
      Render anything in the footer slot!
      <Button on:click={() => { isBasicModalOpen = false; }}>
        Close
      </Button>
    </svelte:fragment>
  </Modal>
</Story>
