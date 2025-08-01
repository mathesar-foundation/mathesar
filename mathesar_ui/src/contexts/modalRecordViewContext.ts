import type RecordStore from '@mathesar/stores/RecordStore';
import type { ModalController } from '@mathesar-component-library';

import { makeContext } from './utils';

export const modalRecordViewContext =
  makeContext<ModalController<RecordStore>>();
