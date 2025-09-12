import { makeContext } from '@mathesar/contexts/utils';

import type FileViewerController from './FileViewerController';

export const fileViewerContext = makeContext<FileViewerController>();
