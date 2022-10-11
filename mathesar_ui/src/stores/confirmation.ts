import type { ConfirmationProps } from '@mathesar-component-library';
import { makeConfirm } from '@mathesar-component-library';
import PhraseContainingIdentifier from '@mathesar/components/PhraseContainingIdentifier.svelte';
import { modal } from './modal';
import { toast } from './toast';

const confirmationModal = modal.spawnModalController();

export const { confirm, confirmationController } = makeConfirm({
  confirmationModal,
});

interface ConfirmDeleteProps extends Partial<ConfirmationProps> {
  /** e.g. the name of the table, column, etc */
  identifierName?: string;
  /** the "thing" you're deleting, e.g. 'column', 'table', 'tables', '3 rows' etc. */
  identifierType?: string;
}

export function confirmDelete(
  props: ConfirmDeleteProps,
): ReturnType<typeof confirm> {
  const type = props.identifierType;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const deletePhrase = `Delete${type ? ' ' : ''}${type}`;

  function getTitle() {
    const post = '?';
    if (props.identifierName) {
      return {
        component: PhraseContainingIdentifier,
        props: {
          pre: `${deletePhrase} `,
          identifier: props.identifierName,
          post,
        },
      };
    }
    return `${deletePhrase}${post}`;
  }

  return confirm({
    title: getTitle(),
    body: 'Are you sure you want to proceed?',
    proceedButton: { label: deletePhrase },
    onError: (e) => toast.error(`Unable to ${deletePhrase}. ${e.message}`),
    ...props,
  });
}
