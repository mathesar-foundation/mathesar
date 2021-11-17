<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import { Button } from '@mathesar-component-library';
  import Modal from '../Modal.svelte';
  import { ModalMultiplexer } from '../ModalMultiplexer';

  const meta = {
    title: 'Systems/Modal',
  };

  const modal = new ModalMultiplexer();

  const exampleA = modal.createVisibilityStore();
  const exampleB = modal.createVisibilityStore();
</script>

<Meta {...meta} />

<Story name="Basic">
  <Button on:click={() => exampleA.open()}>Open Modal A</Button>
  <Button on:click={() => exampleB.open()}>Open Modal B</Button>

  <Modal isOpen={exampleA} title="Modal A">
    Here is modal content

    <div slot="footer">
      <p>This is the modal footer</p>
      <p><Button on:click={() => exampleA.close()}>Close</Button></p>
    </div>
  </Modal>


  <Modal isOpen={exampleB} title="Modal B">
    <p>Here is modal content</p>

    <Button on:click={() => exampleA.open()}>Open Modal A instead (Modal B will close)</Button>
  </Modal>

</Story>
