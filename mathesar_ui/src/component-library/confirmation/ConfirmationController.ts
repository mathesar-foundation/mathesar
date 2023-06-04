import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import type { ModalController } from '@mathesar-component-library-dir/modal';
import type { ComponentAndProps } from '@mathesar-component-library-dir/types';

interface ButtonDetails {
  label: string;
  icon?: IconProps;
}

export interface ConfirmationProps {
  title?: string | ComponentAndProps;
  /** An array of strings will be transformed into paragraphs. */
  body: string | string[] | ComponentAndProps;
  proceedButton: ButtonDetails;
  cancelButton: ButtonDetails;
  onProceed: () => Promise<void>;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

const baseConfirmationProps: ConfirmationProps = {
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

  confirmationProps: Writable<ConfirmationProps>;

  resolve = writable<(isConfirmed: boolean) => void>(() => {});

  canProceed = writable(true);

  constructor(
    modalController: ModalController,
    initialConfirmationProps: ConfirmationProps,
  ) {
    this.modal = modalController;
    this.confirmationProps = writable(initialConfirmationProps);
  }
}

interface MakeConfirm {
  confirm: (props: Partial<ConfirmationProps>) => Promise<boolean>;
  confirmationController: ConfirmationController;
}

export function makeConfirm({
  confirmationModal,
  defaultConfirmationProps,
}: {
  confirmationModal: ModalController;
  defaultConfirmationProps?: ConfirmationProps;
}): MakeConfirm {
  const fullDefaultConfirmationProps = {
    ...baseConfirmationProps,
    ...defaultConfirmationProps,
  };
  const controller = new ConfirmationController(
    confirmationModal,
    fullDefaultConfirmationProps,
  );
  async function confirm(props: Partial<ConfirmationProps>) {
    return new Promise<boolean>((resolve) => {
      controller.resolve.set(resolve);
      controller.canProceed.set(true);
      controller.confirmationProps.set({
        ...fullDefaultConfirmationProps,
        ...props,
      });
      controller.modal.open();
    });
  }
  return { confirm, confirmationController: controller };
}
