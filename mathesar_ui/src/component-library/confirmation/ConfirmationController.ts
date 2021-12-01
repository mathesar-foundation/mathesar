import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import type { ModalVisibilityStore } from '@mathesar-component-library';
import type { IconFlip, IconRotate, ComponentAndProps } from '@mathesar-component-library/types';

interface IconDetails {
  data: IconDefinition,
  spin?: boolean,
  flip?: IconFlip,
  rotate?: IconRotate,
}

interface ButtonDetails {
  label: string,
  icon?: IconDetails,
}

export interface ConfirmationProps {
  title?: string | ComponentAndProps,
  /** An array of strings will be transformed into paragraphs. */
  body: string | string[] | ComponentAndProps,
  proceedButton: ButtonDetails,
  cancelButton: ButtonDetails,
  onProceed: () => Promise<void>,
  onSuccess: () => void,
  onError: (error: Error) => void,
}

const baseConfirmationProps: ConfirmationProps = {
  body: 'Are you sure?',
  proceedButton: {
    label: 'Yes',
    icon: { data: faCheck },
  },
  cancelButton: {
    label: 'Cancel',
    icon: { data: faArrowLeft },
  },
  onProceed: () => Promise.resolve(),
  onSuccess: () => {},
  onError: () => {},
};

export class ConfirmationController {
  modal: ModalVisibilityStore;

  confirmationProps: Writable<ConfirmationProps>;

  resolve = writable<(isConfirmed: boolean) => void>(() => {});

  constructor(
    modalVisibilityStore: ModalVisibilityStore,
    initialConfirmationProps: ConfirmationProps,
  ) {
    this.modal = modalVisibilityStore;
    this.confirmationProps = writable(initialConfirmationProps);
  }
}

interface MakeConfirm {
  confirm: (props: Partial<ConfirmationProps>) => Promise<boolean>,
  confirmationController: ConfirmationController,
}

export function makeConfirm({
  confirmationModal,
  defaultConfirmationProps,
}: {
  confirmationModal: ModalVisibilityStore,
  defaultConfirmationProps?: ConfirmationProps,
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
      controller.confirmationProps.set({
        ...fullDefaultConfirmationProps,
        ...props,
      });
      controller.modal.open();
    });
  }
  return { confirm, confirmationController: controller };
}
