import { FormattedInput } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

// Standard Display Component
import { EmailFormatter } from '../../../utils/email/EmailFormatter';

import TextBoxCell from './components/textbox/TextBoxCell.svelte';
import type { CellComponentFactory } from './typeDefinitions';

// Import your fixed formatter logic

// --- THE FIX: We define the object without importing the broken type file ---

const emailType: CellComponentFactory = {
  // VIEW MODE: Show standard text display
  get: (): ComponentAndProps => ({
    component: TextBoxCell,
    props: {},
  }),

  // EDIT MODE: Use FormattedInput (from library) + EmailFormatter
  getInput: (): ComponentAndProps => ({
    component: FormattedInput,
    props: {
      formatter: new EmailFormatter(),
      placeholder: 'Enter email address',
    },
  }),

  getDisplayFormatter: () => (v) => String(v),
};

export default emailType;
