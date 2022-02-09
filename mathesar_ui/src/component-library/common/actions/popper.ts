// @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
import { createPopper } from '@popperjs/core/dist/umd/popper.min';
import type {
  ModifierArguments,
  Options,
  Instance,
} from '@popperjs/core/lib/types';
import type { Action } from './types';

export default function popper(
  node: HTMLElement,
  actionOpts: {
    reference: HTMLElement;
    options?: Partial<Options>;
  },
): Action {
  let popperInstance: Instance;
  let prevReference: HTMLElement = null;

  function create(reference: HTMLElement, options?: Partial<Options>) {
    if (reference) {
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
              // eslint-disable-next-line no-param-reassign
              obj.state.styles.popper.minWidth = `${obj.state.rects.reference.width}px`;
            },
            // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
            effect: (obj: ModifierArguments<unknown>): void => {
              const width = (obj.state.elements.reference as HTMLElement)
                .offsetWidth;
              // eslint-disable-next-line no-param-reassign
              obj.state.elements.popper.style.minWidth = `${width}px`;
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
  }

  function destroy() {
    popperInstance?.destroy();
    prevReference = null;
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
