import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
import type { ModalController } from '@mathesar-component-library-dir/modal';
import type { ComponentAndProps } from '@mathesar-component-library-dir/types';

interface ButtonDetails {
  label: string;
  icon?: IconProps;
}

export interface ConfirmationProps<T> {
  title?: string | ComponentAndProps;
  /** An array of strings will be transformed into paragraphs. */
  body: string | string[] | ComponentAndProps;
  proceedButton: ButtonDetails;
  cancelButton: ButtonDetails;
  onProceed: () => Promise<T>;
  onSuccess: (value: T) => void;
  onError: (error: Error) => void;
}

const baseConfirmationProps: ConfirmationProps<unknown> = {
  body: 'Are you sure?',
  proceedButton: {
    label: 'Yes',
  },
  cancelButton: {
    label: 'Cancel',
  },
  onProceed: () => Promise.resolve(),
  onSuccess: () => {},
  onError: () => {},
};

export class ConfirmationController {
  modal: ModalController;

  confirmationProps: Writable<ConfirmationProps<unknown>>;

  resolve = writable<(isConfirmed: boolean) => void>(() => {});

  canProceed = writable(true);

  constructor(
    modalController: ModalController,
    initialConfirmationProps: ConfirmationProps<unknown>,
  ) {
    this.modal = modalController;
    this.confirmationProps = writable(initialConfirmationProps);
  }
}

interface MakeConfirm {
  confirm: <T>(props: Partial<ConfirmationProps<T>>) => Promise<boolean>;
  confirmationController: ConfirmationController;
}

export function makeConfirm({
  confirmationModal,
  defaultConfirmationProps,
}: {
  confirmationModal: ModalController;
  defaultConfirmationProps?: ConfirmationProps<unknown>;
}): MakeConfirm {
  const fullDefaultConfirmationProps = {
    ...baseConfirmationProps,
    ...defaultConfirmationProps,
  };
  const controller = new ConfirmationController(
    confirmationModal,
    fullDefaultConfirmationProps,
  );
  return {
    async confirm(props) {
      const fullProps = {
        ...fullDefaultConfirmationProps,
        ...props,
      } as ConfirmationProps<unknown>;
      return new Promise<boolean>((resolve) => {
        controller.resolve.set(resolve);
        controller.canProceed.set(true);
        controller.confirmationProps.set(fullProps);
        controller.modal.open();
      });
    },
    confirmationController: controller,
  };
}
