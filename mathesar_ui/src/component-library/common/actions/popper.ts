// @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
import { createPopper } from '@popperjs/core/dist/umd/popper.min';
import type {
  Instance,
  ModifierArguments,
  Options,
  VirtualElement,
} from '@popperjs/core/lib/types';
import type { ActionReturn } from 'svelte/action';

interface CustomModifierOptions {
  /**
   * By default, we ensure that the popper content width is no smaller than the
   * width of its trigger element — unless the trigger element is wider than
   * 250px, in which case it ensures that the popper content width is no smaller
   * than 250px.
   *
   * This option controls that threshold. Set it to 0 if you want to disable
   * this min-width behavior, allowing the popper content to be quite narrow.
   */
  matchTriggerWidthPxUpTo?: number;
}

interface Parameters {
  reference?: VirtualElement;
  options?: Partial<Options>;
  /**
   * When true, the content element will automatically reposition when it
   * resizes.
   */
  autoReposition?: boolean;
  customModifierOptions?: CustomModifierOptions;
}

/**
 * Merge the default modifiers with the supplied modifiers, ensuring that there
 * are no duplicates, by modifier name. When a modifier with the same name
 * occurs, use the supplied modifier instead of the default modifier.
 */
function buildModifiers(
  suppliedModifiers: Options['modifiers'],
  modifierOptions: CustomModifierOptions = {},
): Options['modifiers'] {
  const matchTriggerWidthPxUpTo =
    modifierOptions.matchTriggerWidthPxUpTo ?? 250;

  const defaultModifiers: Options['modifiers'] = [
    {
      name: 'flip',
    },
    {
      name: 'preventOverflow',
      options: {
        altAxis: true,
      },
    },
    {
      name: 'offset',
      options: {
        offset: [0, 0],
      },
    },
  ];
  const customModifiers: Options['modifiers'] = [
    {
      name: 'setMinWidth',
      enabled: true,
      phase: 'beforeWrite',
      requires: ['computeStyles'],
      fn: (obj: ModifierArguments<Record<string, unknown>>): void => {
        const widthToSet = Math.min(
          matchTriggerWidthPxUpTo,
          obj.state.rects.reference.width,
        );
        // eslint-disable-next-line no-param-reassign
        obj.state.styles.popper.minWidth = `${widthToSet}px`;
      },
      effect: (obj: ModifierArguments<Record<string, unknown>>): void => {
        const width = (obj.state.elements.reference as HTMLElement).offsetWidth;
        const widthToSet = Math.min(matchTriggerWidthPxUpTo, width);
        // eslint-disable-next-line no-param-reassign
        obj.state.elements.popper.style.minWidth = `${widthToSet}px`;
      },
    },
  ];
  const modifiers = [...defaultModifiers, ...customModifiers];
  suppliedModifiers.forEach((modifier) => {
    const index = modifiers.findIndex((m) => m.name === modifier.name);
    if (index === -1) {
      modifiers.push(modifier);
    } else {
      modifiers[index] = modifier;
    }
  });
  return modifiers;
}

export default function popper(
  node: HTMLElement,
  actionOpts: Parameters,
): ActionReturn<Parameters> {
  let popperInstance: Instance;
  let prevReference: VirtualElement | undefined;
  let observer: ResizeObserver | undefined;
  const autoReposition = actionOpts.autoReposition ?? false;
  const scrollListeners: Array<{ element: HTMLElement | Window; listener: () => void }> = [];

  function handleScroll() {
    if (popperInstance) {
      void popperInstance.update();
    }
  }

  function addScrollListeners(reference?: VirtualElement) {
    // Remove existing scroll listeners
    scrollListeners.forEach(({ element, listener }) => {
      element.removeEventListener('scroll', listener);
    });
    scrollListeners.length = 0;

    if (!reference || !autoReposition) {
      return;
    }

    // Add scroll listener to window
    scrollListeners.push({ element: window, listener: handleScroll });
    window.addEventListener('scroll', handleScroll, true);

    // Add scroll listeners to all scrollable parent elements
    let parent = (reference as { contextElement?: HTMLElement }).contextElement?.parentElement;
    if (!parent && 'getBoundingClientRect' in reference) {
      // For virtual elements, try to find a real DOM element
      const rect = reference.getBoundingClientRect();
      parent = document.elementFromPoint(rect.x, rect.y)?.parentElement ?? null;
    }

    while (parent) {
      const { overflow, overflowX, overflowY } = window.getComputedStyle(parent);
      const isScrollable = /(auto|scroll)/.test(overflow + overflowX + overflowY);

      if (isScrollable) {
        scrollListeners.push({ element: parent, listener: handleScroll });
        parent.addEventListener('scroll', handleScroll);
      }
      parent = parent.parentElement;
    }
  }

  function removeScrollListeners() {
    scrollListeners.forEach(({ element, listener }) => {
      element.removeEventListener('scroll', listener);
    });
    scrollListeners.length = 0;
  }

  function create(reference?: VirtualElement, options?: Partial<Options>) {
    if (!reference) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    popperInstance = createPopper(reference, node, {
      placement: options?.placement || 'bottom-start',
      modifiers: buildModifiers(
        options?.modifiers ?? [],
        actionOpts.customModifierOptions,
      ),
    }) as Instance;

    if (autoReposition) {
      observer = new ResizeObserver(() => {
        void popperInstance.update();
      });
      observer.observe(node);
      addScrollListeners(reference);
    }
  }

  function destroy() {
    observer?.disconnect();
    removeScrollListeners();
    popperInstance?.destroy();
    prevReference = undefined;
  }

  function update(opts: Parameters) {
    const { reference, options } = opts;

    if (!reference) {
      destroy();
      return;
    }

    if (!popperInstance) {
      create(reference, options);
      return;
    }

    if (prevReference !== reference) {
      destroy();
      create(reference, options);
      prevReference = reference;
      return;
    }

    if (options) {
      void popperInstance.setOptions(options);
    }
  }

  create(actionOpts.reference, actionOpts.options);

  return {
    update,
    destroy,
  };
}

export function getVirtualReferenceElement(pointerPosition: {
  clientX: number;
  clientY: number;
}) {
  const x = pointerPosition.clientX;
  const y = pointerPosition.clientY;
  return {
    getBoundingClientRect: () => ({
      width: 0,
      height: 0,
      x,
      y,
      top: y,
      right: x,
      bottom: y,
      left: x,
      toJSON: () => ({ x, y }),
    }),
  };
}
