// @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
import { createPopper } from '@popperjs/core/dist/umd/popper.min';
import type {
  ModifierArguments,
  Options,
  Instance,
  VirtualElement,
} from '@popperjs/core/lib/types';
import type { Action } from './actionsTypes';

export default function popper(
  node: HTMLElement,
  actionOpts: {
    reference?: VirtualElement;
    options?: Partial<Options>;
  },
): Action {
  let popperInstance: Instance;
  let prevReference: HTMLElement | undefined;

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

  async function update(opts: { reference: HTMLElement; options?: Options }) {
    const { reference, options } = opts;

    if (popperInstance) {
      if (prevReference !== reference) {
        destroy();
        create(reference, options);
        prevReference = reference;
      } else if (options) {
        await popperInstance.setOptions(options);
      }
    } else {
      create(reference, options);
    }
  }

  create(actionOpts.reference, actionOpts.options);

  return {
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    update,
    destroy,
  };
}
