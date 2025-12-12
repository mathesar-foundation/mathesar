<script>
  import {
    faBreadSlice,
    faCheck,
    faExclamationTriangle,
  } from '@fortawesome/free-solid-svg-icons';
  import { onMount } from 'svelte';

  import Button from '../../button/Button.svelte';
  import Icon from '../../icon/Icon.svelte';
  import Select from '../../select/Select.svelte';
  import { ToastController } from '../ToastController';
  import ToastPresenter from '../ToastPresenter.svelte';

  const toast = new ToastController();
  const { entries } = toast;

  const iconChoices = [
    { id: 0, label: '(None)', value: undefined },
    { id: 1, label: 'Bread', value: { data: faBreadSlice } },
    {
      id: 2,
      label: 'Exclamation Triangle',
      value: { data: faExclamationTriangle },
    },
    { id: 3, label: 'Check', value: { data: faCheck } },
  ];

  let icon = iconChoices[1];
  let title = '';
  let message = 'This is a toast message';
  let backgroundColor = 'rgba(66, 66, 66, 0.9)';
  let textColor = 'white';
  let progressColor = 'rgba(33, 150, 243, 0.75)';
  let lifetime = 3000;
  let allowDismiss = true;
  let hasProgress = true;
  let initialProgress = 1;
  let finalProgress = 0;
  let allowPause = true;

  $: props = {
    icon: icon.value,
    title,
    message,
    backgroundColor,
    textColor,
    progressColor,
    lifetime,
    allowDismiss,
    hasProgress,
    initialProgress,
    finalProgress,
    allowPause,
  };

  onMount(() => {
    toast.show(props);
  });
</script>

<ToastPresenter {entries} />

<label>
  <span>Title</span>
  <input type="text" bind:value={title} />
</label>

<label>
  <span>Message</span>
  <input type="text" bind:value={message} />
</label>

<label>
  <span>Background Color</span>
  <input type="text" bind:value={backgroundColor} />
</label>

<label>
  <span>Text Color</span>
  <input type="text" bind:value={textColor} />
</label>

<label>
  <span>Progress Color</span>
  <input type="text" bind:value={progressColor} />
</label>

<!-- svelte-ignore a11y-label-has-associated-control -->
<label>
  <span>Icon</span>
  <Select options={iconChoices} bind:value={icon} />
  {#if props.icon}
    <Icon {...props.icon} />
  {/if}
</label>

<label>
  <span>Lifetime (ms)</span>
  <input type="number" bind:value={lifetime} />
</label>

<label>
  <input type="checkbox" bind:checked={allowDismiss} />
  <span>Allow Dismiss</span>
</label>

<fieldset>
  <legend>Progress</legend>
  <label>
    <input type="checkbox" bind:checked={hasProgress} />
    <span>Has Progress</span>
  </label>

  <label>
    <input type="checkbox" bind:checked={allowPause} />
    <span>Allow Pause</span>
  </label>

  <label>
    <span>Initial Progress</span>
    <input type="number" bind:value={initialProgress} />
  </label>

  <label>
    <span>Final Progress</span>
    <input type="number" bind:value={finalProgress} />
  </label>
</fieldset>

<Button on:click={() => toast.show(props)}>Show toast</Button>

{#if $entries.length > 0}
  <p>Toast Entries:</p>
  <ul>
    {#each $entries as entry (entry.id)}
      <li>
        {entry.id}
        <Button on:click={entry.controller.dismiss}>close</Button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  fieldset {
    margin: 1em 0;
    max-width: 20em;
  }
  label {
    display: block;
    margin: 1em 0;
  }
  input[type='number'] {
    width: 8ch;
  }
</style>
