// @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
import { createPopper } from '@popperjs/core/dist/umd/popper.min';
import type {
  ModifierArguments,
  Options,
  Instance,
  VirtualElement,
} from '@popperjs/core/lib/types';
import type { ActionReturn } from 'svelte/action';

interface Parameters {
  reference?: VirtualElement;
  options?: Partial<Options>;
}

export default function popper(
  node: HTMLElement,
  actionOpts: Parameters,
): ActionReturn<Parameters> {
  let popperInstance: Instance;
  let prevReference: VirtualElement | undefined;

  function create(reference?: VirtualElement, options?: Partial<Options>) {
    if (!reference) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    popperInstance = createPopper(reference, node, {
      placement: options?.placement || 'bottom-start',
      modifiers: [
        {
          name: 'setMinWidth',
          enabled: true,
          phase: 'beforeWrite',
          requires: ['computeStyles'],
          // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
          fn: (obj: ModifierArguments<unknown>): void => {
            // TODO: Make the default value configurable
            const widthToSet = Math.min(250, obj.state.rects.reference.width);
            // eslint-disable-next-line no-param-reassign
            obj.state.styles.popper.minWidth = `${widthToSet}px`;
          },
          // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
          effect: (obj: ModifierArguments<unknown>): void => {
            const width = (obj.state.elements.reference as HTMLElement)
              .offsetWidth;
            const widthToSet = Math.min(250, width);
            // eslint-disable-next-line no-param-reassign
            obj.state.elements.popper.style.minWidth = `${widthToSet}px`;
          },
        },
        {
          name: 'flip',
        },
        {
          name: 'offset',
          options: {
            offset: [0, 0],
          },
        },
      ],
    }) as Instance;
  }

  function destroy() {
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
