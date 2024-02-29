<!-- 
  @component This is a textarea that grows in height as its text grows

  ## Limitations:

  - The textarea will not shrink in height when the text is removed. Users can
    manually shrink it using the resize handle if needed.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { TextArea } from '@mathesar-component-library';

  const MAX_HEIGHT_PX = 400;

  type $$Props = ComponentProps<TextArea>;

  export let value: string | undefined | null = '';

  let element: HTMLTextAreaElement | undefined;
  let borderTopWidth = '0px';
  let borderBottomWidth = '0px';

  function fitHeight() {
    if (!element) return;
    const scrollHeight = `${Math.min(element.scrollHeight, MAX_HEIGHT_PX)}px`;
    const heights = [scrollHeight, borderTopWidth, borderBottomWidth];
    element.style.height = `calc(${heights.join(' + ')})`;
  }

  function handleMountElement(el: HTMLTextAreaElement) {
    el.style.height = '1em';
    const computedStyle = getComputedStyle(el);
    borderTopWidth = computedStyle.borderTopWidth;
    borderBottomWidth = computedStyle.borderBottomWidth;
    fitHeight();
  }

  $: if (element) {
    handleMountElement(element);
  }

  $: value, fitHeight();
</script>

<TextArea bind:value bind:element {...$$restProps} />
