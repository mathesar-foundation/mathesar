import { FormattedInput } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import EmailCell from './components/email/EmailCell.svelte';
import { EmailFormatter } from '../../../utils/email/EmailFormatter';

import type { CellComponentFactory } from './typeDefinitions';

const emailType: CellComponentFactory = {
  get: (): ComponentAndProps => ({ component: EmailCell }),
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
