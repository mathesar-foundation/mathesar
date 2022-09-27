<script context="module">
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  const api = {
    recycle() {
      // do nothing
    },
    async shred() {
      await sleep(2000);
    },
    async burn() {
      await sleep(1000);
      throw new Error("Can't start fire. Wood is too wet.");
    },
  };
</script>

<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import { Button } from '@mathesar-component-library';
  import { faFire, faRecycle, faCut } from '@fortawesome/free-solid-svg-icons';
  import {
    makeToast,
    ToastPresenter,
  } from '@mathesar-component-library-dir/toast';
  import { ModalMultiplexer } from '@mathesar-component-library-dir/modal';
  import { makeConfirm } from '../ConfirmationController';
  import Confirmation from '../Confirmation.svelte';

  const meta = {
    title: 'Systems/Confirmation',
  };

  const toast = makeToast();
  const modal = new ModalMultiplexer();
  const confirmationModal = modal.spawnModalController();
  const { confirm, confirmationController } = makeConfirm({
    confirmationModal,
  });

  function handleRecycle() {
    void confirm({
      title: 'Recycle document?',
      body: 'It will be permanently destroyed',
      proceedButton: { label: 'Recycle', icon: { data: faRecycle } },
      onProceed: () => api.recycle(),
      onSuccess: () => toast.success({ message: 'Document recycled.' }),
      onError: (e) =>
        toast.error({ message: `Unable to recycle document. ${e.message}` }),
    });
  }

  function handleShred() {
    void confirm({
      title: 'Shred document?',
      body: [
        'It will be permanently destroyed.',
        'It will take a couple of seconds for the shredding to complete.',
      ],
      proceedButton: { label: 'Shred', icon: { data: faCut } },
      onProceed: () => api.shred(),
      onSuccess: () => toast.success({ message: 'Document shredded.' }),
      onError: (e) =>
        toast.error({ message: `Unable to shred document. ${e.message}` }),
    });
  }

  function handleBurn() {
    void confirm({
      title: 'Burn document?',
      body: [
        'It will be permanently destroyed.',
        'It may take some time to get the fire started.',
      ],
      proceedButton: { label: 'Burn', icon: { data: faFire } },
      onProceed: () => api.burn(),
      onSuccess: () => toast.success({ message: 'Document burned.' }),
      onError: (e) =>
        toast.error({ message: `Unable to burn document. ${e.message}` }),
    });
  }
</script>

<Meta {...meta} />

<ToastPresenter entries={toast.entries} />

<Story name="Basic">
  <Confirmation controller={confirmationController} />

  <h2>Examples</h2>
  <ul>
    <li>
      <Button on:click={handleRecycle}>Recycle document</Button> (synchronous)
    </li>
    <li>
      <Button on:click={handleShred}>Shred document</Button> (asynchronous)
    </li>
    <li>
      <Button on:click={handleBurn}>Burn document</Button> (asynchronous, with failure)
    </li>
  </ul>
</Story>

<style>
  li {
    margin: 1em 0;
  }
</style>
