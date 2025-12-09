import { writable } from 'svelte/store';

import { makeContext } from '@mathesar/component-library/common/utils/contextUtils';

import MultiTaggerController, {
  type MultiTaggerProps,
} from './MultiTaggerController';

interface AttachableMultiTaggerControllerProps extends MultiTaggerProps {
  triggerElement: HTMLElement;
  onMappingChange: () => unknown;
}

export class AttachableMultiTaggerController {
  triggerElement = writable<HTMLElement | undefined>(undefined);

  multiTagger = writable<MultiTaggerController | undefined>(undefined);

  open(props: AttachableMultiTaggerControllerProps) {
    this.triggerElement.set(props.triggerElement);
    const multiTagger = new MultiTaggerController({
      ...props,
      onMappingChange: props.onMappingChange,
    });
    this.multiTagger.set(multiTagger);
    void multiTagger.getRecords();
  }

  close() {
    this.multiTagger.set(undefined);
  }
}

export const multiTaggerContext =
  makeContext<AttachableMultiTaggerController>();
