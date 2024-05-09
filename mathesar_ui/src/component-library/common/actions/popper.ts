// @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
import { createPopper } from '@popperjs/core/dist/umd/popper.min';
import type {
  Instance,
  ModifierArguments,
  Options,
  VirtualElement,
} from '@popperjs/core/lib/types';
import type { ActionReturn } from 'svelte/action';

interface Parameters {
  reference?: VirtualElement;
  options?: Partial<Options>;
}

/**
 * Merge the default modifiers with the supplied modifiers, ensuring that there
 * are no duplicates, by modifier name. When a modifier with the same name
 * occurs, use the supplied modifier instead of the default modifier.
 */
function buildModifiers(
  suppliedModifiers: Options['modifiers'],
): Options['modifiers'] {
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
        // TODO: Make the default value configurable
        const widthToSet = Math.min(250, obj.state.rects.reference.width);
        // eslint-disable-next-line no-param-reassign
        obj.state.styles.popper.minWidth = `${widthToSet}px`;
      },
      effect: (obj: ModifierArguments<Record<string, unknown>>): void => {
        const width = (obj.state.elements.reference as HTMLElement).offsetWidth;
        const widthToSet = Math.min(250, width);
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

  function create(reference?: VirtualElement, options?: Partial<Options>) {
    if (!reference) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    popperInstance = createPopper(reference, node, {
      placement: options?.placement || 'bottom-start',
      modifiers: buildModifiers(options?.modifiers ?? []),
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
