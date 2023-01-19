<script lang="ts">
  import type { Placement } from '@popperjs/core/lib/enums';

  import AttachableDropdown from '@mathesar-component-library-dir/dropdown/AttachableDropdown.svelte';

  export let lines = 1;
  /**
   * For convenience, this prop will disable the truncation effect when set to
   * true.
   */
  export let passthrough = false;
  export let popoverPlacement: Placement = 'top';

  let element: HTMLSpanElement;
  let dropdownIsOpen = false;

  $: multiline = lines > 1;
  $: style = multiline ? `-webkit-line-clamp: ${lines};` : undefined;

  function hasOverflow(el: HTMLElement): boolean {
    /**
     * I don't understand why this is needed, but in my testing sometimes
     * `scrollHeight` would be 1 or 2 units greater than `clientHeight` even
     * when no meaningful overflow was occurring. I didn't spend time
     * troubleshooting because this `marginOfError` seemed like a quick enough
     * fix.
     */
    const marginOfError = 3;
    return (
      el.scrollHeight - el.clientHeight > marginOfError ||
      el.scrollWidth - el.clientWidth > 0
    );
  }

  function handleHover() {
    if (hasOverflow(element)) {
      dropdownIsOpen = true;
    }
  }
</script>

{#if passthrough}
  <slot />
{:else}
  <span
    bind:this={element}
    class="truncate"
    class:multiline
    {style}
    on:mouseenter={handleHover}
    on:mouseleave={() => {
      dropdownIsOpen = false;
    }}
  >
    <slot />
  </span>
  <AttachableDropdown
    isOpen={dropdownIsOpen}
    trigger={element}
    placement={popoverPlacement}
    class="truncation-content"
  >
    <slot />
  </AttachableDropdown>
{/if}
