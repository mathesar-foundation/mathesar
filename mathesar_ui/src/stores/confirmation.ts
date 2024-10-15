import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import PhraseContainingIdentifier from '@mathesar/components/PhraseContainingIdentifier.svelte';
import { iconDeleteMajor } from '@mathesar/icons';
import type { ConfirmationProps } from '@mathesar-component-library';
import { makeConfirm } from '@mathesar-component-library';

import { modal } from './modal';
import { toast } from './toast';

const confirmationModal = modal.spawnModalController();

export const { confirm, confirmationController } = makeConfirm({
  confirmationModal,
});

interface ConfirmDeleteProps<T> extends Partial<ConfirmationProps<T>> {
  /** e.g. the name of the table, column, etc */
  identifierName?: string;
  /** the "thing" you're deleting, e.g. 'column', 'table', 'tables', '3 rows' etc. */
  identifierType: string;
}

export function confirmDelete<T>(
  props: ConfirmDeleteProps<T>,
): ReturnType<typeof confirm> {
  const type = props.identifierType;

  function getTitle() {
    if (props.identifierName) {
      return {
        component: PhraseContainingIdentifier,
        props: {
          identifier: props.identifierName,
          wrappingString: get(_)('delete_item_question_with_identifier', {
            values: { item: type },
          }),
        },
      };
    }
    return get(_)('delete_item_question', { values: { item: type } });
  }

  return confirm({
    title: getTitle(),
    body: get(_)('are_you_sure_to_proceed'),
    proceedButton: {
      label: get(_)('delete_item', { values: { item: type } }),
      icon: iconDeleteMajor,
    },
    onError: (e) =>
      toast.error(
        `${get(_)('unable_to_delete_item', { values: { item: type } })} ${
          e.message
        }`,
      ),
    ...props,
  });
}
