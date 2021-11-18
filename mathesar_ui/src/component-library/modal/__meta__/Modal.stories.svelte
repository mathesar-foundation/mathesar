<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import { Button } from '@mathesar-component-library';
  import Modal from '../Modal.svelte';
  import { ModalMultiplexer } from '../ModalMultiplexer';

  const meta = {
    title: 'Systems/Modal',
  };

  const modal = new ModalMultiplexer();

  const basicModal = modal.createVisibilityStore();
  const chainModal = modal.createVisibilityStore();
  const hardToCloseModal = modal.createVisibilityStore();
  const titleFreeModal = modal.createVisibilityStore();
  const extraLongTitleModal = modal.createVisibilityStore();
  const richTextTitle = modal.createVisibilityStore();
  const verboseModal = modal.createVisibilityStore();

  let answer = '';
  $: answerIsCorrect = answer === '4';
</script>

<Meta {...meta} />

<Story name="Basic">
  <h2>Example modals</h2>
  <ul>
    <li><Button on:click={() => basicModal.open()}>One that's pretty basic</Button></li>
    <li><Button on:click={() => chainModal.open()}>One that opens another one</Button></li>
    <li><Button on:click={() => hardToCloseModal.open()}>One that's hard to close</Button></li>
    <li><Button on:click={() => titleFreeModal.open()}>One without a title</Button></li>
    <li><Button on:click={() => extraLongTitleModal.open()}>One with a super long title</Button></li>
    <li><Button on:click={() => richTextTitle.open()}>One with a rich text title</Button></li>
    <li><Button on:click={() => verboseModal.open()}>One with a lot of text</Button></li>
  </ul>

  <Modal
    bind:isOpen={$basicModal}
    title="Basic modal"
    let:close
  >
    Here is modal content
    <div slot="footer">
      <p>This is the modal footer</p>
      <p><Button on:click={close}>Here's a close button that uses the slot prop</Button></p>
    </div>
  </Modal>

  <Modal bind:isOpen={$chainModal} title="Go ahead and open another modal">
    <p>This modal has a button which opens another modal. Generally we don't want to do this, because it's poor UX, but this demonstrates what happens.</p>
    <Button on:click={() => basicModal.open()}>Open that basic modal (this one will close)</Button>
  </Modal>

  <Modal
    bind:isOpen={$hardToCloseModal}
    title="Hard to close"
    allowClose={answerIsCorrect}
    on:close={() => { answer = ''; }}
  >
    <p>Answer the quesion to unlock the close button.</p>
    <p>2 + 2 = <input type="text" bind:value={answer} /></p>
  </Modal>

  <Modal bind:isOpen={$titleFreeModal}>
    Wow, this one is small
  </Modal>

  <Modal
    bind:isOpen={$extraLongTitleModal}
    title="You are now seeing a modal dialog with a title long enough to cause it to wrap and display on multiple lines"
  >
    This is the content
  </Modal>

  <Modal bind:isOpen={$richTextTitle}>
    <div slot=title>Here's a title with <em>formatting!</em></div>
    This is the content
  </Modal>

  <Modal bind:isOpen={$verboseModal}>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?</p>
    <p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.</p>
    <div slot=footer>This is the footer</div>
  </Modal>

</Story>

<style>
li {
  margin: 1em 0;
}
</style>
