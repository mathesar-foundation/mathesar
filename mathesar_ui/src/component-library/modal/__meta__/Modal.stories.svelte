<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import { Button } from '@mathesar-component-library';
  import ControlledModal from '../ControlledModal.svelte';
  import ModalMultiplexer from '../ModalMultiplexer';

  const modal = new ModalMultiplexer();

  const basicModal = modal.spawnModalController();
  const chainModal = modal.spawnModalController();
  const hardToCloseModal = modal.spawnModalController();
  const titleFreeModal = modal.spawnModalController();
  const extraLongTitleModal = modal.spawnModalController();
  const richTextTitle = modal.spawnModalController();
  const verboseModal = modal.spawnModalController();

  let answer = '';
  $: answerIsCorrect = answer === '4';
</script>

<Meta title="Systems/Modal" />

<Story name="Basic">
  <h2>Example modals</h2>
  <ul>
    <li>
      <Button appearance="primary" on:click={() => basicModal.open()}>
        Basic
      </Button>
    </li>
    <li>
      <Button appearance="primary" on:click={() => chainModal.open()}>
        Nested
      </Button>
    </li>
    <li>
      <Button appearance="primary" on:click={() => hardToCloseModal.open()}>
        Hard to close
      </Button>
    </li>
    <li>
      <Button appearance="primary" on:click={() => titleFreeModal.open()}>
        No title
      </Button>
    </li>
    <li>
      <Button appearance="primary" on:click={() => extraLongTitleModal.open()}>
        Long title
      </Button>
    </li>
    <li>
      <Button appearance="primary" on:click={() => richTextTitle.open()}>
        Rich text title
      </Button>
    </li>
    <li>
      <Button appearance="primary" on:click={() => verboseModal.open()}>
        Long content
      </Button>
    </li>
  </ul>

  <ControlledModal controller={basicModal} title="Basic modal">
    Here is modal content
    <div slot="footer">
      <p>This is the modal footer</p>
    </div>
  </ControlledModal>

  <ControlledModal
    controller={chainModal}
    title="Go ahead and open another modal"
  >
    <p>This modal has a button which opens another modal.</p>
    <Button appearance="primary" on:click={() => basicModal.open()}
      >Open that basic modal</Button
    >
    <p>
      Notice that this modal remains open underneath the overlay and there is no
      way to close it until the upper modal is closed.
    </p>
  </ControlledModal>

  <ControlledModal
    controller={hardToCloseModal}
    title="Hard to close"
    allowClose={answerIsCorrect}
    on:close={() => {
      answer = '';
    }}
  >
    <p>Answer the question to unlock the close button.</p>
    <p>2 + 2 = <input type="text" bind:value={answer} /></p>
  </ControlledModal>

  <ControlledModal controller={titleFreeModal}>
    Wow, this one is small
  </ControlledModal>

  <ControlledModal
    controller={extraLongTitleModal}
    title="You are now seeing a modal dialog with a title long enough to cause it to wrap and display on multiple lines"
  >
    This is the content
  </ControlledModal>

  <ControlledModal controller={richTextTitle}>
    <div slot="title">Here's a title with <em>formatting!</em></div>
    This is the content
  </ControlledModal>

  <ControlledModal controller={verboseModal}>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
      velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
      cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
      est laborum.
    </p>
    <p>
      Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
      doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo
      inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
      Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut
      fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem
      sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit
      amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora
      incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad
      minima veniam, quis nostrum exercitationem ullam corporis suscipit
      laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum
      iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae
      consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
    </p>
    <p>
      At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
      praesentium voluptatum deleniti atque corrupti quos dolores et quas
      molestias excepturi sint occaecati cupiditate non provident, similique
      sunt in culpa qui officia deserunt mollitia animi, id est laborum et
      dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.
      Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil
      impedit quo minus id quod maxime placeat facere possimus, omnis voluptas
      assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut
      officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates
      repudiandae sint et molestiae non recusandae. Itaque earum rerum hic
      tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias
      consequatur aut perferendis doloribus asperiores repellat.
    </p>
    <div slot="footer">This is the footer</div>
  </ControlledModal>
</Story>

<style>
  li {
    margin: 1em 0;
  }
</style>
