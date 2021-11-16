<script>
  import Button from '../../button/Button.svelte';
  import { makeToast } from '../ToastController';
  import ToastPresenter from '../ToastPresenter.svelte';
  import ToastStoryRichTextContent from "./ToastStoryRichTextContent.svelte";

  const toast = makeToast();

  let spinner;
  
  function startSpinner() {
    spinner?.dismiss();
    spinner = toast.spinner({ message: 'Hang tight' });
  }
  function stopSpinner() {
    spinner?.dismiss();
    spinner = undefined;
  }
</script>

<ToastPresenter entries={toast.entries} />

<h2>Simple</h2>

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

<p>
  <Button on:click={startSpinner}>Spinner</Button>
  {#if spinner}
    <Button on:click={stopSpinner}>Stop</Button>
  {/if}
</p>



<h2>Complex</h2>

<p>
  <Button
    on:click={() => toast.success({
      contentComponent: ToastStoryRichTextContent,
      contentComponentProps: { name: 'Foo Bar' },
    })}
  >Success with rich text</Button>
</p>
