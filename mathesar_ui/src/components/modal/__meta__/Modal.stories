<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Modal from '../Modal.svelte';

  const meta = {
    title: 'Components/Modal',
    component: Modal,
  };
</script>

<Meta {...meta} />

<Story
  name="Basic"
  args={{
    overlayTarget: '#target',
  }}
  let:args>
  <div
    id="target"
    style="
      position: relative;
      width: 100%;
      height: 400px;background-color: #e5e5f7;
      background-size: 10px 10px;
      background-image: repeating-linear-gradient(45deg, #000 0, #000 1px, #fff 0, #fff 50%);
    ">
    <Modal {...args}>
      Render anything in the slot!
    </Modal>
  </div>
</Story>
