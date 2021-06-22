import { createPopper } from '@popperjs/core/lib/popper-lite';
import flip from '@popperjs/core/lib/modifiers/flip';
import type { ModifierArguments, Options, Instance } from '@popperjs/core/lib/types';
import type { Action } from './types';

export default function popper(
  node: HTMLElement,
  actionOpts: {
    reference: HTMLElement,
    popperOpts?: Options
  },
) : Action {
  let popperInstance: Instance;
  let prevReference: HTMLElement = null;

  function create(reference: HTMLElement, options?: Options) {
    if (reference) {
      popperInstance = createPopper(reference, node, {
        placement: options?.placement || 'bottom-start',
        modifiers: [
          {
            name: 'setMinWidth',
            enabled: true,
            phase: 'beforeWrite',
            requires: ['computeStyles'],
            fn: (obj: ModifierArguments<unknown>): void => {
              // eslint-disable-next-line no-param-reassign
              obj.state.styles.popper.minWidth = `${obj.state.rects.reference.width}px`;
            },
            effect: (obj: ModifierArguments<unknown>): void => {
              const width = (obj.state.elements.reference as HTMLElement).offsetWidth;
              // eslint-disable-next-line no-param-reassign
              obj.state.elements.popper.style.minWidth = `${width}px`;
            },
          },
          flip,
          {
            name: 'offset',
            options: {
              offset: [0, 0],
            },
          },
        ],
      });
    }
  }

  function destroy() {
    popperInstance?.destroy();
    prevReference = null;
  }

  async function update(opts: {
    reference: HTMLElement,
    options?: Options
  }) {
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

  create(actionOpts.reference, actionOpts.popperOpts);

  return {
    update,
    destroy,
  };
}
