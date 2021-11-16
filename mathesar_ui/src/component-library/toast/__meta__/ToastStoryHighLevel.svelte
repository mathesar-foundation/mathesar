<script>
  import { faRocket } from '@fortawesome/free-solid-svg-icons';
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


  let progress;

  function startProgress() {
    progress?.dismiss();
    progress = toast.progress({
      message: 'Hold on to your hats!',
      icon: { data: faRocket },
    });
  }
  function incrementProgress(incrementAmount) {
    let targetValue;
    void progress.progress.update((_targetValue, _value) => {
      targetValue = _targetValue + incrementAmount
      return targetValue;
    });
    if (targetValue >= 1) {
      progress?.dismiss();
      progress = undefined;
      toast.success({ message: 'Launch succesful' });
    }
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


<h2>Interactive</h2>

<p>
  <Button on:click={startSpinner} disabled={spinner}>Spinner</Button>
  {#if spinner}
    <Button on:click={stopSpinner}>Stop</Button>
  {/if}
</p>

<p>
  <Button on:click={startProgress} disabled={progress}>Progress</Button>
  {#if progress}
    <Button on:click={() => incrementProgress(0.25)}>+25%</Button>
  {/if}
</p>


<h2>Rich text</h2>

<p>
  <Button
    on:click={() => toast.success({
      contentComponent: ToastStoryRichTextContent,
      contentComponentProps: { name: 'Foo Bar' },
    })}
  >Success with rich text</Button>
</p>
