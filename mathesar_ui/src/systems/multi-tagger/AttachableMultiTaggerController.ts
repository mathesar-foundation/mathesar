import { writable } from 'svelte/store';

import { makeContext } from '@mathesar/component-library/common/utils/contextUtils';

import MultiTaggerController, {
  type MultiTaggerProps,
} from './MultiTaggerController';

interface AttachableMultiTaggerControllerProps extends MultiTaggerProps {
  triggerElement: HTMLElement;
}

export class AttachableMultiTaggerController {
  triggerElement = writable<HTMLElement | undefined>(undefined);

  multiTagger = writable<MultiTaggerController | undefined>(undefined);

  async acquireUserSelection(props: AttachableMultiTaggerControllerProps) {
    this.triggerElement.set(props.triggerElement);
    const multiTagger = new MultiTaggerController(props);
    this.multiTagger.set(multiTagger);
    await multiTagger.getReady();
    const selection = await multiTagger.acquireUserSelection();
    this.close();
    return selection;
  }

  close() {
    this.multiTagger.set(undefined);
  }
}

export const multiTaggerContext =
  makeContext<AttachableMultiTaggerController>();
