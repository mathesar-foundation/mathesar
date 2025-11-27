import { FormattedInput } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';

// Standard Display Component
import TextBoxCell from '../components/textbox/TextBoxCell.svelte'; 

// Import your fixed formatter logic
import { EmailFormatter } from '../../../utils/email/EmailFormatter'; 

// --- THE FIX: We define the object without importing the broken type file ---

const emailType = {
  // VIEW MODE: Show standard text display
  get: (
    column: RawColumnWithMetadata
  ): ComponentAndProps<any> => ({
    component: TextBoxCell,
    props: {},
  }),

  // EDIT MODE: Use FormattedInput (from library) + your logic (THE FIX)
  getInput: (
    column: RawColumnWithMetadata
  ): ComponentAndProps<any> => ({
    component: FormattedInput,
    props: {
      formatter: new EmailFormatter(),
      placeholder: 'Enter email address',
    },
  }),

  getDisplayFormatter: () => String,
};

export default emailType;