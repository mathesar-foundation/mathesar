<script>
  import { faRocket } from '@fortawesome/free-solid-svg-icons';
  import { derived, writable } from 'svelte/store';

  import Button from '../../button/Button.svelte';
  import { makeToast } from '../ToastController';
  import ToastPresenter from '../ToastPresenter.svelte';

  import ToastStoryRichTextContent from './ToastStoryRichTextContent.svelte';

  /* eslint-disable @typescript-eslint/no-unsafe-call */
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  /* eslint-disable @typescript-eslint/no-unsafe-return */

  const toast = makeToast();

  let spinnerToast;

  function startSpinner() {
    spinnerToast?.dismiss();
    spinnerToast = toast.spinner({ message: 'Hang tight' });
  }
  function stopSpinner() {
    spinnerToast?.dismiss();
    spinnerToast = undefined;
  }

  let progressToast;

  function startProgress() {
    progressToast?.dismiss();
    progressToast = toast.progress({
      message: 'Hold on to your hats!',
      icon: { data: faRocket },
    });
  }
  function incrementProgress(incrementAmount) {
    let targetValue;
    void progressToast.progress.update((_targetValue) => {
      targetValue = _targetValue + incrementAmount;
      return targetValue;
    });
    if (targetValue >= 1) {
      toast.success({
        id: progressToast.id,
        message: 'Launch succesful',
      });
      progressToast = undefined;
    }
  }

  let dynamicToast;
  const dynamicWord = writable('Foo');

  function startDynamic() {
    dynamicToast = toast.info({
      message: derived(dynamicWord, (w) => `The word is: ${w}`),
      lifetime: 0,
      hasProgress: false,
      onDismiss: () => {
        dynamicToast = undefined;
      },
    });
  }

  /* eslint-enable @typescript-eslint/no-unsafe-call */
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  /* eslint-enable @typescript-eslint/no-unsafe-return */
</script>

<ToastPresenter entries={toast.entries} />

<h2>Simple</h2>

<p>
  <Button on:click={() => toast.info({ message: 'Here is your info.' })}
    >Info</Button
  >
</p>

<p>
  <Button on:click={() => toast.error({ message: 'Something went wrong.' })}
    >Error</Button
  >
</p>

<p>
  <Button on:click={() => toast.success({ message: 'You did it!' })}
    >Success</Button
  >
</p>

<h2>Interactive</h2>

<p>
  <Button on:click={startSpinner} disabled={spinnerToast}>Spinner</Button>
  {#if spinnerToast}
    <Button on:click={stopSpinner}>Stop</Button>
  {/if}
</p>

<p>
  <Button on:click={startProgress} disabled={progressToast}>Progress</Button>
  {#if progressToast}
    <Button on:click={() => incrementProgress(0.25)}>+25%</Button>
  {/if}
</p>

<p>
  <Button on:click={startDynamic} disabled={dynamicToast}
    >Dynamic content</Button
  >
  {#if dynamicToast}
    <ul>
      <li>
        <label
          ><span>Word: </span><input
            type="text"
            bind:value={$dynamicWord}
          /></label
        >
      </li>
    </ul>
  {/if}
</p>

<h2>Rich text</h2>

<p>
  <Button
    on:click={() =>
      toast.success({
        contentComponent: ToastStoryRichTextContent,
        contentComponentProps: { name: 'Foo Bar' },
      })}>Success with rich text</Button
  >
</p>

<style>
  input[type='text'] {
    width: 20ch;
  }
</style>
