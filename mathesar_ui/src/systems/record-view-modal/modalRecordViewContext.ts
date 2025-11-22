import { makeContext } from '@mathesar/component-library/common/utils/contextUtils';
import type RecordStore from '@mathesar/systems/record-view/RecordStore';
import type { ModalController } from '@mathesar-component-library';

export const modalRecordViewContext =
  makeContext<ModalController<RecordStore>>();
