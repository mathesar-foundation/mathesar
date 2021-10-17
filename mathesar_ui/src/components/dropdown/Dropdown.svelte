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
  import type {
    Appearance, Size,
  } from '@mathesar-components/types';
  import type { Placement } from '@popperjs/core/lib/enums';
  import {
    createEventDispatcher,
  } from 'svelte';

  const dispatch = createEventDispatcher();

  export let triggerClass = '';
  export let triggerAppearance : Appearance = 'default';
  export let contentClass = '';
  export let isOpen = false;
  export let closeOnInnerClick = false;
  export let ariaLabel:string = null;
  export let ariaControls: string = null;
  export let placement: Placement = 'bottom-start';
  export let showArrow = true;
  export let size: Size = 'medium';

  let trigger: HTMLElement;

  function calculateTriggerClass(_triggerClass: string, _showArrow: boolean): string {
    const classes = ['dropdown', 'trigger'];
    if (_triggerClass) {
      classes.push(_triggerClass);
    }
    if (!_showArrow) {
      classes.push('no-arrow');
    }
    return classes.join(' ');
  }

  $: tgClasses = calculateTriggerClass(triggerClass, showArrow);

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

  function dispatchOnOpen(_isOpen: boolean) {
    if (_isOpen) {
      dispatch('open');
    }
  }

  $: dispatchOnOpen(isOpen);
</script>

<Button bind:element={trigger} appearance={triggerAppearance} class={tgClasses} on:click={toggle} 
  aria-controls={ariaControls} aria-haspopup="listbox" aria-label={ariaLabel} {size} on:keydown>
  <span class="label">
    <slot name="trigger"></slot>
  </span>
  {#if showArrow}
    <span class="arrow">
      <Icon data={faAngleDown}/>
    </span>
  {/if}
</Button>

{#if isOpen}
  <div class={['dropdown content', contentClass].join(' ')}
        use:portal use:popper={{ reference: trigger, options: { placement } }}
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
