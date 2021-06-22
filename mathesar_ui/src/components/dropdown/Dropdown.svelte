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

  export let triggerClass = '';
  export let contentClass = '';

  let trigger: HTMLElement;
  let isOpen = false;

  $: tgClasses = ['dropdown', 'trigger', triggerClass].join(' ');

  function toggle() {
    isOpen = !isOpen;
  }

  function close() {
    isOpen = false;
  }
</script>

<Button bind:element={trigger} class={tgClasses} on:click={toggle}>
  <span class="label">
    <slot name="trigger"></slot>
  </span>
  <span class="arrow">
    <Icon data={faAngleDown}/>
  </span>
</Button>

{#if isOpen}
  <div class={['dropdown content', contentClass].join(' ')}
        use:portal use:popper={{ reference: trigger }}
        use:clickOffBounds={{
          callback: close,
          references: [
            trigger,
          ],
        }}>
    <slot name="content"></slot>
  </div>
{/if}

<style global lang="scss">
  @import "Dropdown.scss";
</style>
