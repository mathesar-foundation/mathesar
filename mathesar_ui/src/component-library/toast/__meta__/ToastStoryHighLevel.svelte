<script>
  import ToastPresenter from '../ToastPresenter.svelte';
  import { makeToast } from '../ToastController';
  import Button from '../../button/Button.svelte';

  const toast = makeToast();
</script>

<ToastPresenter entries={toast.entries} />

<p>
  <Button
    on:click={() => toast.info({ message: 'Here is your info.' })}
  >Info</Button>
</p>

<p>
  <Button
    on:click={() => toast.error({ message: 'Something went wrong.' })}
  >Error</Button>
</p>

<p>
  <Button
    on:click={() => toast.success({ message: 'You did it!' })}
  >Success</Button>
</p>

