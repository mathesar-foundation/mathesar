<script>
  import Button from '../../button/Button.svelte';
  import { makeToast } from '../ToastController';
  import ToastPresenter from '../ToastPresenter.svelte';

  import ToastCustomItem from './ToastCustomItem.svelte';

  const toast = makeToast();
</script>

<ToastPresenter entries={toast.entries} toastItemComponent={ToastCustomItem} />

<p>
  <Button on:click={() => toast.info({ message: 'Here is your info.' })}
    >Info</Button
  >
</p>
