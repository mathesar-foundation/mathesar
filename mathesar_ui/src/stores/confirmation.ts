import { makeConfirm } from '@mathesar-component-library';
import { modal } from './modal';

const confirmationModal = modal.createVisibilityStore();

export const { confirm, confirmationController } = makeConfirm({ confirmationModal });
