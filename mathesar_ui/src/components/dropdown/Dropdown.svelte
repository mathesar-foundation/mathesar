<script lang="ts">
  import { faAngleDown } from "@fortawesome/free-solid-svg-icons";
  import {
    portal,
    popper,
    Button,
    Icon,
    clickOffBounds,
  } from "@mathesar-components";
  import type { Appearance } from "@mathesar-components/types";
  import type { Placement } from "@popperjs/core/lib/enums";

  export let triggerClass = "";
  export let triggerAppearance: Appearance = "default";
  export let contentClass = "";
  export let isOpen = false;
  export let closeOnInnerClick = false;
  export let functionBeforeClose = null;
  export let ariaLabel: string = null;
  export let ariaControls: string = null;
  export let placement: Placement = "bottom-start";

  let trigger: HTMLElement;
  $: tgClasses = ["dropdown", "trigger", triggerClass].join(" ");

  function checkAndRunFunctionBeforeClose() {
    if (functionBeforeClose) {
      functionBeforeClose();
    }
  }

  function toggle() {
    isOpen = !isOpen;
  }

  function close() {
    checkAndRunFunctionBeforeClose();
    isOpen = false;
  }

  function checkAndCloseOnInnerClick() {
    if (closeOnInnerClick) {
      close();
    }
  }
</script>

<Button
  bind:element={trigger}
  appearance={triggerAppearance}
  class={tgClasses}
  on:click={toggle}
  aria-controls={ariaControls}
  aria-haspopup="listbox"
  aria-label={ariaLabel}
>
  <span class="label">
    <slot name="trigger" />
  </span>
  <span class="arrow">
    <Icon data={faAngleDown} />
  </span>
</Button>

{#if isOpen}
  <div
    class={["dropdown content", contentClass].join(" ")}
    use:portal
    use:popper={{ reference: trigger, options: { placement } }}
    use:clickOffBounds={{
      callback: close,
      references: [trigger],
    }}
    on:click={checkAndCloseOnInnerClick}
  >
    <slot name="content" />
  </div>
{/if}

<style global lang="scss">
  @import "Dropdown.scss";
</style>
