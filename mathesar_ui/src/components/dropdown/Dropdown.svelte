<script lang="ts">
  import {
    faAngleDown,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    portal,
    popper,
    Button,
    Icon,
    clickOffBounds,
  } from '@mathesar-components';
  import {
    createEventDispatcher
  } from 'svelte';

  const dispatch = createEventDispatcher();

  export let triggerClass = '';
  export let triggerAppearance : 'default' | 'plain' = 'default';
  export let contentClass = '';
  export let isOpen = false;
  export let closeOnInnerClick = false;
  export let ariaLabel:string = null;
  export let ariaControls: string = null;

  let trigger: HTMLElement;
  $: tgClasses = ['dropdown', 'trigger', triggerClass].join(' ');

  function toggle() {
    isOpen = !isOpen;
  }

  function close() {
    isOpen = false;
  }

  function checkAndCloseOnInnerClick() {
    if (closeOnInnerClick) {
      close();
    }
  }

  function setCurrentAndSelected(_isOpen){
    if(_isOpen){
      dispatch('openDropdown');
    }
  }

  $: setCurrentAndSelected(isOpen);
</script>

<Button bind:element={trigger} appearance={triggerAppearance} class={tgClasses} on:click={toggle} 
aria-controls={ariaControls} aria-haspopup="listbox" aria-label={ariaLabel} on:keydown>
  <span class="label">
    <slot name="trigger"></slot>
  </span>
  <span class="arrow">
    <Icon data={faAngleDown}/>
  </span>
</Button>

{#if isOpen}
  <div  class={['dropdown content', contentClass].join(' ')}
        use:portal use:popper={{ reference: trigger }}
        use:clickOffBounds={{
          callback: close,
          references: [
            trigger,
          ],
        }}
        on:click={checkAndCloseOnInnerClick}>
    <slot name="content"></slot>
  </div>
{/if}

<style global lang="scss">
  @import "Dropdown.scss";
</style>
