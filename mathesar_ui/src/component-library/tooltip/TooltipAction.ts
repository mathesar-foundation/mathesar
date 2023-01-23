import type { ActionReturn } from 'svelte/action';
import AttachableDropdown from '@mathesar-component-library-dir/dropdown/AttachableDropdown.svelte';
import type { ComponentAndProps } from '@mathesar-component-library-dir/types';

type Content = string | string[] | ComponentAndProps;

export default function tooltip(
  node: HTMLElement,
  content: Content,
): ActionReturn {
  const tooltipComponent = new AttachableDropdown({
    props: {
      trigger: node,
      placement: 'top',
      content,
      class: 'tooltip',
    },
    target: document.body,
  });

  function showTooltip() {
    tooltipComponent.$set({ isOpen: true });
  }
  function hideTooltip() {
    tooltipComponent.$set({ isOpen: false });
  }

  node.addEventListener('mouseenter', showTooltip);
  node.addEventListener('mouseleave', hideTooltip);

  function update(newcontent: Content) {
    tooltipComponent.$set({ content: newcontent });
  }

  function destroy() {
    node.removeEventListener('mouseenter', showTooltip);
    node.removeEventListener('mouseleave', hideTooltip);
    tooltipComponent.$destroy();
  }

  return {
    update,
    destroy,
  };
}
