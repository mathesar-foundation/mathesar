<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Icon, Button } from '@mathesar-component-library';
  import {
    iconClose,
    iconError,
  } from '@mathesar-component-library-dir/common/icons';

  const dispatch = createEventDispatcher();

  export let type: 'info' | 'success' | 'danger';
  export let show = true;
  export let closable = true;

  function close() {
    show = false;
    dispatch('close');
  }
</script>

{#if show}
  <div class="notification {type}" transition:fade={{ duration: 120 }}>
    <div class="header">
      <div class="icon">
        <Icon {...iconError} />
      </div>
      <strong class="message">
        <slot />
      </strong>
      {#if closable}
        <Button class="close" appearance="ghost" size="medium" on:click={close}>
          <Icon {...iconClose} />
        </Button>
      {/if}
    </div>
    {#if $$slots.description}
      <div class="description">
        <slot name="description" />
      </div>
    {/if}
  </div>
{/if}
