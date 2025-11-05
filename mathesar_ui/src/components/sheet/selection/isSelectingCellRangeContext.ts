import type { Readable } from 'svelte/store';

import { makeContext } from '@mathesar-component-library';

export const isSelectingCellRangeContext = makeContext<Readable<boolean>>();
